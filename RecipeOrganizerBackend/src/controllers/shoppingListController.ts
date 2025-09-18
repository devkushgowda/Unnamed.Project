import { Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { ShoppingList, IShoppingList } from '../models/ShoppingList';

// Validation schemas
const createShoppingListSchema = z.object({
  name: z.string().min(1, 'Shopping list name is required').trim(),
  items: z.array(z.object({
    ingredientName: z.string().min(1, 'Ingredient name is required').trim(),
    quantity: z.number().positive('Quantity must be positive'),
    unit: z.string().min(1, 'Unit is required').trim(),
    category: z.string().optional(),
    notes: z.string().optional(),
    estimatedPrice: z.number().min(0).optional(),
  })).default([]),
  totalBudget: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const updateShoppingListSchema = createShoppingListSchema.partial();

const addItemSchema = z.object({
  ingredientName: z.string().min(1, 'Ingredient name is required').trim(),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required').trim(),
  category: z.string().optional(),
  notes: z.string().optional(),
  estimatedPrice: z.number().min(0).optional(),
});

const updateItemSchema = z.object({
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  estimatedPrice: z.number().min(0).optional(),
  isPurchased: z.boolean().optional(),
  actualPrice: z.number().min(0).optional(),
});

const shoppingListFiltersSchema = z.object({
  status: z.enum(['active', 'completed', 'archived']).optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const shoppingListController = {
  async getAllLists(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    try {
      const filters = shoppingListFiltersSchema.parse(req.query);
      
      // Build query
      const query: any = { userId: req.user.id };
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.search) {
        query.name = new RegExp(filters.search, 'i');
      }

      // Pagination
      const skip = (filters.page - 1) * filters.limit;
      
      const [lists, totalCount] = await Promise.all([
        ShoppingList.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(filters.limit),
        ShoppingList.countDocuments(query)
      ]);

      // Get summary statistics
      const [activeCount, completedCount, archivedCount] = await Promise.all([
        ShoppingList.countDocuments({ userId: req.user.id, status: 'active' }),
        ShoppingList.countDocuments({ userId: req.user.id, status: 'completed' }),
        ShoppingList.countDocuments({ userId: req.user.id, status: 'archived' }),
      ]);

      logger.info('Get shopping lists requested', { 
        userId: req.user.id, 
        totalLists: totalCount,
        filters 
      });

      res.json({
        success: true,
        data: {
          lists,
          pagination: {
            currentPage: filters.page,
            totalPages: Math.ceil(totalCount / filters.limit),
            totalItems: totalCount,
            hasNext: skip + filters.limit < totalCount,
            hasPrev: filters.page > 1,
          },
          summary: {
            totalLists: totalCount,
            activeLists: activeCount,
            completedLists: completedCount,
            archivedLists: archivedCount,
          }
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }
      logger.error('Get shopping lists error:', error);
      throw new ApiError('Failed to fetch shopping lists', 500);
    }
  },

  async getListById(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id } = req.params;
    
    if (!id) {
      throw new ApiError('Shopping list ID is required', 400);
    }

    try {
      const list = await ShoppingList.findOne({ 
        _id: id, 
        userId: req.user.id 
      });

      if (!list) {
        throw new ApiError('Shopping list not found', 404);
      }

      // Calculate statistics
      const totalItems = list.items.length;
      const purchasedItems = list.items.filter(item => item.isPurchased).length;
      const totalEstimated = list.items.reduce((sum, item) => sum + ((item as any).estimatedPrice || 0), 0);
      const totalActual = list.items.reduce((sum, item) => sum + ((item as any).actualPrice || 0), 0);

      logger.info('Get shopping list requested', { 
        userId: req.user.id, 
        listId: id 
      });

      res.json({
        success: true,
        data: {
          ...list.toObject(),
          statistics: {
            totalItems,
            purchasedItems,
            remainingItems: totalItems - purchasedItems,
            completionPercentage: totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0,
            totalEstimatedCost: totalEstimated,
            totalActualCost: totalActual,
          }
        },
      });
    } catch (error) {
      logger.error('Get shopping list error:', error);
      throw new ApiError('Failed to fetch shopping list', 500);
    }
  },

  async createList(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    try {
      const listData = createShoppingListSchema.parse(req.body);

      const newList = new ShoppingList({
        ...listData,
        userId: req.user.id,
        status: 'active',
      });

      await newList.save();

      logger.info('Shopping list created', { 
        userId: req.user.id, 
        listId: newList._id 
      });

      res.status(201).json({
        success: true,
        message: 'Shopping list created successfully',
        data: newList,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }
      logger.error('Create shopping list error:', error);
      throw new ApiError('Failed to create shopping list', 500);
    }
  },

  async updateList(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id } = req.params;
    
    if (!id) {
      throw new ApiError('Shopping list ID is required', 400);
    }

    try {
      const updates = updateShoppingListSchema.parse(req.body);

      const list = await ShoppingList.findOne({ 
        _id: id, 
        userId: req.user.id 
      });

      if (!list) {
        throw new ApiError('Shopping list not found', 404);
      }

      // Update fields
      Object.assign(list, updates);
      await list.save();

      logger.info('Shopping list updated', { 
        userId: req.user.id, 
        listId: id 
      });

      res.json({
        success: true,
        message: 'Shopping list updated successfully',
        data: list,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }
      logger.error('Update shopping list error:', error);
      throw new ApiError('Failed to update shopping list', 500);
    }
  },

  async deleteList(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id } = req.params;
    
    if (!id) {
      throw new ApiError('Shopping list ID is required', 400);
    }

    try {
      const list = await ShoppingList.findOneAndDelete({ 
        _id: id, 
        userId: req.user.id 
      });

      if (!list) {
        throw new ApiError('Shopping list not found', 404);
      }

      logger.info('Shopping list deleted', { 
        userId: req.user.id, 
        listId: id 
      });

      res.json({
        success: true,
        message: 'Shopping list deleted successfully',
      });
    } catch (error) {
      logger.error('Delete shopping list error:', error);
      throw new ApiError('Failed to delete shopping list', 500);
    }
  },

  async addItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id } = req.params;
    
    if (!id) {
      throw new ApiError('Shopping list ID is required', 400);
    }

    try {
      const itemData = addItemSchema.parse(req.body);

      const list = await ShoppingList.findOne({ 
        _id: id, 
        userId: req.user.id 
      });

      if (!list) {
        throw new ApiError('Shopping list not found', 404);
      }

      // Check if item already exists
      const existingItem = list.items.find(item => 
        item.ingredientName.toLowerCase() === itemData.ingredientName.toLowerCase()
      );

      if (existingItem) {
        // Update quantity instead of adding duplicate
        existingItem.quantity += itemData.quantity;
        if (itemData.estimatedPrice) {
          existingItem.estimatedPrice = itemData.estimatedPrice;
        }
      } else {
        // Add new item
        list.items.push({
          ...itemData,
          isPurchased: false,
        } as any);
      }

      await list.save();

      logger.info('Item added to shopping list', { 
        userId: req.user.id, 
        listId: id,
        itemName: itemData.ingredientName
      });

      res.json({
        success: true,
        message: 'Item added to shopping list successfully',
        data: list,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }
      logger.error('Add item to shopping list error:', error);
      throw new ApiError('Failed to add item to shopping list', 500);
    }
  },

  async updateItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id, itemId } = req.params;
    
    if (!id || !itemId) {
      throw new ApiError('Shopping list ID and item ID are required', 400);
    }

    try {
      const updates = updateItemSchema.parse(req.body);

      const list = await ShoppingList.findOne({ 
        _id: id, 
        userId: req.user.id 
      });

      if (!list) {
        throw new ApiError('Shopping list not found', 404);
      }

      const item = list.items.find(i => (i as any)._id?.toString() === itemId);
      if (!item) {
        throw new ApiError('Item not found in shopping list', 404);
      }

      // Update item
      Object.assign(item, updates);
      await list.save();

      logger.info('Shopping list item updated', { 
        userId: req.user.id, 
        listId: id,
        itemId
      });

      res.json({
        success: true,
        message: 'Shopping list item updated successfully',
        data: list,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }
      logger.error('Update shopping list item error:', error);
      throw new ApiError('Failed to update shopping list item', 500);
    }
  },

  async removeItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id, itemId } = req.params;
    
    if (!id || !itemId) {
      throw new ApiError('Shopping list ID and item ID are required', 400);
    }

    try {
      const list = await ShoppingList.findOne({ 
        _id: id, 
        userId: req.user.id 
      });

      if (!list) {
        throw new ApiError('Shopping list not found', 404);
      }

      const itemIndex = list.items.findIndex(item => (item as any)._id?.toString() === itemId);
      if (itemIndex === -1) {
        throw new ApiError('Item not found in shopping list', 404);
      }

      list.items.splice(itemIndex, 1);
      await list.save();

      logger.info('Item removed from shopping list', { 
        userId: req.user.id, 
        listId: id,
        itemId
      });

      res.json({
        success: true,
        message: 'Item removed from shopping list successfully',
        data: list,
      });
    } catch (error) {
      logger.error('Remove item from shopping list error:', error);
      throw new ApiError('Failed to remove item from shopping list', 500);
    }
  },

  async markItemPurchased(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id, itemId } = req.params;
    const markPurchasedSchema = z.object({
      isPurchased: z.boolean(),
      actualPrice: z.number().min(0).optional(),
    });

    try {
      const { isPurchased, actualPrice } = markPurchasedSchema.parse(req.body);

      const list = await ShoppingList.findOne({ 
        _id: id, 
        userId: req.user.id 
      });

      if (!list) {
        throw new ApiError('Shopping list not found', 404);
      }

      const item = list.items.find(i => (i as any)._id?.toString() === itemId);
      if (!item) {
        throw new ApiError('Item not found in shopping list', 404);
      }

      item.isPurchased = isPurchased;
      if (actualPrice !== undefined) {
        item.actualPrice = actualPrice;
      }

      await list.save();

      // Check if all items are purchased and update list status
      const allPurchased = list.items.every(item => item.isPurchased);
      if (allPurchased && list.status === 'active') {
        list.status = 'completed';
        await list.save();
      }

      logger.info('Shopping list item marked as purchased', { 
        userId: req.user.id, 
        listId: id,
        itemId,
        isPurchased
      });

      res.json({
        success: true,
        message: `Item marked as ${isPurchased ? 'purchased' : 'not purchased'}`,
        data: list,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }
      logger.error('Mark item purchased error:', error);
      throw new ApiError('Failed to update item purchase status', 500);
    }
  },

  async generateFromRecipes(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const generateSchema = z.object({
      recipeIds: z.array(z.string()).min(1, 'At least one recipe ID is required'),
      listName: z.string().min(1, 'Shopping list name is required').trim(),
      servings: z.number().positive().optional(),
    });

    try {
      const { recipeIds, listName, servings } = generateSchema.parse(req.body);

      // TODO: Implement recipe-based shopping list generation
      // This would require fetching recipes and extracting ingredients
      
      logger.info('Generate shopping list from recipes requested', { 
        userId: req.user.id, 
        recipeIds,
        listName
      });

      // For now, create an empty list with a note
      const newList = new ShoppingList({
        name: listName,
        userId: req.user.id,
        status: 'active',
        items: [],
        notes: `Generated from ${recipeIds.length} recipe(s). Recipe-based generation not yet implemented.`,
      });

      await newList.save();

      res.status(201).json({
        success: true,
        message: 'Shopping list created (recipe integration pending)',
        data: newList,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }
      logger.error('Generate shopping list from recipes error:', error);
      throw new ApiError('Failed to generate shopping list from recipes', 500);
    }
  },
};