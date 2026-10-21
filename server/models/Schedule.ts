import mongoose, { Schema, Document } from 'mongoose';

export interface IPickupSchedule extends Document {
  id: string;
  centreId: string;
  requestId: string;
  scheduledDate: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  assignedDriver?: string;
  vehicleNumber?: string;
  status: 'scheduled' | 'dispatched' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PickupScheduleSchema = new Schema<IPickupSchedule>(
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
    requestId: {
      type: String,
      required: true,
      index: true,
    },
    scheduledDate: {
      type: String,
      required: true,
    },
    timeSlot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
      default: 'morning',
    },
    assignedDriver: {
      type: String,
    },
    vehicleNumber: {
      type: String,
    },
    status: {
      type: String,
      enum: ['scheduled', 'dispatched', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    notes: {
      type: String,
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

export const PickupSchedule = mongoose.model<IPickupSchedule>('PickupSchedule', PickupScheduleSchema);
