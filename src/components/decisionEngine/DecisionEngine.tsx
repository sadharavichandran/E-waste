import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { evaluateDecision } from '../../utils/decisionEngineLogic';
import { DecisionQuery, DeviceCategory, DeviceCondition } from '../../types';
import {
  Compass,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  Plug,
  BatteryCharging,
  Headphones,
  Home,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Truck,
  MapPin,
  Lock,
  HeartHandshake,
  Wrench,
  Recycle,
} from 'lucide-react';

const DEVICE_OPTIONS: { id: DeviceCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'mobile', label: 'Mobile / Smartphone', icon: Smartphone },
  { id: 'laptop', label: 'Laptop / Notebook', icon: Laptop },
  { id: 'tablet', label: 'Tablet / iPad', icon: Tablet },
  { id: 'desktop', label: 'Desktop / PC Tower', icon: Monitor },
  { id: 'charger_cable', label: 'Charger / Cable', icon: Plug },
  { id: 'battery', label: 'Battery / Power Pack', icon: BatteryCharging },
  { id: 'audio_wearable', label: 'Audio / Smartwatch', icon: Headphones },
  { id: 'home_appliance', label: 'Small Appliance', icon: Home },
];

export const DecisionEngine: React.FC = () => {
  const { setActiveTab, setPreselectedCategory } = useApp();

  const [deviceType, setDeviceType] = useState<DeviceCategory>('laptop');
  const [condition, setCondition] = useState<DeviceCondition>('repairable');
  const [hasPersonalData, setHasPersonalData] = useState<boolean>(true);
  const [isDamagedOrHazardousBattery, setIsDamagedOrHazardousBattery] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(true); // start evaluated for instant demo clarity

  const query: DecisionQuery = {
    deviceType,
    condition,
    hasPersonalData,
    isDamagedOrHazardousBattery,
  };

  const recommendation = evaluateDecision(query);

  const handleBookWithResult = () => {
    setPreselectedCategory(deviceType);
    setActiveTab('schedule_pickup');
  };

  const handleLocateCentres = () => {
    setPreselectedCategory(deviceType);
    setActiveTab('collection_centres');
  };

  const getRecommendationIcon = () => {
    switch (recommendation.type) {
      case 'reuse_donation':
        return <HeartHandshake className="w-8 h-8 text-emerald-600" />;
      case 'repair':
        return <Wrench className="w-8 h-8 text-sky-600" />;
      case 'recycling':
        return <Recycle className="w-8 h-8 text-teal-600" />;
      case 'specialist_hazard':
        return <Flame className="w-8 h-8 text-rose-600" />;
    }
  };

  const getRecommendationBadge = () => {
    switch (recommendation.type) {
      case 'reuse_donation':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Circular Tier 1: Reuse & Donation</span>;
      case 'repair':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">Circular Tier 2: Component Repair</span>;
      case 'recycling':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800">Circular Tier 3: Smelting & Extraction</span>;
      case 'specialist_hazard':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 animate-pulse">Critical: Hazardous Containment</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
          <Compass className="w-4 h-4" />
          Guided Triage Engine
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Smart E-Waste Decision Engine
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
          Transparent, rule-based circular assessment. Select your electronic equipment specifications to receive certified safety guidelines, data wiping procedures, and the optimal end-of-life path.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step-by-Step Question Form (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Device Diagnostic Assessment</h3>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              Rules Engine v2.4
            </span>
          </div>

          {/* Question 1: Device Type */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>1. Select Device Category</span>
              <span className="text-[10px] text-slate-400 font-normal">Required</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DEVICE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = deviceType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDeviceType(opt.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-semibold shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span className="text-xs truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 2: Device Condition */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700">2. Physical & Operational Condition</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCondition('working')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  condition === 'working'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-semibold shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold">Working</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Powers on & works</div>
              </button>

              <button
                type="button"
                onClick={() => setCondition('repairable')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  condition === 'repairable'
                    ? 'border-sky-600 bg-sky-50/80 text-sky-950 font-semibold shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold">Repairable</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Cracked / battery low</div>
              </button>

              <button
                type="button"
                onClick={() => setCondition('non_working')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  condition === 'non_working'
                    ? 'border-slate-700 bg-slate-100 text-slate-900 font-semibold shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold">Dead / Non-working</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Will not power on</div>
              </button>
            </div>
          </div>

          {/* Question 3: Personal Data Check */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              3. Does this device contain personal accounts or stored data?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHasPersonalData(true)}
                className={`p-2.5 rounded-xl border text-center text-xs font-medium transition cursor-pointer ${
                  hasPersonalData
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                Yes (Photos, Accounts, SSD/HDD)
              </button>
              <button
                type="button"
                onClick={() => setHasPersonalData(false)}
                className={`p-2.5 rounded-xl border text-center text-xs font-medium transition cursor-pointer ${
                  !hasPersonalData
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                No / Already Cleaned
              </button>
            </div>
          </div>

          {/* Question 4: Battery Hazard / Damage Check */}
          <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2.5">
            <label className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              4. Battery Safety: Is battery swollen, leaking, pierced or hot?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsDamagedOrHazardousBattery(true)}
                className={`p-2 rounded-xl border text-center text-xs font-semibold transition cursor-pointer ${
                  isDamagedOrHazardousBattery
                    ? 'border-rose-600 bg-rose-600 text-white shadow-xs'
                    : 'border-rose-200 bg-white text-rose-700 hover:bg-rose-100/50'
                }`}
              >
                Yes (Swollen / Damaged)
              </button>
              <button
                type="button"
                onClick={() => setIsDamagedOrHazardousBattery(false)}
                className={`p-2 rounded-xl border text-center text-xs font-semibold transition cursor-pointer ${
                  !isDamagedOrHazardousBattery
                    ? 'border-slate-800 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                No Hazard Detected
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Recommendation Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {getRecommendationBadge()}
              <span className="text-[11px] text-slate-400">
                Assessment Target: <strong className="text-slate-700 capitalize">{deviceType.replace('_', ' ')}</strong>
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 shrink-0">
                {getRecommendationIcon()}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                  {recommendation.title}
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {recommendation.shortTagline}
                </p>
              </div>
            </div>

            {/* Clear Reasoning */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Technical & Environmental Reasoning
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {recommendation.reasoning.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Practical Next Steps */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                Prescribed Action Steps
              </h4>
              <div className="space-y-2">
                {recommendation.actionSteps.map((step, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Secure Data-Erasure Guidance (NIST 800-88) */}
            {recommendation.dataSanitizationSteps && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-600" />
                    Secure Data Sanitization Protocol (NIST 800-88 Standard)
                  </h4>
                </div>
                <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-2 text-xs text-indigo-950">
                  {recommendation.dataSanitizationSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="font-semibold text-indigo-700 shrink-0">•</span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Environmental Benefit Summary */}
            <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="leading-relaxed">
                <strong className="font-semibold">Circular Impact:</strong> {recommendation.environmentalBenefit}
              </div>
            </div>

            {/* Action Buttons to connect immediately to pickup booking or centre locator */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {recommendation.type === 'specialist_hazard' ? (
                <button
                  onClick={handleLocateCentres}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MapPin className="w-4 h-4" />
                  Locate Hazardous-Certified Drop-off Facility
                </button>
              ) : (
                <>
                  <button
                    onClick={handleBookWithResult}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Truck className="w-4 h-4" />
                    Schedule Pickup for this {DEVICE_OPTIONS.find((d) => d.id === deviceType)?.label}
                  </button>
                  <button
                    onClick={handleLocateCentres}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    Find Nearby Drop-off Centre
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
