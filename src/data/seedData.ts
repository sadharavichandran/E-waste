import { AuthAccount, DeviceCategory, EcoBadge } from '../types';

/**
 * Environmental Calculation Factors (UNITAR / ITU / EPA WARM models)
 * Applied in real-time as users submit and recycle genuine devices.
 */
export const ENVIRONMENTAL_IMPACT_FACTORS: Record<
  DeviceCategory,
  {
    co2KgPerUnit: number;
    toxicMetalsPreventedGrams: number;
    preciousMetalsRecoveredGrams: number;
    rawMineralsPreservedKg: number;
    label: string;
    pointsReward: number;
  }
> = {
  mobile: {
    co2KgPerUnit: 2.1,
    toxicMetalsPreventedGrams: 12,
    preciousMetalsRecoveredGrams: 0.024,
    rawMineralsPreservedKg: 15.0,
    label: 'Smartphone / Mobile',
    pointsReward: 50,
  },
  laptop: {
    co2KgPerUnit: 35.0,
    toxicMetalsPreventedGrams: 85,
    preciousMetalsRecoveredGrams: 0.18,
    rawMineralsPreservedKg: 120.0,
    label: 'Laptop / Notebook',
    pointsReward: 120,
  },
  tablet: {
    co2KgPerUnit: 14.5,
    toxicMetalsPreventedGrams: 35,
    preciousMetalsRecoveredGrams: 0.08,
    rawMineralsPreservedKg: 45.0,
    label: 'Tablet / iPad',
    pointsReward: 80,
  },
  desktop: {
    co2KgPerUnit: 65.0,
    toxicMetalsPreventedGrams: 210,
    preciousMetalsRecoveredGrams: 0.35,
    rawMineralsPreservedKg: 280.0,
    label: 'Desktop Computer',
    pointsReward: 180,
  },
  charger_cable: {
    co2KgPerUnit: 0.8,
    toxicMetalsPreventedGrams: 5,
    preciousMetalsRecoveredGrams: 0.005,
    rawMineralsPreservedKg: 3.5,
    label: 'Charger & Cables',
    pointsReward: 20,
  },
  battery: {
    co2KgPerUnit: 3.2,
    toxicMetalsPreventedGrams: 90,
    preciousMetalsRecoveredGrams: 0.015,
    rawMineralsPreservedKg: 18.0,
    label: 'Battery / Power Pack',
    pointsReward: 40,
  },
  audio_wearable: {
    co2KgPerUnit: 1.5,
    toxicMetalsPreventedGrams: 8,
    preciousMetalsRecoveredGrams: 0.01,
    rawMineralsPreservedKg: 6.0,
    label: 'Audio / Smartwatch',
    pointsReward: 35,
  },
  home_appliance: {
    co2KgPerUnit: 42.0,
    toxicMetalsPreventedGrams: 140,
    preciousMetalsRecoveredGrams: 0.12,
    rawMineralsPreservedKg: 190.0,
    label: 'Small Appliance',
    pointsReward: 90,
  },
  other: {
    co2KgPerUnit: 4.0,
    toxicMetalsPreventedGrams: 20,
    preciousMetalsRecoveredGrams: 0.02,
    rawMineralsPreservedKg: 20.0,
    label: 'Other Electronics',
    pointsReward: 30,
  },
};

/**
 * System Pre-Configured Accounts for Portal Login
 */
export const SYSTEM_PORTAL_ACCOUNTS: AuthAccount[] = [
  {
    id: 'user-001',
    name: 'Avery Morgan',
    email: 'user@ecoloop.org',
    role: 'user',
    organization: 'Community Resident / Student',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    joinedDate: '2026-01-15',
  },
  {
    id: 'admin-001',
    name: 'Marcus Sterling',
    email: 'admin@ecoloop.org',
    role: 'admin',
    organization: 'GreenLoop Logistics & Centre Partner',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    joinedDate: '2025-11-01',
  },
  {
    id: 'superadmin-001',
    name: 'Dr. Sarah Al-Mansoor',
    email: 'superadmin@ecoloop.org',
    role: 'superadmin',
    organization: 'Global E-Waste Compliance Authority',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    joinedDate: '2025-08-10',
  },
];

export const ECO_BADGES: EcoBadge[] = [
  {
    id: 'badge-first-loop',
    title: 'First Loop',
    description: 'Completed your very first verified electronic waste recycling event.',
    icon: 'Sparkles',
    requiredPoints: 50,
    category: 'Milestone',
  },
  {
    id: 'badge-data-purist',
    title: 'Data Purist',
    description: 'Wiped personal storage securely before device turnover.',
    icon: 'ShieldCheck',
    requiredPoints: 100,
    category: 'Security',
  },
  {
    id: 'badge-metal-rescuer',
    title: 'Rare Earth Rescuer',
    description: 'Diverted critical minerals and rare metals from dangerous landfill incinerators.',
    icon: 'Cpu',
    requiredPoints: 200,
    category: 'Impact',
  },
  {
    id: 'badge-zero-landfill',
    title: 'Zero Landfill Pioneer',
    description: 'Achieved over 350 EcoPoints across multiple devices.',
    icon: 'Award',
    requiredPoints: 350,
    category: 'Mastery',
  },
  {
    id: 'badge-emerald-ambassador',
    title: 'Emerald Ambassador',
    description: 'Top-tier circular economy contributor with 1000+ points.',
    icon: 'Crown',
    requiredPoints: 1000,
    category: 'Elite',
  },
];
