import mongoose, { Schema, Document } from 'mongoose';

export interface IShoppingListItem {
  ingredientName: string;
  quantity: number;
  unit: string;
  category?: string;
  isPurchased: boolean;
  estimatedPrice?: number;
  actualPrice?: number;
  notes?: string;
}

export interface IShoppingList extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  items: IShoppingListItem[];
  status: 'active' | 'completed' | 'archived';
  totalBudget?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const shoppingListItemSchema = new Schema<IShoppingListItem>({
  ingredientName: {
    type: String,
    required: true,
    trim: true
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
  category: {
    type: String
  },
  isPurchased: {
    type: Boolean,
    default: false
  },
  estimatedPrice: {
    type: Number,
    min: 0
  },
  actualPrice: {
    type: Number,
    min: 0
  },
  notes: {
    type: String
  }
});

const shoppingListSchema = new Schema<IShoppingList>({
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
  items: [shoppingListItemSchema],
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  totalBudget: {
    type: Number,
    min: 0
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
shoppingListSchema.index({ userId: 1, status: 1 });
shoppingListSchema.index({ userId: 1, createdAt: -1 });

export const ShoppingList = mongoose.model<IShoppingList>('ShoppingList', shoppingListSchema);

