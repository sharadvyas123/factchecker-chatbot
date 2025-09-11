import mongoose from 'mongoose';

export interface IMessage extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  message: string;
  response: string;
  isFactChecked: boolean;
  factCheckResult?: {
    isAccurate: boolean;
    confidence: number;
    explanation: string;
    sources?: string[];
  };
  createdAt: Date;
}

const MessageSchema = new mongoose.Schema<IMessage>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  response: {
    type: String,
    required: true,
  },
  isFactChecked: {
    type: Boolean,
    default: false,
  },
  factCheckResult: {
    isAccurate: {
      type: Boolean,
      default: null,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
    },
    explanation: String,
    sources: [String],
  },
}, {
  timestamps: true,
});

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
