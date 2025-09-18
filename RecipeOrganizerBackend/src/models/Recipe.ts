import mongoose, { Schema, Document } from 'mongoose';

export interface IRecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface IRecipeInstruction {
  stepNumber: number;
  instruction: string;
  duration?: number;
  temperature?: number;
}

export interface INutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
}

export interface IRecipe extends Document {
  title: string;
  description: string;
  imageUrl?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  category: string;
  ingredients: IRecipeIngredient[];
  instructions: IRecipeInstruction[];
  nutrition: INutritionInfo;
  tags: string[];
  rating: number;
  reviewCount: number;
  createdBy: mongoose.Types.ObjectId;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const recipeIngredientSchema = new Schema<IRecipeIngredient>({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  notes: { type: String }
});

const recipeInstructionSchema = new Schema<IRecipeInstruction>({
  stepNumber: { type: Number, required: true },
  instruction: { type: String, required: true },
  duration: { type: Number },
  temperature: { type: Number }
});

const nutritionInfoSchema = new Schema<INutritionInfo>({
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  fiber: { type: Number, default: 0 },
  sugar: { type: Number, default: 0 },
  sodium: { type: Number, default: 0 },
  cholesterol: { type: Number, default: 0 }
});

const recipeSchema = new Schema<IRecipe>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String
  },
  prepTime: {
    type: Number,
    required: true,
    min: 0
  },
  cookTime: {
    type: Number,
    required: true,
    min: 0
  },
  servings: {
    type: Number,
    required: true,
    min: 1
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  cuisine: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  ingredients: [recipeIngredientSchema],
  instructions: [recipeInstructionSchema],
  nutrition: {
    type: nutritionInfoSchema,
    default: () => ({})
  },
  tags: [{ type: String }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
recipeSchema.index({ title: 'text', description: 'text', tags: 'text' });
recipeSchema.index({ createdBy: 1 });
recipeSchema.index({ cuisine: 1 });
recipeSchema.index({ category: 1 });
recipeSchema.index({ difficulty: 1 });
recipeSchema.index({ rating: -1 });

export const Recipe = mongoose.model<IRecipe>('Recipe', recipeSchema);

