import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, optionalAuth } from '../middleware/auth';
import { recipeController } from '../controllers/recipeController';

const router = express.Router();

/**
 * @swagger
 * /recipes:
 *   get:
 *     summary: Get all recipes with optional filtering
 *     tags: [Recipes]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for recipe title, description, or tags
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated list of tags to filter by
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty level
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recipes per page
 *     responses:
 *       200:
 *         description: Recipes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     recipes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Recipe'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalRecipes:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 */
router.get('/', optionalAuth, asyncHandler(recipeController.getAllRecipes));

/**
 * @swagger
 * /recipes/my:
 *   get:
 *     summary: Get current user's recipes
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User recipes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recipe'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/my', authenticate, asyncHandler(recipeController.getMyRecipes));

/**
 * @swagger
 * /recipes/{id}:
 *   get:
 *     summary: Get recipe by ID
 *     tags: [Recipes]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recipe ID
 *     responses:
 *       200:
 *         description: Recipe retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Recipe'
 *       404:
 *         description: Recipe not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', optionalAuth, asyncHandler(recipeController.getRecipeById));

/**
 * @swagger
 * /recipes:
 *   post:
 *     summary: Create a new recipe
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - ingredients
 *               - instructions
 *               - cookTime
 *               - servings
 *               - difficulty
 *             properties:
 *               title:
 *                 type: string
 *                 example: Spaghetti Carbonara
 *               description:
 *                 type: string
 *                 example: Classic Italian pasta dish
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Spaghetti
 *                     quantity:
 *                       type: number
 *                       example: 400
 *                     unit:
 *                       type: string
 *                       example: grams
 *               instructions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Boil pasta", "Mix ingredients", "Serve hot"]
 *               cookTime:
 *                 type: number
 *                 example: 20
 *               servings:
 *                 type: number
 *                 example: 4
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 example: medium
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["pasta", "italian", "dinner"]
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Recipe created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Recipe'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticate, asyncHandler(recipeController.createRecipe));

/**
 * @swagger
 * /recipes/{id}:
 *   put:
 *     summary: Update recipe by ID
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recipe ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *               instructions:
 *                 type: array
 *                 items:
 *                   type: string
 *               cookTime:
 *                 type: number
 *               servings:
 *                 type: number
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Recipe updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Recipe updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Recipe'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Not recipe owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Recipe not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authenticate, asyncHandler(recipeController.updateRecipe));

/**
 * @swagger
 * /recipes/{id}:
 *   delete:
 *     summary: Delete recipe by ID
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recipe ID
 *     responses:
 *       200:
 *         description: Recipe deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Recipe deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Not recipe owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Recipe not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticate, asyncHandler(recipeController.deleteRecipe));

export default router;