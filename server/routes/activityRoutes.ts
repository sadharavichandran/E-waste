import { Router, Response } from 'express';
import { ActivityHistory } from '../models/ActivityHistory';
import { AuthRequest } from '../middleware/auth';
import { broadcastRealtimeEvent } from '../services/websocketService';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const isCitizen = req.user?.role === 'user';
    let activities;

    if (isCitizen && req.userId) {
      activities = await ActivityHistory.find({
        $or: [{ userId: req.userId }, { userId: { $exists: false } }],
      }).sort({ createdAt: -1 });
    } else {
      activities = await ActivityHistory.find({}).sort({ createdAt: -1 });
    }

    return res.json({ success: true, count: activities.length, data: activities });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;
    const newActivity = new ActivityHistory({
      ...body,
      id: body.id || `act-${Date.now()}`,
      userId: req.userId || body.userId,
    });

    await newActivity.save();

    broadcastRealtimeEvent('ACTIVITY_CREATED', newActivity);

    return res.status(201).json({ success: true, data: newActivity });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
