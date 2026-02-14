import mongoose from 'mongoose';

const waterLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    glasses: { type: Number, required: true, min: 1 },
    loggedAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

export const WaterLog = mongoose.model('WaterLog', waterLogSchema);
