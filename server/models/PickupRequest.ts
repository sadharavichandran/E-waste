import mongoose, { Schema, Document } from 'mongoose';

export type RequestStatus = 'submitted' | 'confirmed' | 'collected' | 'recycled' | 'cancelled';
export type DeviceCondition = 'working' | 'repairable' | 'non_working';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface IStatusHistory {
  status: RequestStatus;
  timestamp: Date;
  note: string;
  updatedBy: string;
}

export interface IPickupRequest extends Document {
  id: string;
  userId?: string;
  userName: string;
  contactNumber: string;
  email: string;
  category: string;
  deviceName?: string;
  quantity: number;
  condition: DeviceCondition;
  address: string;
  city: string;
  pincode: string;
  preferredDate: string;
  preferredTimeSlot: TimeSlot;
  additionalInstructions?: string;
  hasBatteryHazard: boolean;
  status: RequestStatus;
  submittedAt: Date;
  statusHistory: IStatusHistory[];
  pointsAwarded: boolean;
  pointsEarned: number;
  estimatedCo2SavedKg: number;
  assignedCentreId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StatusHistorySchema = new Schema<IStatusHistory>(
  {
    status: {
      type: String,
      enum: ['submitted', 'confirmed', 'collected', 'recycled', 'cancelled'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: String,
      default: 'System',
    },
  },
  { _id: false }
);

const PickupRequestSchema = new Schema<IPickupRequest>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    userName: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Device category is required'],
      index: true,
    },
    deviceName: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    condition: {
      type: String,
      enum: ['working', 'repairable', 'non_working'],
      default: 'working',
    },
    address: {
      type: String,
      required: [true, 'Pickup address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
    },
    preferredDate: {
      type: String,
      required: [true, 'Preferred pickup date is required'],
    },
    preferredTimeSlot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
      default: 'morning',
    },
    additionalInstructions: {
      type: String,
      trim: true,
    },
    hasBatteryHazard: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['submitted', 'confirmed', 'collected', 'recycled', 'cancelled'],
      default: 'submitted',
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    statusHistory: {
      type: [StatusHistorySchema],
      default: [],
    },
    pointsAwarded: {
      type: Boolean,
      default: false,
    },
    pointsEarned: {
      type: Number,
      default: 0,
    },
    estimatedCo2SavedKg: {
      type: Number,
      default: 0,
    },
    assignedCentreId: {
      type: String,
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

// Compound indexes for fast portal filtering
PickupRequestSchema.index({ city: 1, status: 1 });
PickupRequestSchema.index({ assignedCentreId: 1, status: 1 });
PickupRequestSchema.index({ userId: 1, createdAt: -1 });

export const PickupRequest = mongoose.model<IPickupRequest>('PickupRequest', PickupRequestSchema);
