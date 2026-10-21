import { Router, Request, Response } from 'express';
import { getDbStatus } from '../config/db';
import { User } from '../models/User';
import { CollectionCentre } from '../models/CollectionCentre';
import { PickupRequest } from '../models/PickupRequest';
import { ActivityHistory } from '../models/ActivityHistory';
import { getConnectedClientsCount, broadcastRealtimeEvent } from '../services/websocketService';

const router = Router();

// ==========================================
// 1. Health & Database Status Check
// ==========================================
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const dbStatus = await getDbStatus();

    let counts = {
      users: 0,
      centres: 0,
      requests: 0,
      activities: 0,
    };

    if (dbStatus.isConnected) {
      const [uCount, cCount, rCount, aCount] = await Promise.all([
        User.countDocuments().catch(() => 0),
        CollectionCentre.countDocuments().catch(() => 0),
        PickupRequest.countDocuments().catch(() => 0),
        ActivityHistory.countDocuments().catch(() => 0),
      ]);
      counts = { users: uCount, centres: cCount, requests: rCount, activities: aCount };
    }

    return res.json({
      success: true,
      service: 'EcoLoop API Server',
      database: 'MongoDB',
      status: dbStatus,
      counts,
      activeWebSocketClients: getConnectedClientsCount(),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. Safe Supabase Data Importer / Migrator
// Reads records from client payload or Supabase and loads them into MongoDB
// ==========================================
router.post('/import-from-supabase', async (req: Request, res: Response) => {
  try {
    const { centres = [], requests = [], history = [] } = req.body;

    let centresImported = 0;
    let requestsImported = 0;
    let historyImported = 0;

    // 1. Import centres
    for (const c of centres) {
      if (!c.id || !c.name) continue;
      await CollectionCentre.findOneAndUpdate(
        { id: c.id },
        {
          id: c.id,
          name: c.name,
          organization: c.organization || c.name,
          address: c.address || 'Operations Base',
          city: c.city || 'Central City',
          pincode: c.pincode || '600001',
          lat: typeof c.lat === 'number' ? c.lat : 13.0827,
          lng: typeof c.lng === 'number' ? c.lng : 80.2707,
          phone: c.phone || '',
          email: c.email || '',
          operatingHours: c.operatingHours || '9:00 AM - 6:00 PM',
          acceptedCategories: c.acceptedCategories || ['mobile', 'laptop'],
          isCertifiedR2: !!c.isCertifiedR2,
          isHazardousBatteryCertified: !!c.isHazardousBatteryCertified,
          centreType: c.centreType || 'Certified Recycler',
          licenseNumber: c.licenseNumber || '',
          approvalStatus: c.approvalStatus || 'pending',
          submittedByAdminId: c.submittedByAdminId || 'admin-legacy',
          submittedByAdminName: c.submittedByAdminName || 'Facility Admin',
          submittedAt: c.submittedAt ? new Date(c.submittedAt) : new Date(),
          rating: typeof c.rating === 'number' ? c.rating : 4.8,
          isSuspended: false,
        },
        { upsert: true, new: true }
      );
      centresImported++;
    }

    // 2. Import pickup requests
    for (const r of requests) {
      if (!r.id || !r.userName) continue;
      await PickupRequest.findOneAndUpdate(
        { id: r.id },
        {
          id: r.id,
          userId: r.userId || 'guest',
          userName: r.userName,
          contactNumber: r.contactNumber || '9999999999',
          email: r.email || 'user@example.com',
          category: r.category || 'other',
          deviceName: r.deviceName,
          quantity: r.quantity || 1,
          condition: r.condition || 'working',
          address: r.address || 'Address on record',
          city: r.city || 'Central City',
          pincode: r.pincode || '600001',
          preferredDate: r.preferredDate || new Date().toISOString().split('T')[0],
          preferredTimeSlot: r.preferredTimeSlot || 'morning',
          additionalInstructions: r.additionalInstructions,
          hasBatteryHazard: !!r.hasBatteryHazard,
          status: r.status || 'submitted',
          submittedAt: r.submittedAt ? new Date(r.submittedAt) : new Date(),
          statusHistory: r.statusHistory || [],
          pointsAwarded: !!r.pointsAwarded,
          pointsEarned: r.pointsEarned || 0,
          estimatedCo2SavedKg: r.estimatedCo2SavedKg || 0,
        },
        { upsert: true, new: true }
      );
      requestsImported++;
    }

    // 3. Import activity history
    for (const h of history) {
      if (!h.id || !h.title) continue;
      await ActivityHistory.findOneAndUpdate(
        { id: h.id },
        {
          id: h.id,
          requestId: h.requestId,
          title: h.title,
          description: h.description || '',
          date: h.date || new Date().toISOString().split('T')[0],
          points: h.points || 0,
          type: h.type || 'pickup',
        },
        { upsert: true, new: true }
      );
      historyImported++;
    }

    broadcastRealtimeEvent('DB_SYNCED', { centresImported, requestsImported, historyImported });

    return res.json({
      success: true,
      message: 'Migration data successfully stored in MongoDB.',
      imported: {
        centresCount: centresImported,
        requestsCount: requestsImported,
        historyCount: historyImported,
      },
    });
  } catch (err: any) {
    console.error('[Import Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. Clear All Collections (For empty-state verification)
// ==========================================
router.post('/clear-all', async (_req: Request, res: Response) => {
  try {
    await Promise.all([
      CollectionCentre.deleteMany({}),
      PickupRequest.deleteMany({}),
      ActivityHistory.deleteMany({}),
    ]);

    broadcastRealtimeEvent('DB_SYNCED', { cleared: true });

    return res.json({ success: true, message: 'All business collections cleared in MongoDB.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. Server-Side Default Accounts Provisioning
// Requirement: "Create Super Admin accounts only through a trusted server-side provisioning process."
// ==========================================
export const provisionDefaultSuperAdmin = async () => {
  try {
    const defaultAccounts = [
      {
        email: (process.env.SUPERADMIN_EMAIL || 'superadmin@ecoloop.org').toLowerCase().trim(),
        name: 'Dr. Sarah Al-Mansoor',
        role: 'superadmin' as const,
        organization: 'E-Waste Compliance Authority',
        city: 'Federal Directorate',
      },
      {
        email: 'admin@ecoloop.org',
        name: 'Marcus Sterling',
        role: 'admin' as const,
        organization: 'GreenLoop Logistics',
        city: 'San Francisco, CA',
      },
      {
        email: 'user@ecoloop.org',
        name: 'Avery Morgan',
        role: 'user' as const,
        organization: 'Community Resident',
        city: 'Oakland, CA',
      },
    ];

    for (const acc of defaultAccounts) {
      const existing = await User.findOne({ email: acc.email });
      if (!existing) {
        const u = new User({
          name: acc.name,
          email: acc.email,
          password: 'ecoloop2026',
          role: acc.role,
          organization: acc.organization,
          city: acc.city,
          isEmailVerified: true,
        });
        await u.save();
        console.log(`[Provisioning] Initialized default ${acc.role} account: ${acc.email}`);
      } else {
        // Reset password to ecoloop2026 if it was altered and clear any locks
        existing.password = 'ecoloop2026';
        existing.loginAttempts = 0;
        existing.lockUntil = undefined;
        existing.isEmailVerified = true;
        await existing.save();
      }
    }
  } catch (err) {
    console.warn('[Provisioning Warning]:', err);
  }
};

export default router;
