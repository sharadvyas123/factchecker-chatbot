import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  throw new Error('MONGODB_URI environment variable is required');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  console.log('dbConnect called, checking cached connection...');
  
  if (cached.conn) {
    console.log('Using cached database connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('Creating new database connection...');
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      retryWrites: true, // Enable retryable writes for better reliability
      w: 'majority' as const, // Write concern
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log('Database connection established successfully');
      return mongoose;
    }).catch((error) => {
      console.error('Database connection failed:', error);
      cached.promise = null; // Reset promise on failure
      throw new Error(`Database connection failed: ${error.message}`);
    });
  }
  
  console.log('Waiting for database connection promise...');
  cached.conn = await cached.promise;
  console.log('Database connection ready');
  return cached.conn;
}

export default dbConnect;
