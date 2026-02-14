import express from 'express';
import { User } from '../models/User.js';
import { Meal } from '../models/Meal.js';
import { WaterLog } from '../models/WaterLog.js';
import { ExerciseLog } from '../models/ExerciseLog.js';
import { Message } from '../models/Message.js';
import { config } from '../config.js';
import { handleIncoming } from '../services/coachEngine.js';

export const adminRouter = express.Router();

function isAuthorized(req) {
  const provided = req.headers['x-admin-token'] || req.query.token || req.body?.token;
  return Boolean(config.adminToken) && provided === config.adminToken;
}

adminRouter.use((req, res, next) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized admin access' });
  }
  return next();
});

adminRouter.get('/overview', async (_req, res) => {
  try {
    const [users, onboardedUsers, meals, waterLogs, workoutLogs, messages] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ onboardingComplete: true }),
      Meal.countDocuments({}),
      WaterLog.countDocuments({}),
      ExerciseLog.countDocuments({}),
      Message.countDocuments({})
    ]);

    return res.json({ users, onboardedUsers, meals, waterLogs, workoutLogs, messages });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch overview', details: error.message });
  }
});

adminRouter.get('/users', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const users = await User.find({}).sort({ createdAt: -1 }).limit(limit).lean();
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

adminRouter.get('/messages', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const phone = String(req.query.phone || '').trim();

    let userId;
    if (phone) {
      const user = await User.findOne({ phone }).lean();
      if (!user) return res.json({ messages: [] });
      userId = user._id;
    }

    const query = userId ? { userId } : {};
    const messages = await Message.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    return res.json({ messages });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
  }
});

adminRouter.post('/simulate', async (req, res) => {
  try {
    const phone = String(req.body?.phone || '').trim();
    const text = String(req.body?.text || '').trim();

    if (!phone || !text) {
      return res.status(400).json({ error: 'phone and text are required' });
    }

    const reply = await handleIncoming(phone, text);
    return res.json({ phone, incoming: text, reply });
  } catch (error) {
    return res.status(500).json({ error: 'Simulation failed', details: error.message });
  }
});
