import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDatabase } from './database/connection';
import { logger } from './utils/logger';
import { errorHandler, notFound } from './middleware/errorHandler';
import { setupSwagger } from './utils/swagger';

// Import routes
import authRoutes from './routes/authRoutes';
import recipeRoutes from './routes/recipeRoutes';
import mealPlanRoutes from './routes/mealPlanRoutes';
import pantryRoutes from './routes/pantryRoutes';
import shoppingListRoutes from './routes/shoppingListRoutes';
import familyRoutes from './routes/familyRoutes';

// Load environment variables
dotenv.config({ path: './.env' });
dotenv.config({ path: './env.local' }); // Fallback

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:19006'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Setup Swagger Documentation
setupSwagger(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      database: 'connected',
      api: 'operational'
    }
  });
});

// Welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🍽️ Welcome to Recipe Organizer API',
    version: '1.0.0',
    status: 'operational',
    documentation: '/api-docs',
    health: '/health',
    endpoints: {
      authentication: '/api/v1/auth',
      recipes: '/api/v1/recipes',
      mealPlans: '/api/v1/meal-plans',
      pantry: '/api/v1/pantry',
      shoppingLists: '/api/v1/shopping-lists',
      family: '/api/v1/family'
    },
    features: [
      'User Authentication',
      'Recipe Management',
      'Meal Planning',
      'Pantry Management',
      'Shopping List Generation',
      'Family Group Collaboration',
      'Recipe Search & Filtering'
    ]
  });
});

// API routes with versioning
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/recipes', recipeRoutes);
app.use('/api/v1/meal-plans', mealPlanRoutes);
app.use('/api/v1/pantry', pantryRoutes);
app.use('/api/v1/shopping-lists', shoppingListRoutes);
app.use('/api/v1/family', familyRoutes);

// Legacy routes (without versioning for backward compatibility)
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/shopping-lists', shoppingListRoutes);
app.use('/api/family', familyRoutes);

// 404 handler
app.use('*', notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('📦 MongoDB connection established');
    
    app.listen(PORT, () => {
      logger.info(`🚀 Recipe Organizer API Server running on port ${PORT}`);
      logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`🌐 API Base URL: http://localhost:${PORT}/api/v1`);
      
      console.log('\n🎉 ===== RECIPE ORGANIZER API STARTED =====');
      console.log(`🚀 Server: http://localhost:${PORT}`);
      console.log(`📖 Swagger UI: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🔗 API v1: http://localhost:${PORT}/api/v1`);
      console.log('🔧 Available Endpoints:');
      console.log('   • POST /api/v1/auth/register - Register user');
      console.log('   • POST /api/v1/auth/login - Login user');
      console.log('   • GET  /api/v1/auth/profile - Get user profile');
      console.log('   • GET  /api/v1/recipes - Get all recipes');
      console.log('   • POST /api/v1/recipes - Create recipe');
      console.log('   • GET  /api/v1/meal-plans - Get meal plans');
      console.log('   • POST /api/v1/meal-plans - Create meal plan');
      console.log('   • GET  /api/v1/pantry - Get pantry items');
      console.log('   • POST /api/v1/pantry - Add pantry item');
      console.log('   • GET  /api/v1/shopping-lists - Get shopping lists');
      console.log('   • POST /api/v1/shopping-lists - Create shopping list');
      console.log('   • GET  /api/v1/family - Get family groups');
      console.log('   • POST /api/v1/family - Create family group');
      console.log('===============================================\n');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

export default app;