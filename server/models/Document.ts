import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentRecord extends Document {
  id: string;
  centreId: string;
  documentType: 'r2_certificate' | 'hazardous_license' | 'facility_photo' | 'other';
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  uploadedByUserId: string;
  verified: boolean;
  verifiedBySuperAdminId?: string;
  verifiedAt?: Date;
  createdAt: Date;
}

const DocumentRecordSchema = new Schema<IDocumentRecord>(
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
    documentType: {
      type: String,
      enum: ['r2_certificate', 'hazardous_license', 'facility_photo', 'other'],
      default: 'other',
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    storagePath: {
      type: String,
      required: true,
    },
    uploadedByUserId: {
      type: String,
      required: true,
      index: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedBySuperAdminId: {
      type: String,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret: any) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const DocumentRecord = mongoose.model<IDocumentRecord>('DocumentRecord', DocumentRecordSchema);
