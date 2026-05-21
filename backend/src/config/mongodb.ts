import mongoose from 'mongoose';

export const connectMongoDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/leaderboard';

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    throw err;
  }
};

// Score Event Schema - for audit trail & analytics
const scoreEventSchema = new mongoose.Schema(
  {
    playerId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    earnings: { type: Number, required: true },
    prizeContribution: { type: Number, required: true }, // 2% of earnings
    scoreBefore: { type: Number, required: true },
    scoreAfter: { type: Number, required: true },
    rankBefore: { type: Number },
    rankAfter: { type: Number },
    weekStart: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timeseries: {
      timeField: 'timestamp',
      metaField: 'metadata',
      granularity: 'minutes',
    },
    expireAfterSeconds: 60 * 60 * 24 * 90, // 90 days
  }
);

export const ScoreEvent = mongoose.model('ScoreEvent', scoreEventSchema);

// Week Reset Log
const weekResetSchema = new mongoose.Schema({
  weekStart: { type: String, required: true },
  weekEnd: { type: String, required: true },
  totalPlayers: { type: Number, required: true },
  totalPool: { type: Number, required: true },
  distributionsCount: { type: Number, required: true },
  processedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['success', 'partial', 'failed'], default: 'success' },
  error: { type: String },
});

export const WeekResetLog = mongoose.model('WeekResetLog', weekResetSchema);

export default mongoose;
