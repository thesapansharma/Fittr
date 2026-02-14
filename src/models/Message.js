import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true },
    direction: { type: String, enum: ['incoming', 'outgoing'], required: true },
    sentAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

export const Message = mongoose.model('Message', messageSchema);
