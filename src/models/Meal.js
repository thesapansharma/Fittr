import mongoose from 'mongoose';

const mealSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    food: { type: String, required: true },
    calories: { type: Number, required: true },
    cost: { type: Number, default: 0 },
    mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], default: 'snack' },
    mealDate: { type: Date, required: true, index: true }
  },
  { timestamps: true }
);

export const Meal = mongoose.model('Meal', mealSchema);
