import { DecisionQuery, DecisionRecommendation, DeviceCategory } from '../types';

export function evaluateDecision(query: DecisionQuery): DecisionRecommendation {
  const { deviceType, condition, hasPersonalData, isDamagedOrHazardousBattery } = query;

  // Rule 1: Hazardous battery or physically punctured/swollen cell
  // CRITICAL SAFETY RULE: Never open or dismantle batteries.
  if (isDamagedOrHazardousBattery || (deviceType === 'battery' && condition === 'non_working')) {
    return {
      type: 'specialist_hazard',
      title: 'Specialist Hazardous Handling Required',
      shortTagline: 'Caution: Damaged or swollen lithium cells present fire & chemical risks.',
      priorityLevel: 'critical_safety',
      reasoning: [
        'Swollen, leaking, or pierced lithium-ion batteries can undergo thermal runaway if punctured, crushed, or exposed to moisture.',
        'Standard curbside collection or general waste compactors pose a high vehicle fire hazard.',
        'Requires specialized containment and direct handover to an EPA / R2 certified hazardous waste handler.',
      ],
      actionSteps: [
        'DO NOT dismantle, puncture, squeeze, or attempt to recharge this battery.',
        'Isolate the device in a non-flammable container lined with sand, cat litter, or vermiculite if available.',
        'Cover exposed metal terminals with non-conductive electrical tape.',
        'Do not place in general trash or unverified collection bins.',
        'Request a designated Hazardous Pickup through EcoLoop or drop off directly at a hazardous-certified facility.',
      ],
      environmentalBenefit:
        'Prevents catastrophic toxic fires and prevents toxic lithium salts and heavy metals from leaching into municipal groundwater.',
      suggestedAction: 'find_centre',
      ...(hasPersonalData ? {
        dataSanitizationSteps: [
          'Because the battery is structurally compromised, do NOT plug the device in to wipe data.',
          'Request certified hardware degaussing or physical shredding under witness from an R2 certified recycler.',
        ]
      } : {}),
    };
  }

  // Rule 2: Working device without physical damage -> Reuse or Donation
  if (condition === 'working') {
    const isComputingDevice = ['laptop', 'desktop', 'tablet', 'mobile'].includes(deviceType);
    return {
      type: 'reuse_donation',
      title: 'High Circular Value: Reuse or Community Donation',
      shortTagline: 'Extending a device lifespan by 2 years cuts its lifetime carbon footprint by over 40%.',
      priorityLevel: 'recommended',
      reasoning: [
        'Your device is fully functional and has substantial remaining lifecycle value.',
        'Local community schools, non-profit learning labs, and students frequently need working hardware.',
        'Manufacturing a single new computer consumes over 1,500 kg of water, 240 kg of fossil fuels, and 22 kg of chemicals.',
      ],
      actionSteps: [
        hasPersonalData
          ? 'Complete full personal data sanitization (follow the NIST 800-88 checklist below).'
          : 'Clean the exterior using 70% isopropyl alcohol and a microfiber cloth.',
        'Include the original power adapter, charger cord, and any accessories if available.',
        'Choose whether to donate to an educational charity or list on our verified circular refurbishment loop.',
        'Schedule a free EcoLoop verified pickup or deliver to a community donation partner.',
      ],
      dataSanitizationSteps: hasPersonalData ? getSanitizationSteps(deviceType) : undefined,
      environmentalBenefit:
        'Prevents 100% of the embodied manufacturing emissions of a brand-new replacement unit.',
      suggestedAction: 'schedule_pickup',
    };
  }

  // Rule 3: Repairable device -> Professional Repair or Refurbishment
  if (condition === 'repairable') {
    return {
      type: 'repair',
      title: 'Repair & Component Refurbishment',
      shortTagline: 'Repairable devices can be restored with modular component replacements.',
      priorityLevel: 'recommended',
      reasoning: [
        'Common failures like depleted batteries, cracked screens, or worn ports are easily serviceable by certified technicians.',
        'Repair keeps the core motherboard and high-embodied-energy silicon in active use.',
        'Even if you do not wish to keep it, our certified refurbishment partners restore and re-circulate it to students at subsidized rates.',
      ],
      actionSteps: [
        'Backup any remaining accessible data to a secure cloud drive or external storage.',
        hasPersonalData
          ? 'Perform a factory reset or remove sensitive personal accounts before handover.'
          : 'Label the known fault (e.g. "Screen cracked", "Power button loose") to expedite triage.',
        'Book an EcoLoop circular pickup, or visit an authorized Right-to-Repair partner.',
      ],
      dataSanitizationSteps: hasPersonalData ? getSanitizationSteps(deviceType) : undefined,
      environmentalBenefit:
        'Saves up to 85% of virgin raw mineral mining while extending device utility by 3-5 years.',
      suggestedAction: 'schedule_pickup',
    };
  }

  // Rule 4: Non-working electronics -> Responsible E-Waste Material Recycling
  return {
    type: 'recycling',
    title: 'Responsible Material Recovery & E-Waste Recycling',
    shortTagline: 'Safe mechanical disassembly to recover precious metals and neutralise toxins.',
    priorityLevel: 'normal',
    reasoning: [
      'The device is no longer safely or economically repairable.',
      'Printed circuit boards contain precious metals (gold, palladium, copper, silver) alongside hazardous lead and cadmium solder.',
      'Sending this to a certified R2 / e-Stewards smelter ensures 98%+ material recovery with zero landfill dumping.',
    ],
    actionSteps: [
      hasPersonalData
        ? 'If storage drive is removable (e.g. SATA SSD or HDD), remove it or follow non-power sanitization steps.'
        : 'Gather all associated cords, plugs, and chargers to recycle in the same batch.',
      'Do not place in municipal blue recycling bins (MRFs cannot process electronic components).',
      'Schedule a free doorstep pickup through EcoLoop or drop off at the nearest verified collection centre.',
    ],
    dataSanitizationSteps: hasPersonalData ? getSanitizationSteps(deviceType) : undefined,
    environmentalBenefit:
      'Diverts toxic cadmium and lead from municipal landfills and reclaims rare earth metals for clean energy technologies.',
    suggestedAction: 'schedule_pickup',
  };
}

