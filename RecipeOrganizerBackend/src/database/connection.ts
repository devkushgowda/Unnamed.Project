import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URI environment variable is not defined');
    }

    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoUri, options);

    logger.info('✅ MongoDB connected successfully', {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    });

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('🔄 MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('🛑 MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

export default connectDatabase;