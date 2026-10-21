import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DeviceCategory, DeviceCondition, PickupRequest } from '../../types';
import { PickupConfirmation } from './PickupConfirmation';
import {
  Truck,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  Plug,
  BatteryCharging,
  Headphones,
  Home,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  AlertTriangle,
  User,
  Phone,
  Mail,
  FileText,
  ShieldAlert,
} from 'lucide-react';

const CATEGORIES: { id: DeviceCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'mobile', label: 'Smartphone / Mobile', icon: Smartphone },
  { id: 'laptop', label: 'Laptop / Notebook', icon: Laptop },
  { id: 'tablet', label: 'Tablet / iPad', icon: Tablet },
  { id: 'desktop', label: 'Desktop / PC Tower', icon: Monitor },
  { id: 'charger_cable', label: 'Charger & Cables', icon: Plug },
  { id: 'battery', label: 'Battery / Power Pack', icon: BatteryCharging },
  { id: 'audio_wearable', label: 'Audio / Smartwatch', icon: Headphones },
  { id: 'home_appliance', label: 'Small Appliance', icon: Home },
];

export const PickupBooking: React.FC = () => {
  const {
    currentUser,
    submitPickupRequest,
    preselectedCategory,
    setPreselectedCategory,
  } = useApp();

  // Form State
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [contactNumber, setContactNumber] = useState('+1 (555) 349-2041');
  const [category, setCategory] = useState<DeviceCategory>(preselectedCategory || 'laptop');
  const [deviceName, setDeviceName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [condition, setCondition] = useState<DeviceCondition>('repairable');
  const [address, setAddress] = useState('424 University Ave, Apt 3B');
  const [city, setCity] = useState('San Francisco');
  const [pincode, setPincode] = useState('94107');
  const [preferredDate, setPreferredDate] = useState(() => {
    // Tomorrow's date default
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [hasBatteryHazard, setHasBatteryHazard] = useState(false);

  // Status & Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<PickupRequest | null>(null);

  // Sync if preselectedCategory changes
  useEffect(() => {
    if (preselectedCategory) {
      setCategory(preselectedCategory);
      setPreselectedCategory(null);
    }
  }, [preselectedCategory, setPreselectedCategory]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!userName.trim()) errs.userName = 'Full name is required';
    if (!email.trim() || !email.includes('@')) errs.email = 'Valid email address is required';
    if (!contactNumber.trim() || contactNumber.length < 7) errs.contactNumber = 'Valid contact number is required';
    if (!address.trim()) errs.address = 'Street pickup address is required';
    if (!city.trim()) errs.city = 'City is required';
    if (!pincode.trim() || pincode.length < 4) errs.pincode = 'Valid postal / pincode is required';
    if (!preferredDate) errs.preferredDate = 'Please select a pickup date';
    if (quantity < 1 || quantity > 100) errs.quantity = 'Quantity must be between 1 and 100';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    // Simulate network submission with smooth loading state
    setTimeout(() => {
      const newReq = submitPickupRequest({
        userName: userName.trim(),
        email: email.trim(),
        contactNumber: contactNumber.trim(),
        category,
        deviceName: deviceName.trim() || `${category.replace('_', ' ')} item(s)`,
        quantity: Number(quantity),
        condition,
        address: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        preferredDate,
        preferredTimeSlot,
        additionalInstructions: additionalInstructions.trim(),
        hasBatteryHazard,
      });

      setIsSubmitting(false);
      setSubmittedRequest(newReq);
    }, 600);
  };

  if (submittedRequest) {
    return (
      <PickupConfirmation
        request={submittedRequest}
        onReset={() => {
          setSubmittedRequest(null);
          setDeviceName('');
          setAdditionalInstructions('');
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
          <Truck className="w-4 h-4" />
          Zero-Landfill Circular Logistics
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Schedule Doorstep E-Waste Pickup
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Compliant doorstep collection for residential households, campus dormitories, and educational institutions.
        </p>
      </div>

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-8">
        {/* Section 1: Contact Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <User className="w-4 h-4 text-emerald-600" />
            1. Contact Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Avery Morgan"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs outline-hidden transition ${
                  errors.userName ? 'border-rose-400 bg-rose-50' : 'border-slate-200 focus:border-emerald-600 focus:bg-white'
                }`}
              />
              {errors.userName && <p className="text-[10px] text-rose-500 mt-1">{errors.userName}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. avery.m@greentech.edu"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs outline-hidden transition ${
                  errors.email ? 'border-rose-400 bg-rose-50' : 'border-slate-200 focus:border-emerald-600 focus:bg-white'
                }`}
              />
              {errors.email && <p className="text-[10px] text-rose-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs outline-hidden transition ${
                  errors.contactNumber ? 'border-rose-400 bg-rose-50' : 'border-slate-200 focus:border-emerald-600 focus:bg-white'
                }`}
              />
              {errors.contactNumber && <p className="text-[10px] text-rose-500 mt-1">{errors.contactNumber}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Electronic Equipment Specifications */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            2. Electronic Device Specification
          </h3>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Select Device Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span className="text-xs truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Device Brand / Model Description
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g. Lenovo ThinkPad T480 / iPhone 8"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-emerald-600 focus:bg-white transition"
              />
              <p className="text-[10px] text-slate-400 mt-1">Helps sorting technicians assign proper bins</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Item Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-emerald-600 focus:bg-white transition"
              />
              {errors.quantity && <p className="text-[10px] text-rose-500 mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Working Condition <span className="text-rose-500">*</span>
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as DeviceCondition)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-emerald-600 focus:bg-white transition capitalize"
              >
                <option value="working">Fully Functional / Working</option>
                <option value="repairable">Repairable / Minor Faults</option>
                <option value="non_working">Dead / Non-Working / Scrapped</option>
              </select>
            </div>
          </div>

          {/* Battery Hazard Toggle Checkbox */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
            <input
              type="checkbox"
              id="batteryHazard"
              checked={hasBatteryHazard}
              onChange={(e) => setHasBatteryHazard(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-amber-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="batteryHazard" className="text-xs text-amber-950 cursor-pointer">
              <strong className="font-semibold block">Hazard Notice: Contains swollen, damaged, or pierced battery</strong>
              <span className="text-[11px] text-amber-800">
                Checking this ensures dispatch assigns an OSHA/DOT certified fire-retardant safety container for pickup.
              </span>
            </label>
          </div>
        </div>

        {/* Section 3: Pickup Location & Preferred Time */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-emerald-600" />
            3. Doorstep Address & Scheduling
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Street Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Apartment, building number, street name"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs outline-hidden transition ${
                  errors.address ? 'border-rose-400 bg-rose-50' : 'border-slate-200 focus:border-emerald-600 focus:bg-white'
                }`}
              />
              {errors.address && <p className="text-[10px] text-rose-500 mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. San Francisco"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-emerald-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Postal / Pincode <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 94107"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-emerald-600 focus:bg-white transition"
                />
                {errors.pincode && <p className="text-[10px] text-rose-500 mt-1">{errors.pincode}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preferred Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-emerald-600 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preferred Time Slot
                </label>
                <select
                  value={preferredTimeSlot}
                  onChange={(e) => setPreferredTimeSlot(e.target.value as 'morning' | 'afternoon' | 'evening')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-emerald-600 focus:bg-white transition capitalize"
                >
                  <option value="morning">Morning (09:00 AM - 12:00 PM)</option>
                  <option value="afternoon">Afternoon (01:00 PM - 05:00 PM)</option>
                  <option value="evening">Evening (05:00 PM - 08:00 PM)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Instructions / Gate Access
                </label>
                <input
                  type="text"
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  placeholder="e.g. Ring Apt #3B, buzzer code 1290, or leave with lobby desk"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-emerald-600 focus:bg-white transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Zero pickup fee • Certified R2 e-Stewards recycling chain</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer transform active:scale-95"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Scheduling Pickup...</span>
              </>
            ) : (
              <>
                <Truck className="w-4 h-4" />
                <span>Confirm & Generate Booking ID</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
