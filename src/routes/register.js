import express from 'express';
import { User } from '../models/User.js';

export const registerRouter = express.Router();

const FREE_ACCESS_LIMIT = 200;
const supportedMedicalIssues = ['diabetes', 'high_bp', 'kidney_stone', 'thyroid', 'pcos', 'cholesterol', 'fatty_liver', 'acidity', 'ibs', 'anemia', 'asthma', 'arthritis'];

async function getUsageCounts() {
  const used = await User.countDocuments({ onboardingComplete: true });
  return {
    limit: FREE_ACCESS_LIMIT,
    used,
    remaining: Math.max(FREE_ACCESS_LIMIT - used, 0)
  };
}

registerRouter.get('/medical-options', (_req, res) => {
  return res.json({ medicalIssues: supportedMedicalIssues });
});

registerRouter.get('/capacity', async (_req, res) => {
  try {
    const capacity = await getUsageCounts();
    return res.json(capacity);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch capacity', details: error.message });
  }
});

registerRouter.post('/', async (req, res) => {
  try {
    const {
      name,
      phone,
      weight,
      height,
      goal,
      officeTiming,
      sleepHours,
      exerciseHabit,
      waterGoal,
      dailyBudget,
      dietType,
      medicalIssues,
      bodyShapeGoal,
      currentDiet,
      easyDietMode
    } = req.body || {};

    if (!name || !phone || !goal || !dietType || !currentDiet) {
      return res.status(400).json({ error: 'name, phone, goal, dietType, and currentDiet are required' });
    }

    const existing = await User.findOne({ phone });
    if (!existing) {
      const capacity = await getUsageCounts();
      if (capacity.remaining <= 0) {
        return res.status(403).json({
          error: 'Free registration limit reached',
          limit: capacity.limit,
          used: capacity.used,
          remaining: capacity.remaining
        });
      }
    }

    const nextMedicalIssues = Array.isArray(medicalIssues)
      ? medicalIssues.map((v) => String(v).toLowerCase().replace(/\s+/g, '_')).filter((v) => supportedMedicalIssues.includes(v))
      : [];

    const update = {
      name,
      phone,
      weight: Number(weight) || undefined,
      height: Number(height) || undefined,
      goal,
      officeTiming: officeTiming || '9am-6pm',
      jobType: (officeTiming || '').toLowerCase().includes('active') ? 'active' : 'desk',
      sleepHours: Number(sleepHours) || 7,
      exerciseHabit: exerciseHabit || 'none',
      waterGoal: Number(waterGoal) || 8,
      dailyBudget: Number(dailyBudget) || 250,
      dietType,
      medicalIssues: nextMedicalIssues,
      bodyShapeGoal: bodyShapeGoal || goal,
      currentDiet,
      easyDietMode: easyDietMode !== false,
      onboardingComplete: true
    };

    const user = await User.findOneAndUpdate({ phone }, { $set: update }, { upsert: true, new: true, setDefaultsOnInsert: true });

    const capacity = await getUsageCounts();
    return res.status(existing ? 200 : 201).json({
      message: existing ? 'Profile updated successfully' : 'Registration successful',
      freeAccess: capacity,
      user: {
        name: user.name,
        phone: user.phone,
        goal: user.goal,
        bodyShapeGoal: user.bodyShapeGoal,
        currentDiet: user.currentDiet,
        dietType: user.dietType,
        medicalIssues: user.medicalIssues,
        dailyBudget: user.dailyBudget,
        easyDietMode: user.easyDietMode
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});
