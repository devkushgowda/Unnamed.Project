import express from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { pantryController } from '../controllers/pantryController';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Pantry
 *   description: Pantry and inventory management
 */

/**
 * @swagger
 * /pantry:
 *   get:
 *     summary: Get all pantry items for user
 *     tags: [Pantry]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *           enum: [fridge, freezer, pantry, other]
 *         description: Filter by storage location
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Filter low stock items only
 *       - in: query
 *         name: expiringSoon
 *         schema:
 *           type: boolean
 *         description: Filter items expiring within 3 days
 *     responses:
 *       200:
 *         description: Pantry items retrieved successfully
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
 *                     $ref: '#/components/schemas/PantryItem'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     lowStockCount:
 *                       type: integer
 *                     expiringSoonCount:
 *                       type: integer
 */
router.get('/', authenticate, asyncHandler(pantryController.getAllItems));

/**
 * @swagger
 * /pantry/expiring:
 *   get:
 *     summary: Get items expiring soon
 *     tags: [Pantry]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *           minimum: 1
 *           maximum: 30
 *         description: Number of days ahead to check for expiring items
 *     responses:
 *       200:
 *         description: Expiring items retrieved successfully
 */
router.get('/expiring', authenticate, asyncHandler(pantryController.getExpiringItems));

/**
 * @swagger
 * /pantry/low-stock:
 *   get:
 *     summary: Get low stock items
 *     tags: [Pantry]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Low stock items retrieved successfully
 */
router.get('/low-stock', authenticate, asyncHandler(pantryController.getLowStockItems));

/**
 * @swagger
 * /pantry/categories:
 *   get:
 *     summary: Get all pantry categories for user
 *     tags: [Pantry]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/categories', authenticate, asyncHandler(pantryController.getCategories));

/**
 * @swagger
 * /pantry/{id}:
 *   get:
 *     summary: Get pantry item by ID
 *     tags: [Pantry]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pantry item ID
 *     responses:
 *       200:
 *         description: Pantry item retrieved successfully
 *       404:
 *         description: Pantry item not found
 */
router.get('/:id', authenticate, asyncHandler(pantryController.getItemById));

/**
 * @swagger
 * /pantry:
 *   post:
 *     summary: Add new pantry item
 *     tags: [Pantry]
 *     security:
 *       - bearerAuth: []
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
 *               - category
 *               - purchaseDate
 *             properties:
 *               ingredientName:
 *                 type: string
 *                 example: Milk
 *               quantity:
 *                 type: number
 *                 example: 2
 *               unit:
 *                 type: string
 *                 example: liters
 *               category:
 *                 type: string
 *                 example: Dairy & Eggs
 *               expirationDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-01-30
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-01-20
 *               location:
 *                 type: string
 *                 enum: [fridge, freezer, pantry, other]
 *                 example: fridge
 *               notes:
 *                 type: string
 *                 example: Organic whole milk
 *               minQuantity:
 *                 type: number
 *                 example: 1
 *     responses:
 *       201:
 *         description: Pantry item added successfully
 *       400:
 *         description: Validation error
 */
router.post('/', authenticate, asyncHandler(pantryController.createItem));

/**
 * @swagger
 * /pantry/{id}:
 *   put:
 *     summary: Update pantry item
 *     tags: [Pantry]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pantry item ID
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
 *               expirationDate:
 *                 type: string
 *                 format: date
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *               location:
 *                 type: string
 *                 enum: [fridge, freezer, pantry, other]
 *               notes:
 *                 type: string
 *               minQuantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Pantry item updated successfully
 *       404:
 *         description: Pantry item not found
 */
router.put('/:id', authenticate, asyncHandler(pantryController.updateItem));

/**
 * @swagger
 * /pantry/{id}:
 *   delete:
 *     summary: Delete pantry item
 *     tags: [Pantry]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pantry item ID
 *     responses:
 *       200:
 *         description: Pantry item deleted successfully
 *       404:
 *         description: Pantry item not found
 */
router.delete('/:id', authenticate, asyncHandler(pantryController.deleteItem));

/**
 * @swagger
 * /pantry/{id}/consume:
 *   post:
 *     summary: Consume quantity from pantry item
 *     tags: [Pantry]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pantry item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *                 example: 0.5
 *                 description: Amount to consume
 *     responses:
 *       200:
 *         description: Item consumed successfully
 *       400:
 *         description: Invalid quantity or insufficient stock
 *       404:
 *         description: Pantry item not found
 */
router.post('/:id/consume', authenticate, asyncHandler(pantryController.consumeItem));

export default router;
