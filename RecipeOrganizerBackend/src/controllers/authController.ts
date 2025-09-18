import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { ApiError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { User, IUser } from '../models/User';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const generateToken = (user: IUser): string => {
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
  const payload = {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
  };
  
  return jwt.sign(payload, jwtSecret, { 
    expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
  } as SignOptions);
};

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const { email, password, name } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ApiError('User already exists with this email', 400);
    }

    // Create user (password will be hashed by the pre-save middleware)
    const newUser = new User({
      email: email.toLowerCase(),
      name,
      password,
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser);

    logger.info('User registered successfully', { userId: newUser._id, email });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser._id,
          email: newUser.email,
          name: newUser.name,
          createdAt: newUser.createdAt,
        },
        token,
      },
    });
  },

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new ApiError('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError('Invalid email or password', 401);
    }

    // Generate token
    const token = generateToken(user);

    logger.info('User logged in successfully', { userId: user._id, email });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  },

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    // Find user details
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        preferences: user.preferences,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    });
  },
};