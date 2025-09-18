import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserPreferences {
  dietaryRestrictions: string[];
  allergies: string[];
  cuisinePreferences: string[];
  cookingSkillLevel: 'beginner' | 'intermediate' | 'advanced';
  mealPrepTime: number;
  servingSize: number;
  nutritionGoals: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sodium?: number;
  };
}

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  avatar?: string;
  familyGroupId?: mongoose.Types.ObjectId;
  preferences: IUserPreferences;
  isEmailVerified: boolean;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userPreferencesSchema = new Schema<IUserPreferences>({
  dietaryRestrictions: [{ type: String, default: [] }],
  allergies: [{ type: String, default: [] }],
  cuisinePreferences: [{ type: String, default: [] }],
  cookingSkillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  mealPrepTime: { type: Number, default: 30 },
  servingSize: { type: Number, default: 4 },
  nutritionGoals: {
    calories: { type: Number },
    protein: { type: Number },
    carbs: { type: Number },
    fat: { type: Number },
    fiber: { type: Number },
    sodium: { type: Number }
  }
});

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String
  },
  familyGroupId: {
    type: Schema.Types.ObjectId,
    ref: 'FamilyGroup'
  },
  preferences: {
    type: userPreferencesSchema,
    default: () => ({})
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  refreshTokens: [{
    type: String
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshTokens;
  return userObject;
};

export const User = mongoose.model<IUser>('User', userSchema);

