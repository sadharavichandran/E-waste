import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryItem extends Document {
  id: string;
  centreId: string;
  category: string;
  deviceName?: string;
  quantity: number;
  weightKg: number;
  hazardousBatteryCount: number;
  batchNumber: string;
  status: 'received' | 'sorted' | 'processing' | 'shipped_to_smelter' | 'recycled';
  lastAuditedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema = new Schema<IInventoryItem>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    centreId: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    deviceName: {
      type: String,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    weightKg: {
      type: Number,
      default: 0,
    },
    hazardousBatteryCount: {
      type: Number,
      default: 0,
    },
    batchNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['received', 'sorted', 'processing', 'shipped_to_smelter', 'recycled'],
      default: 'received',
      index: true,
    },
    lastAuditedAt: {
      type: Date,
      default: Date.now,
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

export const InventoryItem = mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema);
