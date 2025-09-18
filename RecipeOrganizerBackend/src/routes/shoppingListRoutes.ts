import express from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { shoppingListController } from '../controllers/shoppingListController';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Shopping Lists
 *   description: Shopping list management
 */

/**
 * @swagger
 * /shopping-lists:
 *   get:
 *     summary: Get all shopping lists for user
 *     tags: [Shopping Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, archived]
 *         description: Filter by status
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
 *     responses:
 *       200:
 *         description: Shopping lists retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [active, completed, archived]
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                       totalBudget:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
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
router.get('/', authenticate, asyncHandler(shoppingListController.getAllLists));

/**
 * @swagger
 * /shopping-lists/{id}:
 *   get:
 *     summary: Get shopping list by ID
 *     tags: [Shopping Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shopping list ID
 *     responses:
 *       200:
 *         description: Shopping list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     status:
 *                       type: string
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           ingredientName:
 *                             type: string
 *                           quantity:
 *                             type: number
 *                           unit:
 *                             type: string
 *                           category:
 *                             type: string
 *                           isPurchased:
 *                             type: boolean
 *                           estimatedPrice:
 *                             type: number
 *                           actualPrice:
 *                             type: number
 *                           notes:
 *                             type: string
 *                     statistics:
 *                       type: object
 *       404:
 *         description: Shopping list not found
 */
router.get('/:id', authenticate, asyncHandler(shoppingListController.getListById));

/**
 * @swagger
 * /shopping-lists:
 *   post:
 *     summary: Create new shopping list
 *     tags: [Shopping Lists]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Weekly Groceries"
 *               totalBudget:
 *                 type: number
 *                 example: 150.00
 *               notes:
 *                 type: string
 *                 example: "Shopping for the week"
 *     responses:
 *       201:
 *         description: Shopping list created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', authenticate, asyncHandler(shoppingListController.createList));

/**
 * @swagger
 * /shopping-lists/{id}:
 *   put:
 *     summary: Update shopping list
 *     tags: [Shopping Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shopping list ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, completed, archived]
 *               totalBudget:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shopping list updated successfully
 *       404:
 *         description: Shopping list not found
 */
router.put('/:id', authenticate, asyncHandler(shoppingListController.updateList));

/**
 * @swagger
 * /shopping-lists/{id}:
 *   delete:
 *     summary: Delete shopping list
 *     tags: [Shopping Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shopping list ID
 *     responses:
 *       200:
 *         description: Shopping list deleted successfully
 *       404:
 *         description: Shopping list not found
 */
router.delete('/:id', authenticate, asyncHandler(shoppingListController.deleteList));

/**
 * @swagger
 * /shopping-lists/{id}/items:
 *   post:
 *     summary: Add item to shopping list
 *     tags: [Shopping Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shopping list ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ingredientName
 *               - quantity
 *               - unit
 *             properties:
 *               ingredientName:
 *                 type: string
 *                 example: "Milk"
 *               quantity:
 *                 type: number
 *                 example: 2
 *               unit:
 *                 type: string
 *                 example: "liters"
 *               category:
 *                 type: string
 *                 example: "Dairy & Eggs"
 *               estimatedPrice:
 *                 type: number
 *                 example: 4.50
 *               notes:
 *                 type: string
 *                 example: "Organic whole milk"
 *     responses:
 *       200:
 *         description: Item added to shopping list successfully
 *       404:
 *         description: Shopping list not found
 */
router.post('/:id/items', authenticate, asyncHandler(shoppingListController.addItem));

/**
 * @swagger
 * /shopping-lists/{id}/items/{itemId}:
 *   put:
 *     summary: Update item in shopping list
 *     tags: [Shopping Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shopping list ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ingredientName:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               category:
 *                 type: string
 *               estimatedPrice:
 *                 type: number
 *               actualPrice:
 *                 type: number
 *               isPurchased:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       404:
 *         description: Shopping list or item not found
 */
router.put('/:id/items/:itemId', authenticate, asyncHandler(shoppingListController.updateItem));

/**
 * @swagger
 * /shopping-lists/{id}/items/{itemId}:
 *   delete:
 *     summary: Remove item from shopping list
 *     tags: [Shopping Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shopping list ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item removed from shopping list successfully
 *       404:
 *         description: Shopping list or item not found
 */
router.delete('/:id/items/:itemId', authenticate, asyncHandler(shoppingListController.removeItem));

/**
 * @swagger
 * /shopping-lists/{id}/items/{itemId}/purchased:
 *   patch:
 *     summary: Mark item as purchased/unpurchased
 *     tags: [Shopping Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shopping list ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isPurchased
 *             properties:
 *               isPurchased:
 *                 type: boolean
 *                 example: true
 *               actualPrice:
 *                 type: number
 *                 example: 4.75
 *                 description: Actual price paid (optional, when marking as purchased)
 *     responses:
 *       200:
 *         description: Item purchase status updated successfully
 *       404:
 *         description: Shopping list or item not found
 */
router.patch('/:id/items/:itemId/purchased', authenticate, asyncHandler(shoppingListController.markItemPurchased));

/**
 * @swagger
 * /shopping-lists/generate:
 *   post:
 *     summary: Generate shopping list from recipes
 *     tags: [Shopping Lists]
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
 *               - recipeIds
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Meal Plan Shopping List"
 *               recipeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *               servings:
 *                 type: object
 *                 additionalProperties:
 *                   type: number
 *                 example: {"507f1f77bcf86cd799439011": 4, "507f1f77bcf86cd799439012": 2}
 *                 description: "Optional servings override per recipe (defaults to recipe servings)"
 *     responses:
 *       201:
 *         description: Shopping list generated successfully from recipes
 *       400:
 *         description: Validation error or invalid recipe IDs
 */
router.post('/generate', authenticate, asyncHandler(shoppingListController.generateFromRecipes));

export default router;

