import crypto from 'crypto';
import express from 'express';
import { User } from '../models/User.js';
import { sendWhatsAppText } from '../services/whatsappService.js';

export const registerRouter = express.Router();

const FREE_ACCESS_LIMIT = 200;
const OTP_TTL_MS = 10 * 60 * 1000;
const VERIFY_TTL_MS = 15 * 60 * 1000;
const supportedMedicalIssues = ['diabetes', 'high_bp', 'kidney_stone', 'thyroid', 'pcos', 'cholesterol', 'fatty_liver', 'acidity', 'ibs', 'anemia', 'asthma', 'arthritis'];
const officeStartOptions = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '16:00', '20:00', '22:00'];
const officeEndOptions = ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '06:00'];
const workTypeOptions = ['desk', 'hybrid', 'active', 'shift'];

const otpStore = new Map();
const verifyStore = new Map();

function normalizePhone(phone) {
  return String(phone || '').replace(/[^\d]/g, '');
}

function createOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function createVerifyToken() {
  return crypto.randomBytes(24).toString('hex');
}

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

registerRouter.get('/office-timing-options', (_req, res) => {
  return res.json({ officeStarts: officeStartOptions, officeEnds: officeEndOptions, workTypes: workTypeOptions });
});

registerRouter.get('/capacity', async (_req, res) => {
  try {
    const capacity = await getUsageCounts();
    return res.json(capacity);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch capacity', details: error.message });
  }
});

registerRouter.post('/send-otp', async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    if (!phone || phone.length < 10) {
      return res.status(400).json({ error: 'Valid phone is required' });
    }

    const otp = createOtp();
    otpStore.set(phone, {
      otp,
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0
    });

    await sendWhatsAppText(phone, `Your FitBudget verification OTP is ${otp}. It is valid for 10 minutes.`);
    return res.json({ message: 'OTP sent on WhatsApp' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send OTP', details: error.message });
  }
});

registerRouter.post('/verify-otp', (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  const otp = String(req.body?.otp || '').trim();

  if (!phone || !otp) {
    return res.status(400).json({ error: 'phone and otp are required' });
  }

  const record = otpStore.get(phone);
  if (!record || record.expiresAt < Date.now()) {
    otpStore.delete(phone);
    return res.status(400).json({ error: 'OTP expired. Please request a new OTP.' });
  }

  if (record.otp !== otp) {
    record.attempts += 1;
    if (record.attempts >= 5) otpStore.delete(phone);
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  otpStore.delete(phone);
  const verifyToken = createVerifyToken();
  verifyStore.set(phone, { token: verifyToken, expiresAt: Date.now() + VERIFY_TTL_MS });

  return res.json({ message: 'Phone verified successfully', verifyToken });
});

registerRouter.post('/', async (req, res) => {
  try {
    const {
      name,
      phone,
      weight,
      height,
      goal,
      officeStart,
      officeEnd,
      workType,
      sleepHours,
      exerciseHabit,
      waterGoal,
      dailyBudget,
      dietType,
      medicalIssues,
      bodyShapeGoal,
      currentDiet,
      easyDietMode,
      verifyToken,
      privacyAccepted,
      termsAccepted
    } = req.body || {};

    const normalizedPhone = normalizePhone(phone);

    if (!name || !normalizedPhone || !goal || !dietType || !currentDiet) {
      return res.status(400).json({ error: 'name, phone, goal, dietType, and currentDiet are required' });
    }

    if (!privacyAccepted || !termsAccepted) {
      return res.status(400).json({ error: 'Privacy policy and terms acceptance are required' });
    }

    const verification = verifyStore.get(normalizedPhone);
    if (!verification || verification.expiresAt < Date.now() || verification.token !== verifyToken) {
      return res.status(400).json({ error: 'Phone verification required. Verify OTP before registering.' });
    }

    const selectedWorkType = workTypeOptions.includes(workType) ? workType : 'desk';
    const selectedOfficeStart = officeStartOptions.includes(officeStart) ? officeStart : '09:00';
    const selectedOfficeEnd = officeEndOptions.includes(officeEnd) ? officeEnd : '18:00';
    const officeTiming = `${selectedOfficeStart}-${selectedOfficeEnd}`;

    const existing = await User.findOne({ phone: normalizedPhone });
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
      phone: normalizedPhone,
      weight: Number(weight) || undefined,
      height: Number(height) || undefined,
      goal,
      officeTiming,
      jobType: selectedWorkType === 'active' ? 'active' : 'desk',
      sleepHours: Number(sleepHours) || 7,
      exerciseHabit: exerciseHabit || 'none',
      waterGoal: Number(waterGoal) || 8,
      dailyBudget: Number(dailyBudget) || 250,
      dietType,
      medicalIssues: nextMedicalIssues,
      bodyShapeGoal: bodyShapeGoal || goal,
      currentDiet,
      easyDietMode: easyDietMode !== false,
      privacyAcceptedAt: new Date(),
      termsAcceptedAt: new Date(),
      phoneVerifiedAt: new Date(),
      onboardingComplete: true
    };

    const user = await User.findOneAndUpdate({ phone: normalizedPhone }, { $set: update }, { upsert: true, new: true, setDefaultsOnInsert: true });
    verifyStore.delete(normalizedPhone);

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
        officeTiming: user.officeTiming,
        jobType: selectedWorkType,
        easyDietMode: user.easyDietMode
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});
