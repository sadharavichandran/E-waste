import { Router, Response } from 'express';
import { CollectionCentre } from '../models/CollectionCentre';
import { AuditLog } from '../models/AuditLog';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth';
import { broadcastRealtimeEvent } from '../services/websocketService';

const router = Router();

// ==========================================
// 1. Fetch Collection Centres (Role-Filtered)
// ==========================================
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const isSuperAdmin = req.user?.role === 'superadmin';
    const isAdmin = req.user?.role === 'admin';

    let centres;

    if (isSuperAdmin) {
      // SuperAdmin sees all centres including pending and rejected
      centres = await CollectionCentre.find({}).sort({ submittedAt: -1 });
    } else if (isAdmin) {
      // Centre Admin sees approved centres PLUS their own pending/submitted centre
      centres = await CollectionCentre.find({
        $or: [
          { approvalStatus: 'approved', isSuspended: false },
          { submittedByAdminId: req.userId },
        ],
      }).sort({ submittedAt: -1 });
    } else {
      // Public citizens only see verified, approved, non-suspended centres
      centres = await CollectionCentre.find({
        approvalStatus: 'approved',
        isSuspended: false,
      }).sort({ rating: -1 });
    }

    return res.json({ success: true, count: centres.length, data: centres });
  } catch (err: any) {
    console.error('[Fetch Centres Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. Fetch Single Centre by ID
// ==========================================
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const centre = await CollectionCentre.findOne({ id: req.params.id });
    if (!centre) {
      return res.status(404).json({ success: false, error: 'Collection centre not found' });
    }
    return res.json({ success: true, data: centre });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. Register or Create Centre
// ==========================================
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const centreData = req.body;
    const isSuperAdmin = req.user?.role === 'superadmin';

    const id = centreData.id || `cntr-${Date.now()}`;

    // Requirement: Approval status must remain 'pending' by default. Only SuperAdmin can directly create approved.
    const initialApproval = isSuperAdmin && centreData.approvalStatus ? centreData.approvalStatus : 'pending';

    const newCentre = new CollectionCentre({
      ...centreData,
      id,
      approvalStatus: initialApproval,
      submittedByAdminId: req.userId,
      submittedByAdminName: req.user?.name || centreData.submittedByAdminName || 'Facility Admin',
      submittedAt: new Date(),
    });

    await newCentre.save();

    // Log to Audit Log
    await AuditLog.create({
      id: `audit-${Date.now()}`,
      action: 'CENTRE_REGISTERED',
      entityType: 'centre',
      entityId: id,
      performedByUserId: req.userId,
      performedByUserName: req.user?.name || 'Administrator',
      performedByUserRole: req.user?.role || 'admin',
      details: { centreName: newCentre.name, city: newCentre.city },
    });

    broadcastRealtimeEvent('CENTRE_CREATED', newCentre);

    return res.status(201).json({ success: true, data: newCentre });
  } catch (err: any) {
    console.error('[Create Centre Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. Update Centre
// ==========================================
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await CollectionCentre.findOne({ id });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Collection centre not found' });
    }

    // Role check: Only the owning Centre Admin or a SuperAdmin can modify the centre!
    const isSuperAdmin = req.user?.role === 'superadmin';
    const isOwner = existing.submittedByAdminId === req.userId;

    if (!isSuperAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You are not authorized to update another facility.',
      });
    }

    const updates = { ...req.body };
    delete updates._id;
    delete updates.id;

    // Do not allow regular Centre Admin to modify approvalStatus or isSuspended
    if (!isSuperAdmin) {
      delete updates.approvalStatus;
      delete updates.isSuspended;
      delete updates.reviewedBySuperAdminId;
      delete updates.reviewedAt;
      delete updates.verificationNotes;
    }

    const updated = await CollectionCentre.findOneAndUpdate({ id }, updates, { new: true });

    broadcastRealtimeEvent('CENTRE_UPDATED', updated);

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. SuperAdmin Review: Approve or Reject
// ==========================================
router.post('/:id/review', requireAuth, requireRole(['superadmin']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { decision, notes } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ success: false, error: 'Decision must be "approved" or "rejected"' });
    }

    const centre = await CollectionCentre.findOne({ id });
    if (!centre) {
      return res.status(404).json({ success: false, error: 'Centre not found' });
    }

    centre.approvalStatus = decision;
    centre.reviewedBySuperAdminId = req.userId;
    centre.reviewedAt = new Date();
    centre.verificationNotes = notes || (decision === 'approved' ? 'Verified by Environmental Authority' : 'Application Rejected');

    await centre.save();

    await AuditLog.create({
      id: `audit-${Date.now()}`,
      action: decision === 'approved' ? 'CENTRE_APPROVED' : 'CENTRE_REJECTED',
      entityType: 'centre',
      entityId: id,
      performedByUserId: req.userId,
      performedByUserName: req.user?.name || 'SuperAdmin',
      performedByUserRole: 'superadmin',
      details: { decision, notes: centre.verificationNotes },
    });

    broadcastRealtimeEvent('CENTRE_REVIEWED', centre);

    return res.json({ success: true, data: centre });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 6. SuperAdmin Suspension Toggle
// ==========================================
router.post('/:id/suspend', requireAuth, requireRole(['superadmin']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { suspend, reason } = req.body;

    const centre = await CollectionCentre.findOne({ id });
    if (!centre) {
      return res.status(404).json({ success: false, error: 'Centre not found' });
    }

    centre.isSuspended = Boolean(suspend);
    await centre.save();

    await AuditLog.create({
      id: `audit-${Date.now()}`,
      action: centre.isSuspended ? 'CENTRE_SUSPENDED' : 'CENTRE_REACTIVATED',
      entityType: 'centre',
      entityId: id,
      performedByUserId: req.userId,
      performedByUserName: req.user?.name || 'SuperAdmin',
      performedByUserRole: 'superadmin',
      details: { reason },
    });

    broadcastRealtimeEvent('CENTRE_UPDATED', centre);

    return res.json({ success: true, data: centre });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 7. Delete Centre (SuperAdmin Only)
// ==========================================
router.delete('/:id', requireAuth, requireRole(['superadmin']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await CollectionCentre.findOneAndDelete({ id });
    if (!result) {
      return res.status(404).json({ success: false, error: 'Centre not found' });
    }

    broadcastRealtimeEvent('CENTRE_DELETED', { id });

    return res.json({ success: true, message: 'Centre removed successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
