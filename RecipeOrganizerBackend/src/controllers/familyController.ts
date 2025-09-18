import { Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { FamilyGroup, IFamilyGroup } from '../models/FamilyGroup';
import { User } from '../models/User';

// Validation schemas
const createFamilyGroupSchema = z.object({
  name: z.string()
    .min(1, 'Family group name is required')
    .max(50, 'Name too long')
    .trim(),
  description: z.string()
    .max(200, 'Description too long')
    .optional(),
  settings: z.object({
    allowMemberInvites: z.boolean().default(true),
    requireApprovalForRecipes: z.boolean().default(false),
    sharedPantry: z.boolean().default(true),
    sharedMealPlans: z.boolean().default(true),
    sharedShoppingLists: z.boolean().default(true),
  }).optional(),
});

const updateFamilyGroupSchema = createFamilyGroupSchema.partial();

const inviteMemberSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
});

const updateMemberSchema = z.object({
  role: z.enum(['admin', 'member']).optional(),
  isActive: z.boolean().optional(),
});

const joinByInviteCodeSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required').trim().toUpperCase(),
});

// Helper functions
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function isUserFamilyAdmin(userId: string, familyGroup: IFamilyGroup): boolean {
  return familyGroup.adminId.toString() === userId;
}

function isUserFamilyMember(userId: string, familyGroup: IFamilyGroup): boolean {
  return familyGroup.members.some(member => 
    member.userId.toString() === userId && member.isActive
  );
}

