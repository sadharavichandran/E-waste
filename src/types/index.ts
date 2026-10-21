export type UserRole = 'user' | 'admin' | 'superadmin';

export type DeviceCategory = 
  | 'mobile'
  | 'laptop'
  | 'tablet'
  | 'desktop'
  | 'charger_cable'
  | 'battery'
  | 'audio_wearable'
  | 'home_appliance'
  | 'other';

export type DeviceCondition = 'working' | 'repairable' | 'non_working';

export type RequestStatus = 'submitted' | 'confirmed' | 'collected' | 'recycled' | 'cancelled';

export type CentreApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface PickupRequest {
  id: string; // e.g. ECL-2026-8941
  userId?: string;
  userName: string;
  contactNumber: string;
  email: string;
  category: DeviceCategory;
  deviceName?: string;
  quantity: number;
  condition: DeviceCondition;
  address: string;
  city: string;
  pincode: string;
  preferredDate: string;
  preferredTimeSlot: 'morning' | 'afternoon' | 'evening';
  additionalInstructions?: string;
  hasBatteryHazard: boolean;
  status: RequestStatus;
  submittedAt: string;
  statusHistory: {
    status: RequestStatus;
    timestamp: string;
    note: string;
    updatedBy?: string;
  }[];
  pointsAwarded: boolean;
  pointsEarned: number;
  estimatedCo2SavedKg: number;
}

export interface CollectionCentre {
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
  acceptedCategories: DeviceCategory[];
  isCertifiedR2: boolean;
  isHazardousBatteryCertified: boolean;
  centreType: 'Drop-off Kiosk' | 'Certified Recycler' | 'Brand Take-Back' | 'Municipal Hub';
  licenseNumber: string;
  approvalStatus: CentreApprovalStatus;
  submittedByAdminId: string;
  submittedByAdminName: string;
  submittedAt: string;
  reviewedBySuperAdminId?: string;
  reviewedAt?: string;
  verificationNotes?: string;
  rating?: number;
}

export interface EcoBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  requiredPoints: number;
  category: string;
  unlockedAt?: string;
}

export interface ActivityHistoryItem {
  id: string;
  requestId?: string;
  title: string;
  description: string;
  date: string;
  points: number;
  type: 'pickup' | 'dropoff' | 'bonus' | 'redemption';
}

export interface AuthAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
  avatarUrl?: string;
  joinedDate: string;
}

export interface UserSustainabilityProfile {
  id: string;
  ecoPoints: number;
  tier: 'Eco Novice' | 'Green Guardian' | 'Circular Champion' | 'Emerald Ambassador';
}

export interface DecisionQuery {
  deviceType: DeviceCategory;
  condition: DeviceCondition;
  hasPersonalData: boolean;
  isDamagedOrHazardousBattery: boolean;
  ageYears?: number;
}

export type RecommendationType = 'reuse_donation' | 'repair' | 'recycling' | 'specialist_hazard';

export interface DecisionRecommendation {
  type: RecommendationType;
  title: string;
  shortTagline: string;
  priorityLevel: 'normal' | 'recommended' | 'critical_safety';
  reasoning: string[];
  actionSteps: string[];
  dataSanitizationSteps?: string[];
  environmentalBenefit: string;
  suggestedAction: 'schedule_pickup' | 'find_centre' | 'local_donation' | 'authorized_repair';
}
