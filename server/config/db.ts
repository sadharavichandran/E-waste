import mongoose from 'mongoose';

export interface DbStatus {
  isConnected: boolean;
  readyState: number;
  host: string;
  dbName: string;
  error: string | null;
  latencyMs: number;
}

let lastConnectionAttempt = 0;
let lastError: string | null = null;

export const connectToDatabase = async (): Promise<boolean> => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecoloop';
  const dbName = process.env.MONGODB_DB_NAME || 'ecoloop';

  if (mongoose.connection.readyState === 1) {
    return true;
  }

  try {
    lastConnectionAttempt = Date.now();
    lastError = null;

    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    console.log(`[MongoDB] Successfully connected to database: "${dbName}" at ${mongoose.connection.host}`);
    return true;
  } catch (err: any) {
    lastError = err.message || 'Failed to connect to MongoDB';
    console.error(`[MongoDB Connection Error]: ${lastError}`);
    return false;
  }
};

export const getDbStatus = async (): Promise<DbStatus> => {
  const readyState = mongoose.connection.readyState;
  const isConnected = readyState === 1;
  let latencyMs = -1;

  if (isConnected && mongoose.connection.db) {
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      latencyMs = Date.now() - start;
    } catch (e: any) {
      latencyMs = -1;
    }
  }

  return {
    isConnected,
    readyState,
    host: mongoose.connection.host || 'unknown',
    dbName: mongoose.connection.name || (process.env.MONGODB_DB_NAME || 'ecoloop'),
    error: lastError,
    latencyMs,
  };
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Connection disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Connection re-established');
});

mongoose.connection.on('error', (err) => {
  lastError = err.message;
  console.error('[MongoDB Error Event]:', err);
});
