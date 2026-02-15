import mongoose from 'mongoose';

const exerciseLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    activity: { type: String, required: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    exerciseDate: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

export const ExerciseLog = mongoose.model('ExerciseLog', exerciseLogSchema);
