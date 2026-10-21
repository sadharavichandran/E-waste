/**
 * Device Passport Types
 * 
 * These types represent the structured output from AI-based device
 * identification and material composition analysis.
 */

export type DeviceCategory =
  | 'mobile'
  | 'laptop'
  | 'tablet'
  | 'desktop'
  | 'charger_cable'
  | 'battery'
  | 'audio_wearable'
  | 'home_appliance'
  | 'crt_display'
  | 'other';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type HazardType =
  | 'lithium_battery'
  | 'lead'
  | 'mercury'
  | 'cadmium'
  | 'crt'
  | 'pcb_flame_retardant'
  | 'beryllium'
  | 'other';

export type HazardSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface MaterialEntry {
  name: string;
  estimatedMinGrams: number;
  estimatedMaxGrams: number;
  unit: 'grams' | 'milligrams' | 'kg' | 'percent';
  isHazardous: boolean;
  source: string;
  notes: string;
}

export interface HazardEntry {
  type: HazardType;
  present: boolean;
  severity: HazardSeverity;
  safetyInstructions: string[];
}

export interface DevicePassportResult {
  identified: boolean;
  confidence: ConfidenceLevel;
  category: DeviceCategory;
  brand: string | null;
  model: string | null;
  approximateYear: number | null;
  approximateWeightKg: number | null;
  weightSource: string;
  materials: MaterialEntry[];
  hazards: HazardEntry[];
  dataLimitations: string;
  needsMoreInfo: boolean;
  clarificationQuestion: string | null;
}

export interface SavedDevicePassport {
  id: string;
  userId: string;
  userName: string;
  createdAt: string;
  inputMethod: 'photo' | 'text';
  userInput: {
    brand?: string;
    model?: string;
    imageFileName?: string;
  };
  userCorrections?: {
    brand?: string;
    model?: string;
    category?: DeviceCategory;
  };
  result: DevicePassportResult;
  linkedPickupRequestId?: string;
}