export const familyController = {
  async getUserFamilyGroups(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    try {
      const userFamilyGroups = await FamilyGroup.find({
        'members.userId': req.user.id,
        'members.isActive': true
      })
      .populate('adminId', 'name email')
      .populate('members.userId', 'name email')
      .sort({ createdAt: -1 });

      // Add user's role to each group
      const groupsWithRole = userFamilyGroups.map(group => {
        const userMember = group.members.find(member => 
          member.userId.toString() === req.user!.id
        );
        
        return {
          ...group.toObject(),
          userRole: userMember?.role,
          isAdmin: group.adminId.toString() === req.user!.id,
          memberCount: group.members.filter(member => member.isActive).length,
        };
      });

      res.json({
        success: true,
        data: groupsWithRole,
      });
    } catch (error) {
      logger.error('Get user family groups error:', error);
      throw new ApiError('Failed to fetch family groups', 500);
    }
  },

  async getFamilyGroupById(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      throw new ApiError('Valid family group ID is required', 400);
    }

    try {
      const familyGroup = await FamilyGroup.findById(id)
        .populate('adminId', 'name email')
        .populate('members.userId', 'name email');

      if (!familyGroup) {
        throw new ApiError('Family group not found', 404);
      }

      // Check if user is a member
      if (!isUserFamilyMember(req.user.id, familyGroup)) {
        throw new ApiError('Access denied. You are not a member of this family group.', 403);
      }

      const userMember = familyGroup.members.find(member => 
        member.userId.toString() === req.user!.id
      );
      
      res.json({
        success: true,
        data: {
          ...familyGroup.toObject(),
          userRole: userMember?.role,
          isAdmin: familyGroup.adminId.toString() === req.user.id,
          memberCount: familyGroup.members.filter(member => member.isActive).length,
        },
      });
    } catch (error) {
      logger.error('Get family group error:', error);
      throw new ApiError('Failed to fetch family group', 500);
    }
  },

  async createFamilyGroup(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    try {
      const groupData = createFamilyGroupSchema.parse(req.body);

      // Check if user already has a family group as admin (limit one per user for now)
      const existingAdminGroup = await FamilyGroup.findOne({ adminId: req.user.id });
      if (existingAdminGroup) {
        throw new ApiError('You can only create one family group. Please leave your current group first.', 409);
      }

      // Generate unique invite code
      let inviteCode: string;
      let isUnique = false;
      do {
        inviteCode = generateInviteCode();
        const existingGroup = await FamilyGroup.findOne({ inviteCode });
        isUnique = !existingGroup;
      } while (!isUnique);

      const newFamilyGroup = new FamilyGroup({
        ...groupData,
        adminId: req.user.id,
        members: [
          {
            userId: req.user.id,
            role: 'admin',
            joinedAt: new Date(),
            isActive: true,
          },
        ],
        inviteCode: inviteCode!,
        settings: {
          allowMemberInvites: true,
          requireApprovalForRecipes: false,
          sharedPantry: true,
          sharedMealPlans: true,
          sharedShoppingLists: true,
          ...groupData.settings,
        },
      });

      await newFamilyGroup.save();
      await newFamilyGroup.populate('adminId', 'name email');
      await newFamilyGroup.populate('members.userId', 'name email');

      logger.info('Family group created', { 
        familyGroupId: newFamilyGroup._id, 
        adminId: req.user.id 
      });

      res.status(201).json({
        success: true,
        message: 'Family group created successfully',
        data: {
          ...newFamilyGroup.toObject(),
          userRole: 'admin',
          isAdmin: true,
          memberCount: 1,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }
      logger.error('Create family group error:', error);
      throw error;
    }
  },

  async updateFamilyGroup(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      throw new ApiError('Valid family group ID is required', 400);
    }

    try {
      const updates = updateFamilyGroupSchema.parse(req.body);

      const familyGroup = await FamilyGroup.findById(id);
      if (!familyGroup) {
        throw new ApiError('Family group not found', 404);
      }

      // Only admin can update family group
      if (!isUserFamilyAdmin(req.user.id, familyGroup)) {
        throw new ApiError('Only family group admin can update settings', 403);
      }

      Object.assign(familyGroup, updates);
      await familyGroup.save();
      await familyGroup.populate('adminId', 'name email');
      await familyGroup.populate('members.userId', 'name email');

      logger.info('Family group updated', { 
        familyGroupId: id, 
        adminId: req.user.id 
      });

      res.json({
        success: true,
        message: 'Family group updated successfully',
        data: familyGroup,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }
      logger.error('Update family group error:', error);
      throw error;
    }
  },

  async inviteMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      throw new ApiError('Valid family group ID is required', 400);
    }

    try {
      const { email } = inviteMemberSchema.parse(req.body);

      const familyGroup = await FamilyGroup.findById(id);
      if (!familyGroup) {
        throw new ApiError('Family group not found', 404);
      }

      // Check permissions
      const userMember = familyGroup.members.find(member => 
        member.userId.toString() === req.user!.id && member.isActive
      );
      if (!userMember) {
        throw new ApiError('You are not a member of this family group', 403);
      }

      if (userMember.role !== 'admin' && !familyGroup.settings.allowMemberInvites) {
        throw new ApiError('Only admins can invite members to this family group', 403);
      }

      // Find user by email
      const inviteeUser = await User.findOne({ email: email.toLowerCase() });
      if (!inviteeUser) {
        throw new ApiError('User with this email does not exist', 404);
      }

      // Check if user is already a member
      const existingMember = familyGroup.members.find(member => 
        member.userId.toString() === inviteeUser._id.toString()
      );
      
      if (existingMember) {
        if (existingMember.isActive) {
          throw new ApiError('User is already a member of this family group', 409);
        } else {
          // Reactivate inactive member
          existingMember.isActive = true;
          existingMember.joinedAt = new Date();
          await familyGroup.save();

          logger.info('Family member reactivated', { 
            familyGroupId: id, 
            memberEmail: email,
            inviterId: req.user.id 
          });

          res.json({
            success: true,
            message: 'Member reactivated successfully',
            data: { member: existingMember },
          });
          return;
        }
      }

      // Add new member
      familyGroup.members.push({
        userId: inviteeUser._id as any,
        role: 'member',
        joinedAt: new Date(),
        isActive: true,
      });

      await familyGroup.save();

      logger.info('Family group member added', { 
        familyGroupId: id, 
        memberEmail: email,
        inviterId: req.user.id 
      });

      res.json({
        success: true,
        message: 'Member added successfully',
        data: {
          inviteCode: familyGroup.inviteCode,
          memberCount: familyGroup.members.filter(m => m.isActive).length,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }
      logger.error('Invite member error:', error);
      throw error;
    }
  },

  async joinByInviteCode(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    try {
      const { inviteCode } = joinByInviteCodeSchema.parse(req.body);

      const familyGroup = await FamilyGroup.findOne({ 
        inviteCode: inviteCode.toUpperCase() 
      })
      .populate('adminId', 'name email')
      .populate('members.userId', 'name email');

      if (!familyGroup) {
        throw new ApiError('Invalid invite code', 404);
      }

      // Check if user is already a member
      const existingMember = familyGroup.members.find(member => 
        member.userId.toString() === req.user!.id
      );
      
      if (existingMember && existingMember.isActive) {
        throw new ApiError('You are already a member of this family group', 409);
      }

      if (existingMember && !existingMember.isActive) {
        // Reactivate
        existingMember.isActive = true;
        existingMember.joinedAt = new Date();
      } else {
        // Add new member
        familyGroup.members.push({
          userId: req.user.id as any,
          role: 'member',
          joinedAt: new Date(),
          isActive: true,
        });
      }

      await familyGroup.save();

      logger.info('User joined family group via invite code', { 
        familyGroupId: familyGroup._id, 
        userId: req.user.id,
        inviteCode 
      });

      res.json({
        success: true,
        message: 'Successfully joined family group',
        data: {
          familyGroup: {
            ...familyGroup.toObject(),
            userRole: 'member',
            isAdmin: false,
            memberCount: familyGroup.members.filter(member => member.isActive).length,
          },
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }
      logger.error('Join by invite code error:', error);
      throw error;
    }
  },

  async updateMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id, memberId } = req.params;
    
    if (!id || !memberId || typeof id !== 'string' || typeof memberId !== 'string') {
      throw new ApiError('Valid family group ID and member ID are required', 400);
    }

    try {
      const updates = updateMemberSchema.parse(req.body);

      const familyGroup = await FamilyGroup.findById(id);
      if (!familyGroup) {
        throw new ApiError('Family group not found', 404);
      }

      // Only admin can update members
      if (!isUserFamilyAdmin(req.user.id, familyGroup)) {
        throw new ApiError('Only family group admin can update members', 403);
      }

      const member = familyGroup.members.find(member => 
        member.userId.toString() === memberId
      );
      if (!member) {
        throw new ApiError('Member not found', 404);
      }

      // Prevent admin from removing their own admin role if they're the only admin
      if (member.userId.toString() === req.user.id && updates.role === 'member') {
        const adminCount = familyGroup.members.filter(m => m.role === 'admin' && m.isActive).length;
        if (adminCount <= 1) {
          throw new ApiError('Cannot remove admin role. Family group must have at least one admin.', 400);
        }
      }

      // Update member
      Object.assign(member, updates);
      await familyGroup.save();

      logger.info('Family group member updated', { 
        familyGroupId: id, 
        memberId,
        adminId: req.user.id 
      });

      res.json({
        success: true,
        message: 'Member updated successfully',
        data: { member },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }
      logger.error('Update member error:', error);
      throw error;
    }
  },

  async removeMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id, memberId } = req.params;
    
    if (!id || !memberId || typeof id !== 'string' || typeof memberId !== 'string') {
      throw new ApiError('Valid family group ID and member ID are required', 400);
    }

    try {
      const familyGroup = await FamilyGroup.findById(id);
      if (!familyGroup) {
        throw new ApiError('Family group not found', 404);
      }

      const member = familyGroup.members.find(member => 
        member.userId.toString() === memberId
      );
      if (!member) {
        throw new ApiError('Member not found', 404);
      }

      // Check permissions (admin can remove anyone, members can only remove themselves)
      const isAdmin = isUserFamilyAdmin(req.user.id, familyGroup);
      const isSelf = req.user.id === memberId;

      if (!isAdmin && !isSelf) {
        throw new ApiError('You can only remove yourself from the family group', 403);
      }

      // Prevent removing the last admin
      if (member.role === 'admin') {
        const adminCount = familyGroup.members.filter(m => m.role === 'admin' && m.isActive).length;
        if (adminCount <= 1) {
          throw new ApiError('Cannot remove the last admin. Please assign another admin first.', 400);
        }
      }

      // Deactivate member instead of removing (for data integrity)
      member.isActive = false;
      await familyGroup.save();

      logger.info('Family group member removed', { 
        familyGroupId: id, 
        memberId,
        removedBy: req.user.id 
      });

      res.json({
        success: true,
        message: 'Member removed successfully',
      });
    } catch (error) {
      logger.error('Remove member error:', error);
      throw error;
    }
  },

  async leaveFamilyGroup(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      throw new ApiError('Valid family group ID is required', 400);
    }

    try {
      const familyGroup = await FamilyGroup.findById(id);
      if (!familyGroup) {
        throw new ApiError('Family group not found', 404);
      }

      const member = familyGroup.members.find(member => 
        member.userId.toString() === req.user!.id
      );
      if (!member || !member.isActive) {
        throw new ApiError('You are not a member of this family group', 404);
      }

      // Check if user is the last admin
      if (member.role === 'admin') {
        const adminCount = familyGroup.members.filter(m => m.role === 'admin' && m.isActive).length;
        if (adminCount <= 1) {
          throw new ApiError('Cannot leave family group. You are the last admin. Please assign another admin first.', 400);
        }
      }

      // Deactivate member
      member.isActive = false;
      await familyGroup.save();

      logger.info('User left family group', { 
        familyGroupId: id, 
        userId: req.user.id 
      });

      res.json({
        success: true,
        message: 'Successfully left family group',
      });
    } catch (error) {
      logger.error('Leave family group error:', error);
      throw error;
    }
  },
};