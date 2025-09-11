import mongoose from 'mongoose';

declare global {
  var mongoose: {
    conn: mongoose.Mongoose | null;
    promise: Promise<mongoose.Mongoose> | null;
  };

  namespace NodeJS {
    interface ProcessEnv {
      MONGODB_URI: string;
      JWT_SECRET: string;
      N8N_WEBHOOK_URL: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

export {};
