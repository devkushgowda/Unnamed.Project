import express from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { familyController } from '../controllers/familyController';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Family Groups
 *   description: Family collaboration and group management
 */

/**
 * @swagger
 * /family:
 *   get:
 *     summary: Get user's family groups
 *     tags: [Family Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Family groups retrieved successfully
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
 *                       description:
 *                         type: string
 *                       members:
 *                         type: array
 *                         items:
 *                           type: object
 */
router.get('/', authenticate, asyncHandler(familyController.getUserFamilyGroups));

/**
 * @swagger
 * /family/{id}:
 *   get:
 *     summary: Get family group by ID
 *     tags: [Family Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Family group ID
 *     responses:
 *       200:
 *         description: Family group retrieved successfully
 *       404:
 *         description: Family group not found
 */
router.get('/:id', authenticate, asyncHandler(familyController.getFamilyGroupById));

/**
 * @swagger
 * /family:
 *   post:
 *     summary: Create new family group
 *     tags: [Family Groups]
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
 *                 example: "Smith Family"
 *               description:
 *                 type: string
 *                 example: "Our family recipe collection"
 *     responses:
 *       201:
 *         description: Family group created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', authenticate, asyncHandler(familyController.createFamilyGroup));

/**
 * @swagger
 * /family/{id}:
 *   put:
 *     summary: Update family group
 *     tags: [Family Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Family group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Family group updated successfully
 *       404:
 *         description: Family group not found
 */
router.put('/:id', authenticate, asyncHandler(familyController.updateFamilyGroup));

/**
 * @swagger
 * /family/{id}/invite:
 *   post:
 *     summary: Invite member to family group
 *     tags: [Family Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Family group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "member@example.com"
 *     responses:
 *       200:
 *         description: Member invited successfully
 *       404:
 *         description: Family group not found
 */
router.post('/:id/invite', authenticate, asyncHandler(familyController.inviteMember));

/**
 * @swagger
 * /family/join:
 *   post:
 *     summary: Join family group by invite code
 *     tags: [Family Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inviteCode
 *             properties:
 *               inviteCode:
 *                 type: string
 *                 example: "ABC123DEF"
 *     responses:
 *       200:
 *         description: Successfully joined family group
 *       404:
 *         description: Invalid invite code
 */
router.post('/join', authenticate, asyncHandler(familyController.joinByInviteCode));

/**
 * @swagger
 * /family/{id}/members/{memberId}:
 *   put:
 *     summary: Update family group member
 *     tags: [Family Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Family group ID
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, member]
 *     responses:
 *       200:
 *         description: Member updated successfully
 *       404:
 *         description: Family group or member not found
 */
router.put('/:id/members/:memberId', authenticate, asyncHandler(familyController.updateMember));

/**
 * @swagger
 * /family/{id}/members/{memberId}:
 *   delete:
 *     summary: Remove member from family group
 *     tags: [Family Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Family group ID
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       404:
 *         description: Family group or member not found
 */
router.delete('/:id/members/:memberId', authenticate, asyncHandler(familyController.removeMember));

/**
 * @swagger
 * /family/{id}/leave:
 *   post:
 *     summary: Leave family group
 *     tags: [Family Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Family group ID
 *     responses:
 *       200:
 *         description: Successfully left family group
 *       404:
 *         description: Family group not found
 */
router.post('/:id/leave', authenticate, asyncHandler(familyController.leaveFamilyGroup));

export default router;
