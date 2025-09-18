import { Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { Recipe, IRecipe } from '../models/Recipe';

// Validation schemas
const createRecipeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  imageUrl: z.string().url().optional(),
  prepTime: z.number().positive('Prep time must be positive'),
  cookTime: z.number().positive('Cook time must be positive'),
  servings: z.number().positive('Servings must be positive'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  cuisine: z.string().min(1, 'Cuisine is required'),
  category: z.string().min(1, 'Category is required'),
  ingredients: z.array(z.object({
    name: z.string().min(1, 'Ingredient name is required'),
    quantity: z.number().positive('Quantity must be positive'),
    unit: z.string().min(1, 'Unit is required'),
    notes: z.string().optional(),
  })).min(1, 'At least one ingredient is required'),
  instructions: z.array(z.object({
    stepNumber: z.number().positive('Step number must be positive'),
    instruction: z.string().min(1, 'Instruction is required'),
    duration: z.number().positive().optional(),
    temperature: z.number().positive().optional(),
  })).min(1, 'At least one instruction is required'),
  tags: z.array(z.string()).optional().default([]),
  isPublic: z.boolean().optional().default(false),
});

const updateRecipeSchema = createRecipeSchema.partial();

export const recipeController = {
  async getAllRecipes(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { search, tags, difficulty, cuisine, category, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query: any = {};
    
    // Search filter
    if (search) {
      const searchTerm = (search as string);
      query.$text = { $search: searchTerm };
    }

    // Tags filter
    if (tags) {
      const tagList = (tags as string).split(',').map(tag => tag.trim());
      query.tags = { $in: tagList };
    }

    // Difficulty filter
    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Cuisine filter
    if (cuisine) {
      query.cuisine = cuisine;
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Only show public recipes or user's own recipes
    if (req.user) {
      query.$or = [
        { isPublic: true },
        { createdBy: req.user.id }
      ];
    } else {
      query.isPublic = true;
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [recipes, totalCount] = await Promise.all([
      Recipe.find(query)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Recipe.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        recipes,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalRecipes: totalCount,
          hasNext: skip + limitNum < totalCount,
          hasPrev: pageNum > 1,
        },
      },
    });
  },

  async getRecipeById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    
    const recipe = await Recipe.findById(id).populate('createdBy', 'name email');
    if (!recipe) {
      throw new ApiError('Recipe not found', 404);
    }

    // Check if recipe is public or user owns it
    if (!recipe.isPublic && (!req.user || recipe.createdBy._id.toString() !== req.user.id)) {
      throw new ApiError('Recipe not found', 404);
    }

    res.json({
      success: true,
      data: recipe,
    });
  },

  async createRecipe(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const recipeData = createRecipeSchema.parse(req.body);

    const newRecipe = new Recipe({
      ...recipeData,
      createdBy: req.user.id,
    });

    await newRecipe.save();
    await newRecipe.populate('createdBy', 'name email');

    logger.info('Recipe created successfully', { recipeId: newRecipe._id, userId: req.user.id });

    res.status(201).json({
      success: true,
      message: 'Recipe created successfully',
      data: newRecipe,
    });
  },

  async updateRecipe(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id } = req.params;
    const updates = updateRecipeSchema.parse(req.body);

    const recipe = await Recipe.findById(id);
    if (!recipe) {
      throw new ApiError('Recipe not found', 404);
    }

    if (recipe.createdBy.toString() !== req.user.id) {
      throw new ApiError('Not authorized to update this recipe', 403);
    }

    Object.assign(recipe, updates);
    await recipe.save();
    await recipe.populate('createdBy', 'name email');

    logger.info('Recipe updated successfully', { recipeId: id, userId: req.user.id });

    res.json({
      success: true,
      message: 'Recipe updated successfully',
      data: recipe,
    });
  },

  async deleteRecipe(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id } = req.params;

    const recipe = await Recipe.findById(id);
    if (!recipe) {
      throw new ApiError('Recipe not found', 404);
    }

    if (recipe.createdBy.toString() !== req.user.id) {
      throw new ApiError('Not authorized to delete this recipe', 403);
    }

    await Recipe.findByIdAndDelete(id);

    logger.info('Recipe deleted successfully', { recipeId: id, userId: req.user.id });

    res.json({
      success: true,
      message: 'Recipe deleted successfully',
    });
  },

  async getMyRecipes(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const userRecipes = await Recipe.find({ createdBy: req.user.id })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: userRecipes,
    });
  },
};