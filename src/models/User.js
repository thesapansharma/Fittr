import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    water: { type: String, default: '10:30' },
    meal: { type: String, default: '13:00' },
    workout: { type: String, default: '18:30' }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: String,
    phone: { type: String, required: true, unique: true, index: true },
    weight: Number,
    height: Number,
    goal: {
      type: String,
      enum: ['lose weight', 'stay fit', 'gain muscle'],
      default: 'stay fit'
    },
    officeTiming: String,
    jobType: { type: String, enum: ['desk', 'active'], default: 'desk' },
    sleepHours: Number,
    exerciseHabit: { type: String, enum: ['none', 'beginner', 'gym'], default: 'none' },
    waterGoal: { type: Number, default: 8 },
    dailyBudget: { type: Number, default: 250 },
    dietType: {
      type: String,
      enum: ['vegetarian', 'vegan', 'eggetarian', 'non_vegetarian'],
      default: 'vegetarian'
    },
    medicalIssues: {
      type: [String],
      enum: ['diabetes', 'high_bp', 'kidney_stone'],
      default: []
    },
    reminderTimes: { type: reminderSchema, default: () => ({}) },
    lastReminderSent: {
      water: String,
      meal: String,
      workout: String
    },
    timezone: { type: String, default: 'Asia/Kolkata' },
    onboardingComplete: { type: Boolean, default: false },
    latestMoodFlag: { type: String, enum: ['neutral', 'guilty', 'stressed'], default: 'neutral' }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
