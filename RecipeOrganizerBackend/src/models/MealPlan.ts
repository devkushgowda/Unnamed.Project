import mongoose, { Schema, Document } from 'mongoose';

export interface IMealPlanItem {
  recipeId: mongoose.Types.ObjectId;
  date: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings: number;
  notes?: string;
}

export interface IMealPlan extends Document {
  name: string;
  userId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  meals: IMealPlanItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const mealPlanItemSchema = new Schema<IMealPlanItem>({
  recipeId: {
    type: Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true
  },
  servings: {
    type: Number,
    required: true,
    min: 1,
    default: 4
  },
  notes: {
    type: String
  }
});

const mealPlanSchema = new Schema<IMealPlan>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  meals: [mealPlanItemSchema],
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
mealPlanSchema.index({ userId: 1, startDate: 1 });
mealPlanSchema.index({ userId: 1, createdAt: -1 });

export const MealPlan = mongoose.model<IMealPlan>('MealPlan', mealPlanSchema);

