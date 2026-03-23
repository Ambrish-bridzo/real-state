import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leadflow';

export const connectDB = async () => {
  console.log('[mongodb] Connecting to MongoDB...', process.env.MONGODB_URI);
  if (mongoose.connection.readyState >= 1) return;

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[mongodb] Connected to MongoDB');
  } catch (error) {
    console.error('[mongodb] Connection error:', error);
    process.exit(1);
  }
};
