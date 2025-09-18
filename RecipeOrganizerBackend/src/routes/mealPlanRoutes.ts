import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { mealPlanController } from '../controllers/mealPlanController';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Meal Plans
 *   description: Meal planning and management
 */

/**
 * @swagger
 * /meal-plans:
 *   get:
 *     summary: Get all meal plans for user
 *     tags: [Meal Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *     responses:
 *       200:
 *         description: Meal plans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MealPlan'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 */
router.get('/', authenticate, asyncHandler(mealPlanController.getAllMealPlans));

/**
 * @swagger
 * /meal-plans/{id}:
 *   get:
 *     summary: Get meal plan by ID
 *     tags: [Meal Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meal plan ID
 *     responses:
 *       200:
 *         description: Meal plan retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MealPlan'
 *       404:
 *         description: Meal plan not found
 */
router.get('/:id', authenticate, asyncHandler(mealPlanController.getMealPlanById));

/**
 * @swagger
 * /meal-plans:
 *   post:
 *     summary: Create new meal plan
 *     tags: [Meal Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Weekly Meal Plan"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-07"
 *               notes:
 *                 type: string
 *                 example: "Family meal plan for the week"
 *     responses:
 *       201:
 *         description: Meal plan created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', authenticate, asyncHandler(mealPlanController.createMealPlan));

/**
 * @swagger
 * /meal-plans/{id}:
 *   put:
 *     summary: Update meal plan
 *     tags: [Meal Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meal plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Meal plan updated successfully
 *       404:
 *         description: Meal plan not found
 */
router.put('/:id', authenticate, asyncHandler(mealPlanController.updateMealPlan));

/**
 * @swagger
 * /meal-plans/{id}:
 *   delete:
 *     summary: Delete meal plan
 *     tags: [Meal Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meal plan ID
 *     responses:
 *       200:
 *         description: Meal plan deleted successfully
 *       404:
 *         description: Meal plan not found
 */
router.delete('/:id', authenticate, asyncHandler(mealPlanController.deleteMealPlan));

/**
 * @swagger
 * /meal-plans/{id}/meals:
 *   post:
 *     summary: Add meal to plan
 *     tags: [Meal Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meal plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipeId
 *               - date
 *               - mealType
 *             properties:
 *               recipeId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               mealType:
 *                 type: string
 *                 enum: [breakfast, lunch, dinner, snack]
 *                 example: "dinner"
 *               servings:
 *                 type: number
 *                 example: 4
 *               notes:
 *                 type: string
 *                 example: "Special occasion dinner"
 *     responses:
 *       200:
 *         description: Meal added to plan successfully
 *       404:
 *         description: Meal plan not found
 */
router.post('/:id/meals', authenticate, asyncHandler(mealPlanController.addMeal));

/**
 * @swagger
 * /meal-plans/{id}/meals/{mealId}:
 *   put:
 *     summary: Update meal in plan
 *     tags: [Meal Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meal plan ID
 *       - in: path
 *         name: mealId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipeId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               mealType:
 *                 type: string
 *                 enum: [breakfast, lunch, dinner, snack]
 *               servings:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Meal updated successfully
 *       404:
 *         description: Meal plan or meal not found
 */
router.put('/:id/meals/:mealId', authenticate, asyncHandler(mealPlanController.updateMeal));

/**
 * @swagger
 * /meal-plans/{id}/meals/{mealId}:
 *   delete:
 *     summary: Remove meal from plan
 *     tags: [Meal Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meal plan ID
 *       - in: path
 *         name: mealId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meal ID
 *     responses:
 *       200:
 *         description: Meal removed from plan successfully
 *       404:
 *         description: Meal plan or meal not found
 */
router.delete('/:id/meals/:mealId', authenticate, asyncHandler(mealPlanController.removeMeal));

// TODO: Generate shopping list from meal plan
// router.get('/:id/shopping-list', authenticate, asyncHandler(mealPlanController.generateShoppingList));

export default router;