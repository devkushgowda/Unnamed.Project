import { Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { MealPlan, IMealPlan } from '../models/MealPlan';
import { Recipe } from '../models/Recipe';

// Validation schemas
const createMealPlanSchema = z.object({
  name: z.string().min(1, 'Meal plan name is required').trim(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
  meals: z.array(z.object({
    date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid meal date'),
    mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    recipeId: z.string().min(1, 'Recipe ID is required'),
    servings: z.number().positive('Servings must be positive').default(4),
    notes: z.string().optional(),
  })).default([]),
  notes: z.string().optional(),
});

const updateMealPlanSchema = createMealPlanSchema.partial();

const addMealSchema = z.object({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid meal date'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  recipeId: z.string().min(1, 'Recipe ID is required'),
  servings: z.number().positive('Servings must be positive').default(4),
  notes: z.string().optional(),
});

const updateMealSchema = z.object({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid meal date').optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  recipeId: z.string().min(1).optional(),
  servings: z.number().positive().optional(),
  notes: z.string().optional(),
});

const mealPlanFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const mealPlanController = {
  async getAllMealPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    try {
      const filters = mealPlanFiltersSchema.parse(req.query);
      
      // Build query
      const query: any = { userId: req.user.id };
      
      if (filters.startDate || filters.endDate) {
        query.$or = [];
        if (filters.startDate) {
          query.$or.push({ endDate: { $gte: new Date(filters.startDate) } });
        }
        if (filters.endDate) {
          query.$or.push({ startDate: { $lte: new Date(filters.endDate) } });
        }
      }
      
      if (filters.search) {
        query.name = new RegExp(filters.search, 'i');
      }

      // Pagination
      const skip = (filters.page - 1) * filters.limit;
      
      const [mealPlans, totalCount] = await Promise.all([
        MealPlan.find(query)
          .populate('meals.recipeId', 'title imageUrl prepTime cookTime difficulty')
          .sort({ startDate: -1 })
          .skip(skip)
          .limit(filters.limit),
        MealPlan.countDocuments(query)
      ]);

      logger.info('Get meal plans requested', { 
        userId: req.user.id, 
        totalPlans: totalCount,
        filters 
      });

      res.json({
        success: true,
        data: {
          mealPlans,
          pagination: {
            currentPage: filters.page,
            totalPages: Math.ceil(totalCount / filters.limit),
            totalItems: totalCount,
            hasNext: skip + filters.limit < totalCount,
            hasPrev: filters.page > 1,
          },
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }
      logger.error('Get meal plans error:', error);
      throw new ApiError('Failed to fetch meal plans', 500);
    }
  },

  async getMealPlanById(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id } = req.params;
    
    if (!id) {
      throw new ApiError('Meal plan ID is required', 400);
    }

    try {
      const mealPlan = await MealPlan.findOne({ 
        _id: id, 
        userId: req.user.id 
      }).populate('meals.recipeId', 'title imageUrl prepTime cookTime difficulty ingredients nutrition');

      if (!mealPlan) {
        throw new ApiError('Meal plan not found', 404);
      }

      // Calculate statistics
      const totalMeals = mealPlan.meals.length;
      const mealsByType = mealPlan.meals.reduce((acc, meal) => {
        acc[meal.mealType] = (acc[meal.mealType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      logger.info('Get meal plan requested', { 
        userId: req.user.id, 
        mealPlanId: id 
      });

      res.json({
        success: true,
        data: {
          ...mealPlan.toObject(),
          statistics: {
            totalMeals,
            mealsByType,
            dateRange: {
              start: mealPlan.startDate,
              end: mealPlan.endDate,
              days: Math.ceil((mealPlan.endDate.getTime() - mealPlan.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
            }
          }
        },
      });
    } catch (error) {
      logger.error('Get meal plan error:', error);
      throw new ApiError('Failed to fetch meal plan', 500);
    }
  },

  async createMealPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    try {
      const mealPlanData = createMealPlanSchema.parse(req.body);

      // Validate date range
      const startDate = new Date(mealPlanData.startDate);
      const endDate = new Date(mealPlanData.endDate);
      
      if (endDate < startDate) {
        throw new ApiError('End date must be after start date', 400);
      }

      // Validate that all meal dates are within the plan date range
      for (const meal of mealPlanData.meals) {
        const mealDate = new Date(meal.date);
        if (mealDate < startDate || mealDate > endDate) {
          throw new ApiError(`Meal date ${meal.date} is outside the plan date range`, 400);
        }

        // Verify recipe exists and user has access
        const recipe = await Recipe.findOne({
          _id: meal.recipeId,
          $or: [
            { isPublic: true },
            { createdBy: req.user.id }
          ]
        });

        if (!recipe) {
          throw new ApiError(`Recipe not found or not accessible: ${meal.recipeId}`, 404);
        }
      }

      const newMealPlan = new MealPlan({
        ...mealPlanData,
        userId: req.user.id,
        startDate,
        endDate,
        meals: mealPlanData.meals.map(meal => ({
          ...meal,
          date: new Date(meal.date),
        })),
      });

      await newMealPlan.save();
      await newMealPlan.populate('meals.recipeId', 'title imageUrl prepTime cookTime difficulty');

      logger.info('Meal plan created', { 
        userId: req.user.id, 
        mealPlanId: newMealPlan._id 
      });

      res.status(201).json({
        success: true,
        message: 'Meal plan created successfully',
        data: newMealPlan,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }
      logger.error('Create meal plan error:', error);
      throw new ApiError('Failed to create meal plan', 500);
    }
  },

  async updateMealPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id } = req.params;
    
    if (!id) {
      throw new ApiError('Meal plan ID is required', 400);
    }

    try {
      const updates = updateMealPlanSchema.parse(req.body);

      const mealPlan = await MealPlan.findOne({ 
        _id: id, 
        userId: req.user.id 
      });

      if (!mealPlan) {
        throw new ApiError('Meal plan not found', 404);
      }

      // Validate date range if provided
      if (updates.startDate || updates.endDate) {
        const startDate = updates.startDate ? new Date(updates.startDate) : mealPlan.startDate;
        const endDate = updates.endDate ? new Date(updates.endDate) : mealPlan.endDate;
        
        if (endDate < startDate) {
          throw new ApiError('End date must be after start date', 400);
        }
      }

      // Validate recipes if meals are being updated
      if (updates.meals) {
        for (const meal of updates.meals) {
          const recipe = await Recipe.findOne({
            _id: meal.recipeId,
            $or: [
              { isPublic: true },
              { createdBy: req.user.id }
            ]
          });

          if (!recipe) {
            throw new ApiError(`Recipe not found or not accessible: ${meal.recipeId}`, 404);
          }
        }
      }

      // Update fields
      Object.assign(mealPlan, updates);
      
      if (updates.startDate) {
        mealPlan.startDate = new Date(updates.startDate);
      }
      
      if (updates.endDate) {
        mealPlan.endDate = new Date(updates.endDate);
      }

      if (updates.meals) {
        mealPlan.meals = updates.meals.map(meal => ({
          ...meal,
          date: new Date(meal.date),
        })) as any;
      }

      await mealPlan.save();
      await mealPlan.populate('meals.recipeId', 'title imageUrl prepTime cookTime difficulty');

      logger.info('Meal plan updated', { 
        userId: req.user.id, 
        mealPlanId: id 
      });

      res.json({
        success: true,
        message: 'Meal plan updated successfully',
        data: mealPlan,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }
      logger.error('Update meal plan error:', error);
      throw new ApiError('Failed to update meal plan', 500);
    }
  },

  async deleteMealPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id } = req.params;
    
    if (!id) {
      throw new ApiError('Meal plan ID is required', 400);
    }

    try {
      const mealPlan = await MealPlan.findOneAndDelete({ 
        _id: id, 
        userId: req.user.id 
      });

      if (!mealPlan) {
        throw new ApiError('Meal plan not found', 404);
      }

      logger.info('Meal plan deleted', { 
        userId: req.user.id, 
        mealPlanId: id 
      });

      res.json({
        success: true,
        message: 'Meal plan deleted successfully',
      });
    } catch (error) {
      logger.error('Delete meal plan error:', error);
      throw new ApiError('Failed to delete meal plan', 500);
    }
  },

  async addMeal(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id } = req.params;
    
    if (!id) {
      throw new ApiError('Meal plan ID is required', 400);
    }

    try {
      const mealData = addMealSchema.parse(req.body);

      const mealPlan = await MealPlan.findOne({ 
        _id: id, 
        userId: req.user.id 
      });

      if (!mealPlan) {
        throw new ApiError('Meal plan not found', 404);
      }

      // Validate meal date is within plan range
      const mealDate = new Date(mealData.date);
      if (mealDate < mealPlan.startDate || mealDate > mealPlan.endDate) {
        throw new ApiError('Meal date is outside the plan date range', 400);
      }

      // Verify recipe exists and user has access
      const recipe = await Recipe.findOne({
        _id: mealData.recipeId,
        $or: [
          { isPublic: true },
          { createdBy: req.user.id }
        ]
      });

      if (!recipe) {
        throw new ApiError('Recipe not found or not accessible', 404);
      }

      // Add meal
      mealPlan.meals.push({
        ...mealData,
        date: mealDate,
      } as any);

      await mealPlan.save();
      await mealPlan.populate('meals.recipeId', 'title imageUrl prepTime cookTime difficulty');

      logger.info('Meal added to plan', { 
        userId: req.user.id, 
        mealPlanId: id,
        recipeId: mealData.recipeId
      });

      res.json({
        success: true,
        message: 'Meal added to plan successfully',
        data: mealPlan,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }
      logger.error('Add meal to plan error:', error);
      throw new ApiError('Failed to add meal to plan', 500);
    }
  },

  async updateMeal(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id, mealId } = req.params;
    
    if (!id || !mealId) {
      throw new ApiError('Meal plan ID and meal ID are required', 400);
    }

    try {
      const updates = updateMealSchema.parse(req.body);

      const mealPlan = await MealPlan.findOne({ 
        _id: id, 
        userId: req.user.id 
      });

      if (!mealPlan) {
        throw new ApiError('Meal plan not found', 404);
      }

      const meal = mealPlan.meals.find(m => (m as any)._id?.toString() === mealId);
      if (!meal) {
        throw new ApiError('Meal not found in plan', 404);
      }

      // Validate recipe if being updated
      if (updates.recipeId) {
        const recipe = await Recipe.findOne({
          _id: updates.recipeId,
          $or: [
            { isPublic: true },
            { createdBy: req.user.id }
          ]
        });

        if (!recipe) {
          throw new ApiError('Recipe not found or not accessible', 404);
        }
      }

      // Update meal
      Object.assign(meal, updates);
      
      if (updates.date) {
        meal.date = new Date(updates.date);
      }

      await mealPlan.save();
      await mealPlan.populate('meals.recipeId', 'title imageUrl prepTime cookTime difficulty');

      logger.info('Meal updated in plan', { 
        userId: req.user.id, 
        mealPlanId: id,
        mealId
      });

      res.json({
        success: true,
        message: 'Meal updated successfully',
        data: mealPlan,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }
      logger.error('Update meal in plan error:', error);
      throw new ApiError('Failed to update meal in plan', 500);
    }
  },

  async removeMeal(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id, mealId } = req.params;
    
    if (!id || !mealId) {
      throw new ApiError('Meal plan ID and meal ID are required', 400);
    }

    try {
      const mealPlan = await MealPlan.findOne({ 
        _id: id, 
        userId: req.user.id 
      });

      if (!mealPlan) {
        throw new ApiError('Meal plan not found', 404);
      }

      const mealIndex = mealPlan.meals.findIndex(meal => (meal as any)._id?.toString() === mealId);
      if (mealIndex === -1) {
        throw new ApiError('Meal not found in plan', 404);
      }

      mealPlan.meals.splice(mealIndex, 1);
      await mealPlan.save();

      logger.info('Meal removed from plan', { 
        userId: req.user.id, 
        mealPlanId: id,
        mealId
      });

      res.json({
        success: true,
        message: 'Meal removed from plan successfully',
        data: mealPlan,
      });
    } catch (error) {
      logger.error('Remove meal from plan error:', error);
      throw new ApiError('Failed to remove meal from plan', 500);
    }
  },
};