import mongoose, { Schema, Document } from 'mongoose';

export type CentreApprovalStatus = 'pending' | 'approved' | 'rejected';
export type CentreType = 'Drop-off Kiosk' | 'Certified Recycler' | 'Brand Take-Back' | 'Municipal Hub';

export interface ICollectionCentre extends Document {
  id: string;
  name: string;
  organization: string;
  address: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  operatingHours: string;
  acceptedCategories: string[];
  isCertifiedR2: boolean;
  isHazardousBatteryCertified: boolean;
  centreType: CentreType;
  licenseNumber: string;
  approvalStatus: CentreApprovalStatus;
  submittedByAdminId: string;
  submittedByAdminName: string;
  submittedAt: Date;
  reviewedBySuperAdminId?: string;
  reviewedAt?: Date;
  verificationNotes?: string;
  rating: number;
  isSuspended: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CollectionCentreSchema = new Schema<ICollectionCentre>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Centre name is required'],
      trim: true,
    },
    organization: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      index: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
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
    lat: {
      type: Number,
      required: true,
      default: 13.0827,
    },
    lng: {
      type: Number,
      required: true,
      default: 80.2707,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },
    operatingHours: {
      type: String,
      default: '9:00 AM - 6:00 PM',
    },
    acceptedCategories: {
      type: [String],
      default: ['mobile', 'laptop', 'tablet', 'desktop', 'charger_cable', 'battery'],
    },
    isCertifiedR2: {
      type: Boolean,
      default: false,
    },
    isHazardousBatteryCertified: {
      type: Boolean,
      default: false,
    },
    centreType: {
      type: String,
      enum: ['Drop-off Kiosk', 'Certified Recycler', 'Brand Take-Back', 'Municipal Hub'],
      default: 'Certified Recycler',
    },
    licenseNumber: {
      type: String,
      default: '',
      trim: true,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    submittedByAdminId: {
      type: String,
      required: true,
      index: true,
    },
    submittedByAdminName: {
      type: String,
      required: true,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedBySuperAdminId: {
      type: String,
    },
    reviewedAt: {
      type: Date,
    },
    verificationNotes: {
      type: String,
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    isSuspended: {
      type: Boolean,
      default: false,
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

// Compound index for geolocation search and approval filtering
CollectionCentreSchema.index({ approvalStatus: 1, isSuspended: 1, city: 1 });

export const CollectionCentre = mongoose.model<ICollectionCentre>('CollectionCentre', CollectionCentreSchema);
