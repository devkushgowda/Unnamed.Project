import { Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { PantryItem, IPantryItem } from '../models/PantryItem';

// Validation schemas
const createPantryItemSchema = z.object({
  ingredientName: z.string().min(1, 'Ingredient name is required').trim(),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required').trim(),
  category: z.string().min(1, 'Category is required').trim(),
  location: z.enum(['pantry', 'fridge', 'freezer']).default('pantry'),
  purchaseDate: z.string().optional(),
  expirationDate: z.string().optional(),
  notes: z.string().optional(),
  minQuantity: z.number().min(0, 'Minimum quantity cannot be negative').default(1),
});

const updatePantryItemSchema = createPantryItemSchema.partial();

const pantryFiltersSchema = z.object({
  category: z.string().optional(),
  location: z.enum(['pantry', 'fridge', 'freezer']).optional(),
  lowStock: z.boolean().optional(),
  expiringSoon: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const pantryController = {
  async getAllItems(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    try {
      const filters = pantryFiltersSchema.parse(req.query);
      
      // Build query
      const query: any = { userId: req.user.id };
      
      if (filters.category) {
        query.category = new RegExp(filters.category, 'i');
      }
      
      if (filters.location) {
        query.location = filters.location;
      }
      
      if (filters.search) {
        query.ingredientName = new RegExp(filters.search, 'i');
      }
      
      if (filters.lowStock) {
        query.$expr = { $lte: ['$quantity', '$minQuantity'] };
      }
      
      if (filters.expiringSoon) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        query.expirationDate = { $lte: nextWeek, $gte: new Date() };
      }

      // Pagination
      const skip = (filters.page - 1) * filters.limit;
      
      const [items, totalCount] = await Promise.all([
        PantryItem.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(filters.limit),
        PantryItem.countDocuments(query)
      ]);

      // Get summary statistics
      const [lowStockCount, expiringCount] = await Promise.all([
        PantryItem.countDocuments({
          userId: req.user.id,
          $expr: { $lte: ['$quantity', '$minQuantity'] }
        }),
        PantryItem.countDocuments({
          userId: req.user.id,
          expirationDate: { 
            $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            $gte: new Date()
          }
        })
      ]);

      logger.info('Get pantry items requested', { 
        userId: req.user.id, 
        totalItems: totalCount,
        filters 
      });

      res.json({
        success: true,
        data: {
          items,
          pagination: {
            currentPage: filters.page,
            totalPages: Math.ceil(totalCount / filters.limit),
            totalItems: totalCount,
            hasNext: skip + filters.limit < totalCount,
            hasPrev: filters.page > 1,
          },
          summary: {
            totalItems: totalCount,
            lowStockItems: lowStockCount,
            expiringItems: expiringCount,
          }
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }
      logger.error('Get pantry items error:', error);
      throw new ApiError('Failed to fetch pantry items', 500);
    }
  },

  async getItemById(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id } = req.params;
    
    if (!id) {
      throw new ApiError('Pantry item ID is required', 400);
    }

    try {
      const item = await PantryItem.findOne({ 
        _id: id, 
        userId: req.user.id 
      });

      if (!item) {
        throw new ApiError('Pantry item not found', 404);
      }

      logger.info('Get pantry item requested', { 
        userId: req.user.id, 
        itemId: id 
      });

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      logger.error('Get pantry item error:', error);
      throw new ApiError('Failed to fetch pantry item', 500);
    }
  },

  async createItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    try {
      const itemData = createPantryItemSchema.parse(req.body);

      // Check if item already exists
      const existingItem = await PantryItem.findOne({
        userId: req.user.id,
        ingredientName: new RegExp(`^${itemData.ingredientName}$`, 'i'),
        location: itemData.location,
      });

      if (existingItem) {
        // Update quantity instead of creating duplicate
        existingItem.quantity += itemData.quantity;
        existingItem.updatedAt = new Date();
        if (itemData.purchaseDate) {
          existingItem.purchaseDate = new Date(itemData.purchaseDate);
        }
        if (itemData.expirationDate) {
          existingItem.expirationDate = new Date(itemData.expirationDate);
        }
        await existingItem.save();

        logger.info('Pantry item quantity updated', { 
          userId: req.user.id, 
          itemId: existingItem._id,
          newQuantity: existingItem.quantity
        });

        res.status(200).json({
          success: true,
          message: 'Item quantity updated successfully',
          data: existingItem,
        });
        return;
      }

      const newItem = new PantryItem({
        ...itemData,
        userId: req.user.id,
        purchaseDate: itemData.purchaseDate ? new Date(itemData.purchaseDate) : new Date(),
        expirationDate: itemData.expirationDate ? new Date(itemData.expirationDate) : undefined,
      });

      await newItem.save();

      logger.info('Pantry item created', { 
        userId: req.user.id, 
        itemId: newItem._id 
      });

      res.status(201).json({
        success: true,
        message: 'Pantry item created successfully',
        data: newItem,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }
      logger.error('Create pantry item error:', error);
      throw new ApiError('Failed to create pantry item', 500);
    }
  },

  async updateItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id } = req.params;
    
    if (!id) {
      throw new ApiError('Pantry item ID is required', 400);
    }

    try {
      const updates = updatePantryItemSchema.parse(req.body);

      const item = await PantryItem.findOne({ 
        _id: id, 
        userId: req.user.id 
      });

      if (!item) {
        throw new ApiError('Pantry item not found', 404);
      }

      // Update fields
      Object.assign(item, updates);
      
      if (updates.purchaseDate) {
        item.purchaseDate = new Date(updates.purchaseDate);
      }
      
      if (updates.expirationDate) {
        item.expirationDate = new Date(updates.expirationDate);
      }

      await item.save();

      logger.info('Pantry item updated', { 
        userId: req.user.id, 
        itemId: id 
      });

      res.json({
        success: true,
        message: 'Pantry item updated successfully',
        data: item,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }
      logger.error('Update pantry item error:', error);
      throw new ApiError('Failed to update pantry item', 500);
    }
  },

  async deleteItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id } = req.params;
    
    if (!id) {
      throw new ApiError('Pantry item ID is required', 400);
    }

    try {
      const item = await PantryItem.findOneAndDelete({ 
        _id: id, 
        userId: req.user.id 
      });

      if (!item) {
        throw new ApiError('Pantry item not found', 404);
      }

      logger.info('Pantry item deleted', { 
        userId: req.user.id, 
        itemId: id 
      });

      res.json({
        success: true,
        message: 'Pantry item deleted successfully',
      });
    } catch (error) {
      logger.error('Delete pantry item error:', error);
      throw new ApiError('Failed to delete pantry item', 500);
    }
  },

  async getLowStockItems(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    try {
      const lowStockItems = await PantryItem.find({
        userId: req.user.id,
        $expr: { $lte: ['$quantity', '$minQuantity'] }
      }).sort({ quantity: 1 });

      logger.info('Get low stock items requested', { 
        userId: req.user.id, 
        count: lowStockItems.length 
      });

      res.json({
        success: true,
        data: lowStockItems,
      });
    } catch (error) {
      logger.error('Get low stock items error:', error);
      throw new ApiError('Failed to fetch low stock items', 500);
    }
  },

  async getExpiringItems(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    try {
      const daysAhead = parseInt(req.query.days as string) || 7;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const expiringItems = await PantryItem.find({
        userId: req.user.id,
        expirationDate: { 
          $lte: futureDate,
          $gte: new Date()
        }
      }).sort({ expirationDate: 1 });

      logger.info('Get expiring items requested', { 
        userId: req.user.id, 
        daysAhead,
        count: expiringItems.length 
      });

      res.json({
        success: true,
        data: expiringItems,
      });
    } catch (error) {
      logger.error('Get expiring items error:', error);
      throw new ApiError('Failed to fetch expiring items', 500);
    }
  },

  async getCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    try {
      const categories = await PantryItem.distinct('category', { 
        userId: req.user.id 
      });

      logger.info('Get pantry categories requested', { 
        userId: req.user.id, 
        count: categories.length 
      });

      res.json({
        success: true,
        data: categories.sort(),
      });
    } catch (error) {
      logger.error('Get pantry categories error:', error);
      throw new ApiError('Failed to fetch pantry categories', 500);
    }
  },

  async consumeItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id } = req.params;
    const consumeSchema = z.object({
      quantity: z.number().positive('Quantity must be positive'),
    });

    try {
      const { quantity } = consumeSchema.parse(req.body);

      const item = await PantryItem.findOne({ 
        _id: id, 
        userId: req.user.id 
      });

      if (!item) {
        throw new ApiError('Pantry item not found', 404);
      }

      if (item.quantity < quantity) {
        throw new ApiError('Not enough quantity available', 400);
      }

      item.quantity -= quantity;
      await item.save();

      // If quantity reaches 0, optionally delete the item
      if (item.quantity === 0) {
        await PantryItem.findByIdAndDelete(id);
        
        logger.info('Pantry item consumed and removed', { 
          userId: req.user.id, 
          itemId: id,
          consumedQuantity: quantity
        });

        res.json({
          success: true,
          message: 'Item consumed completely and removed from pantry',
        });
        return;
      }

      logger.info('Pantry item consumed', { 
        userId: req.user.id, 
        itemId: id,
        consumedQuantity: quantity,
        remainingQuantity: item.quantity
      });

      res.json({
        success: true,
        message: 'Item consumed successfully',
        data: item,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }
      logger.error('Consume pantry item error:', error);
      throw new ApiError('Failed to consume pantry item', 500);
    }
  },
};