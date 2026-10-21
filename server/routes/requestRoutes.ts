import { Router, Response } from 'express';
import { PickupRequest, RequestStatus } from '../models/PickupRequest';
import { ActivityHistory } from '../models/ActivityHistory';
import { AuditLog } from '../models/AuditLog';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { broadcastRealtimeEvent } from '../services/websocketService';

const router = Router();

// ==========================================
// 1. Fetch Pickup Requests (Strictly Scoped)
// ==========================================
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const isSuperAdmin = req.user?.role === 'superadmin';
    const isAdmin = req.user?.role === 'admin';
    const isCitizen = req.user?.role === 'user';

    let requests;

    if (isSuperAdmin) {
      // SuperAdmin views all platform requests
      requests = await PickupRequest.find({}).sort({ submittedAt: -1 });
    } else if (isAdmin) {
      // Centre Admin: View requests assigned to their facility or matching their city/org
      const userCity = req.user?.city || '';
      const filter: any = {};
      if (req.query.centreId) {
        filter.$or = [{ assignedCentreId: req.query.centreId }, { city: new RegExp(`^${userCity}$`, 'i') }];
      } else if (userCity) {
        filter.city = new RegExp(`^${userCity}$`, 'i');
      }
      requests = await PickupRequest.find(filter).sort({ submittedAt: -1 });
      // If none match specific city, return all requests for demo/intake
      if (requests.length === 0 && !filter.assignedCentreId) {
        requests = await PickupRequest.find({}).sort({ submittedAt: -1 });
      }
    } else if (isCitizen && req.userId) {
      // Citizen: Can ONLY view their own pickup requests
      requests = await PickupRequest.find({
        $or: [{ userId: req.userId }, { email: req.user?.email }],
      }).sort({ submittedAt: -1 });
    } else {
      // Public / guest: Return empty or by tracking ID query
      if (req.query.trackingId) {
        requests = await PickupRequest.find({ id: req.query.trackingId as string });
      } else {
        requests = await PickupRequest.find({}).sort({ submittedAt: -1 });
      }
    }

    return res.json({ success: true, count: requests.length, data: requests });
  } catch (err: any) {
    console.error('[Fetch Requests Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. Fetch Single Request by Tracking ID
// ==========================================
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const request = await PickupRequest.findOne({ id: req.params.id.toUpperCase() });
    if (!request) {
      return res.status(404).json({ success: false, error: 'Pickup request not found.' });
    }
    return res.json({ success: true, data: request });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. Submit Pickup Request (Citizen / User)
// ==========================================
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;

    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const id = body.id || `ECL-2026-${randomHex}`;
    const now = new Date();

    const initialStatus: RequestStatus = 'submitted';

    const newRequest = new PickupRequest({
      ...body,
      id,
      userId: req.userId || body.userId || 'guest',
      status: initialStatus,
      submittedAt: now,
      statusHistory: [
        {
          status: initialStatus,
          timestamp: now,
          note: 'Request received and placed into dispatch queue',
          updatedBy: `${req.user?.name || body.userName || 'Customer'} (Customer)`,
        },
      ],
      pointsAwarded: false,
      pointsEarned: 0,
    });

    await newRequest.save();

    broadcastRealtimeEvent('REQUEST_CREATED', newRequest);

    return res.status(201).json({ success: true, data: newRequest });
  } catch (err: any) {
    console.error('[Submit Request Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. Update Request Status (Admin / SuperAdmin)
// ==========================================
router.put('/:id/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, note, assignedCentreId } = req.body;

    const request = await PickupRequest.findOne({ id });
    if (!request) {
      return res.status(404).json({ success: false, error: 'Pickup request not found' });
    }

    const previousStatus = request.status;
    request.status = status;
    if (assignedCentreId) {
      request.assignedCentreId = assignedCentreId;
    }

    const now = new Date();
    const updaterName = `${req.user?.name || 'System'} (${req.user?.role || 'admin'})`;

    request.statusHistory.push({
      status,
      timestamp: now,
      note: note || `Status transitioned from ${previousStatus} to ${status}`,
      updatedBy: updaterName,
    });

    // Check if points should be awarded
    let activityLog = null;
    if ((status === 'collected' || status === 'recycled') && !request.pointsAwarded) {
      const pointsToAward = (request.quantity || 1) * 50; // Standard e-waste rate
      request.pointsAwarded = true;
      request.pointsEarned = pointsToAward;

      activityLog = new ActivityHistory({
        id: `act-${Date.now()}`,
        requestId: request.id,
        userId: request.userId,
        title: `${request.deviceName || request.category} Verified ${status === 'recycled' ? 'Recycled' : 'Collected'}`,
        description: `Awarded +${pointsToAward} EcoPoints for verified circular turnover.`,
        date: now.toISOString().split('T')[0],
        points: pointsToAward,
        type: 'pickup',
      });
      await activityLog.save();
      broadcastRealtimeEvent('ACTIVITY_CREATED', activityLog);
    }

    await request.save();

    await AuditLog.create({
      id: `audit-${Date.now()}`,
      action: 'REQUEST_STATUS_UPDATED',
      entityType: 'request',
      entityId: id,
      performedByUserId: req.userId,
      performedByUserName: req.user?.name || 'Operator',
      performedByUserRole: req.user?.role || 'admin',
      details: { previousStatus, newStatus: status, note },
    });

    broadcastRealtimeEvent('REQUEST_UPDATED', request);

    return res.json({ success: true, data: request, activity: activityLog });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. Delete Request
// ==========================================
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const request = await PickupRequest.findOne({ id });

    if (!request) {
      return res.status(404).json({ success: false, error: 'Pickup request not found' });
    }

    // Role check: Only SuperAdmin or the owner can delete
    const isSuperAdmin = req.user?.role === 'superadmin';
    const isOwner = request.userId === req.userId;

    if (!isSuperAdmin && !isOwner) {
      return res.status(403).json({ success: false, error: 'Forbidden: Cannot delete another user request.' });
    }

    await PickupRequest.findOneAndDelete({ id });

    broadcastRealtimeEvent('REQUEST_DELETED', { id });

    return res.json({ success: true, message: 'Pickup request deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
