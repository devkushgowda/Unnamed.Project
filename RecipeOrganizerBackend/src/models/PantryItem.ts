import mongoose, { Schema, Document } from 'mongoose';

export interface IPantryItem extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  purchaseDate: Date;
  expirationDate?: Date;
  location: 'pantry' | 'fridge' | 'freezer';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const pantryItemSchema = new Schema<IPantryItem>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    default: 'other'
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  expirationDate: {
    type: Date
  },
  location: {
    type: String,
    enum: ['pantry', 'fridge', 'freezer'],
    default: 'pantry'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
pantryItemSchema.index({ userId: 1 });
pantryItemSchema.index({ userId: 1, category: 1 });
pantryItemSchema.index({ userId: 1, expirationDate: 1 });
pantryItemSchema.index({ name: 'text' });

export const PantryItem = mongoose.model<IPantryItem>('PantryItem', pantryItemSchema);

