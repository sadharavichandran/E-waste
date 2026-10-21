import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityHistory extends Document {
  id: string;
  requestId?: string;
  userId?: string;
  title: string;
  description: string;
  date: string;
  points: number;
  type: 'pickup' | 'dropoff' | 'bonus' | 'redemption';
  createdAt: Date;
}

const ActivityHistorySchema = new Schema<IActivityHistory>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    requestId: {
      type: String,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
    },
    points: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      enum: ['pickup', 'dropoff', 'bonus', 'redemption'],
      default: 'pickup',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const ActivityHistory = mongoose.model<IActivityHistory>('ActivityHistory', ActivityHistorySchema);
