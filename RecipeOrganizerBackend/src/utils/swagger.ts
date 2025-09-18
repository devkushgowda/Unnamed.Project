import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Recipe Organizer API',
      version: '1.0.0',
      description: 'AI-powered Recipe Organizer with meal planning and inventory management',
      contact: {
        name: 'Recipe Organizer Team',
        email: 'support@recipeorganizer.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.recipeorganizer.com/api/v1'
          : 'http://localhost:3000/api/v1',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token in the format: Bearer <token>',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            error: {
              type: 'string',
              example: 'Detailed error information',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Recipe: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            title: {
              type: 'string',
              example: 'Spaghetti Carbonara',
            },
            description: {
              type: 'string',
              example: 'Classic Italian pasta dish',
            },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Spaghetti' },
                  quantity: { type: 'number', example: 400 },
                  unit: { type: 'string', example: 'grams' },
                },
              },
            },
            instructions: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['Boil pasta', 'Mix eggs and cheese', 'Combine and serve'],
            },
            cookTime: {
              type: 'number',
              example: 20,
              description: 'Cooking time in minutes',
            },
            servings: {
              type: 'number',
              example: 4,
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              example: 'medium',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              example: ['pasta', 'italian', 'dinner'],
            },
            createdBy: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        MealPlan: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              example: 'Weekly Meal Plan',
            },
            startDate: {
              type: 'string',
              format: 'date',
              example: '2024-01-01',
            },
            endDate: {
              type: 'string',
              format: 'date',
              example: '2024-01-07',
            },
            meals: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', format: 'date' },
                  mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
                  recipeId: { type: 'string' },
                  servings: { type: 'number' },
                },
              },
            },
            userId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  // Swagger UI setup
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Recipe Organizer API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  }));

  // JSON endpoint for the swagger spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

export default swaggerSpec;