function getSanitizationSteps(category: DeviceCategory): string[] {
  if (category === 'mobile' || category === 'tablet') {
    return [
      '1. Cloud Backup: Sync contacts, photos, and messages to your personal cloud account.',
      '2. Account De-linking: Sign out of Apple ID / iCloud (disable "Find My") or Google Account (remove FRP Lock). Devices locked to an account cannot be reused.',
      '3. 2FA Tokens: Ensure any authenticator apps (Google Auth, Duo) are transferred to your new device.',
      '4. Cryptographic Wipe: Go to Settings > General > Reset > "Erase All Content and Settings". Modern iOS & Android use hardware encryption keys that are destroyed upon factory reset.',
      '5. Eject Physical SIM and microSD cards before packaging.',
    ];
  }

  if (category === 'laptop' || category === 'desktop') {
    return [
      '1. Data Backup: Transfer files to an external SSD or encrypted backup repository.',
      '2. Sign Out: Sign out of Microsoft, Apple, or Google workspace accounts and revoke device authorizations.',
      '3. NIST 800-88 Purge: For Windows, use "Reset this PC" > "Fully clean the drive". For macOS, use "Erase All Content and Settings" (Apple Silicon) or Disk Utility APFS cryptographic erase.',
      '4. Linux / Advanced: Execute `blkdiscard` on NVMe SSDs or run `shred -v -n 3` on spinning magnetic drives.',
      '5. Remove any external dongles, SD cards, or wireless mouse receivers.',
    ];
  }

  return [
    '1. Inspect for any removable memory cards (SD / microSD / USB sticks) and remove them.',
    '2. Perform a hardware reset button hold (usually 10-15 seconds) to clear cached volatile memory and Wi-Fi credentials.',
  ];
}
