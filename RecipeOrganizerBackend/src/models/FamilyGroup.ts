import mongoose, { Schema, Document } from 'mongoose';

export interface IFamilyMember {
  userId: mongoose.Types.ObjectId;
  role: 'admin' | 'member';
  joinedAt: Date;
  isActive: boolean;
}

export interface IFamilyGroupSettings {
  allowMemberInvites: boolean;
  requireApprovalForRecipes: boolean;
  sharedPantry: boolean;
  sharedMealPlans: boolean;
  sharedShoppingLists: boolean;
}

export interface IFamilyGroup extends Document {
  name: string;
  description?: string;
  adminId: mongoose.Types.ObjectId;
  members: IFamilyMember[];
  inviteCode: string;
  settings: IFamilyGroupSettings;
  createdAt: Date;
  updatedAt: Date;
}

const familyMemberSchema = new Schema<IFamilyMember>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const familyGroupSettingsSchema = new Schema<IFamilyGroupSettings>({
  allowMemberInvites: {
    type: Boolean,
    default: true
  },
  requireApprovalForRecipes: {
    type: Boolean,
    default: false
  },
  sharedPantry: {
    type: Boolean,
    default: true
  },
  sharedMealPlans: {
    type: Boolean,
    default: true
  },
  sharedShoppingLists: {
    type: Boolean,
    default: true
  }
});

const familyGroupSchema = new Schema<IFamilyGroup>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    maxlength: 200
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [familyMemberSchema],
  inviteCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  settings: {
    type: familyGroupSettingsSchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

// Indexes
familyGroupSchema.index({ adminId: 1 });
familyGroupSchema.index({ inviteCode: 1 });
familyGroupSchema.index({ 'members.userId': 1 });

export const FamilyGroup = mongoose.model<IFamilyGroup>('FamilyGroup', familyGroupSchema);

