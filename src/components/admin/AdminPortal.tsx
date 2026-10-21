import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CollectionCentre, DeviceCategory } from '../../types';
import {
  Building2,
  PlusCircle,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  FileCheck,
  Truck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Flame,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

const CATEGORY_CHOICES: { id: DeviceCategory; label: string }[] = [
  { id: 'mobile', label: 'Mobile / Smartphones' },
  { id: 'laptop', label: 'Laptops / Notebooks' },
  { id: 'tablet', label: 'Tablets / iPads' },
  { id: 'desktop', label: 'Desktop Computers' },
  { id: 'battery', label: 'Batteries / Power Packs' },
  { id: 'charger_cable', label: 'Cables & Adapters' },
  { id: 'home_appliance', label: 'Small Appliances' },
  { id: 'audio_wearable', label: 'Audio & Wearables' },
];

export const AdminPortal: React.FC = () => {
  const {
    currentUser,
    centres,
    registerCentre,
    requests,
    updateRequestStatus,
    setActiveTab,
    setTrackedRequestId,
    showToast,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'register' | 'my_centres' | 'pickups'>('register');

  // Form State for registering E-Waste Centre
  const [centreName, setCentreName] = useState('');
  const [organization, setOrganization] = useState(currentUser?.organization || 'CleanEarth Circular Logistics');
  const [centreType, setCentreType] = useState<CollectionCentre['centreType']>('Certified Recycler');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('San Francisco');
  const [pincode, setPincode] = useState('');
  const [lat, setLat] = useState<string>('37.7749');
  const [lng, setLng] = useState<string>('-122.4194');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [operatingHours, setOperatingHours] = useState('Mon-Sat: 09:00 AM - 06:00 PM');
  const [selectedCategories, setSelectedCategories] = useState<DeviceCategory[]>([
    'mobile',
    'laptop',
    'desktop',
    'battery',
    'charger_cable',
  ]);
  const [isCertifiedR2, setIsCertifiedR2] = useState(true);
  const [isHazardousBatteryCertified, setIsHazardousBatteryCertified] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter centres submitted by admins
  const myCentres = centres;

  const toggleCategory = (cat: DeviceCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'warning');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLng(pos.coords.longitude.toFixed(4));
        showToast('Updated coordinates with device GPS position', 'info');
      },
      () => {
        showToast('Location permission not granted. Keeping default coordinates.', 'warning');
      }
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!centreName.trim()) errs.centreName = 'Centre name is required';
    if (!licenseNumber.trim()) errs.licenseNumber = 'Official EPA/Environmental License is required';
    if (!address.trim()) errs.address = 'Street address is required';
    if (!city.trim()) errs.city = 'City is required';
    if (!pincode.trim()) errs.pincode = 'Pincode is required';
    if (!phone.trim()) errs.phone = 'Contact phone is required';
    if (!email.trim() || !email.includes('@')) errs.email = 'Valid email is required';
    if (selectedCategories.length === 0) errs.categories = 'Select at least one accepted category';

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitCentre = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      registerCentre({
        name: centreName.trim(),
        organization: organization.trim(),
        centreType,
        licenseNumber: licenseNumber.trim(),
        address: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        lat: parseFloat(lat) || 37.7749,
        lng: parseFloat(lng) || -122.4194,
        phone: phone.trim(),
        email: email.trim(),
        operatingHours: operatingHours.trim(),
        acceptedCategories: selectedCategories,
        isCertifiedR2,
        isHazardousBatteryCertified,
      });

      setIsSubmitting(false);
      // Reset form
      setCentreName('');
      setLicenseNumber('');
      setAddress('');
      setPincode('');
      setPhone('');
      setEmail('');
      setActiveSubTab('my_centres');
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Portal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sky-950 text-white p-6 sm:p-7 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-800/80 text-sky-200 border border-sky-600/40 text-xs font-semibold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5 text-sky-300" />
            Facility Operations Desk
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Admin Management Portal
          </h2>
          <p className="text-xs sm:text-sm text-sky-200/80">
            Welcome, <strong>{currentUser?.name || 'Facility Administrator'}</strong> ({currentUser?.organization || 'Authorized Hub'}). Register compliant e-waste collection hubs and manage real customer pickups.
          </p>
        </div>

        {/* Quick Nav Switches */}
        <div className="relative z-10 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubTab('register')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'register'
                ? 'bg-sky-400 text-sky-950 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add E-Waste Centre
          </button>
          <button
            onClick={() => setActiveSubTab('my_centres')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'my_centres'
                ? 'bg-sky-400 text-sky-950 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Registered Centres ({myCentres.length})
          </button>
          <button
            onClick={() => setActiveSubTab('pickups')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'pickups'
                ? 'bg-sky-400 text-sky-950 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Customer Pickups ({requests.length})
          </button>
        </div>
      </div>

      {/* Subtab 1: Add E-Waste Centre Form */}
      {activeSubTab === 'register' && (
        <form onSubmit={handleSubmitCentre} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-sky-600" />
                Register New E-Waste Collection Centre
              </h3>
              <p className="text-xs text-slate-500">
                All submitted facilities require compliance verification by SuperAdmin before publishing on the public map.
              </p>
            </div>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Goes to SuperAdmin Review
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-Waste Centre Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={centreName}
                onChange={(e) => setCentreName(e.target.value)}
                placeholder="e.g. EcoSafe Bay Electronic Reclamation Facility"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs outline-hidden transition ${
                  formErrors.centreName ? 'border-rose-400 bg-rose-50' : 'border-slate-200 focus:border-sky-600 focus:bg-white'
                }`}
              />
              {formErrors.centreName && <p className="text-[10px] text-rose-500 mt-1">{formErrors.centreName}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Operating Organization
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. CleanEarth Environmental LLC"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-sky-600 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Facility Category
              </label>
              <select
                value={centreType}
                onChange={(e) => setCentreType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-sky-600 focus:bg-white transition"
              >
                <option value="Certified Recycler">Certified Recycler</option>
                <option value="Drop-off Kiosk">Drop-off Kiosk</option>
                <option value="Brand Take-Back">Brand Take-Back Center</option>
                <option value="Municipal Hub">Municipal Environmental Hub</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official EPA / Environmental Agency License No. <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="e.g. EPA-RCRA-CA-94182 / DEQ-EW-2026-09"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs outline-hidden font-mono uppercase transition ${
                  formErrors.licenseNumber ? 'border-rose-400 bg-rose-50' : 'border-slate-200 focus:border-sky-600 focus:bg-white'
                }`}
              />
              <p className="text-[10px] text-slate-400 mt-1">
                SuperAdmin verifies this number with environmental ministries to prevent fake recycling scams.
              </p>
            </div>
          </div>

          {/* Location Details */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              Physical Address & Geographic Coordinates
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Street Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street number, building, industrial park"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-sky-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-sky-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pincode / ZIP <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 94103"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-sky-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Latitude / Longitude */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Latitude (e.g. 37.7749)
                </label>
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="37.7749"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-hidden focus:border-sky-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Longitude (e.g. -122.4194)
                </label>
                <input
                  type="text"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="-122.4194"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-hidden focus:border-sky-600 focus:bg-white transition"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleUseLocation}
                  className="w-full px-3 py-2 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs transition cursor-pointer"
                >
                  Auto-Detect My GPS
                </button>
              </div>
            </div>
          </div>

          {/* Operating hours & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (415) 555-0199"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-sky-600 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Public Inquiries Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hub@cleancircular.org"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-sky-600 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Operating Hours
              </label>
              <input
                type="text"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                placeholder="e.g. Mon-Sat: 09:00 AM - 06:00 PM"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-sky-600 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Accepted Categories */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700">
              Accepted Equipment Categories <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORY_CHOICES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-2 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50 text-sky-950'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '} {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Certifications Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <label className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isCertifiedR2}
                onChange={(e) => setIsCertifiedR2(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-sky-600 rounded cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">R2v3 / e-Stewards Certified Facility</span>
                <span className="text-slate-500 text-[11px]">Adheres to strict non-export and toxic landfill bans.</span>
              </div>
            </label>

            <label className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isHazardousBatteryCertified}
                onChange={(e) => setIsHazardousBatteryCertified(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-rose-600 rounded cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Hazardous Battery Certified</span>
                <span className="text-slate-500 text-[11px]">Equipped with Class D fire suppression and sand pits.</span>
              </div>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              By submitting, you certify under penalty of revocation that the license is valid.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? 'Registering Centre...' : 'Submit Centre for SuperAdmin Approval'}
            </button>
          </div>
        </form>
      )}

      {/* Subtab 2: Registered E-Waste Centres List & Approval Status */}
      {activeSubTab === 'my_centres' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-600" />
                Submitted E-Waste Collection Facilities ({myCentres.length})
              </h3>
              <p className="text-xs text-slate-500">
                Track SuperAdmin acceptance decisions in real time.
              </p>
            </div>
            <button
              onClick={() => setActiveSubTab('register')}
              className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              + Add Another Centre
            </button>
          </div>

          {myCentres.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myCentres.map((centre) => (
                <div
                  key={centre.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    centre.approvalStatus === 'approved'
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : centre.approvalStatus === 'rejected'
                      ? 'border-rose-200 bg-rose-50/20'
                      : 'border-amber-200 bg-amber-50/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{centre.name}</h4>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        License: {centre.licenseNumber} • {centre.centreType}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        centre.approvalStatus === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : centre.approvalStatus === 'rejected'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                      }`}
                    >
                      {centre.approvalStatus === 'approved'
                        ? '✓ Approved & Live'
                        : centre.approvalStatus === 'rejected'
                        ? '✗ Rejected by SuperAdmin'
                        : '⏳ Pending Review'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{centre.address}, {centre.city} ({centre.pincode})</span>
                  </p>

                  <div className="text-[11px] text-slate-500 mt-2 space-y-1">
                    <div>Hours: {centre.operatingHours}</div>
                    <div>Phone: {centre.phone} • Email: {centre.email}</div>
                  </div>

                  {/* SuperAdmin Feedback Note */}
                  {centre.verificationNotes && (
                    <div className="mt-3 p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                      <span className="font-bold text-slate-700 block text-[10px] uppercase">
                        SuperAdmin Verification Note:
                      </span>
                      <p className="text-slate-600 mt-0.5">{centre.verificationNotes}</p>
                    </div>
                  )}

                  {centre.approvalStatus === 'approved' && (
                    <div className="mt-3 text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Visible to citizens in public collection map</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs space-y-2">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No collection centres added yet. Use the "Add E-Waste Centre" form above to create one in real time.</p>
            </div>
          )}
        </div>
      )}

      {/* Subtab 3: Customer Pickups Dispatch Desk */}
      {activeSubTab === 'pickups' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-600" />
                Live Customer Pickup Dispatch Queue ({requests.length})
              </h3>
              <p className="text-xs text-slate-500">
                Update status as vehicles collect devices. Advancing to "Collected" or "Recycled" automatically awards real EcoPoints to the customer!
              </p>
            </div>
          </div>

          {requests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Request ID</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Device & Qty</th>
                    <th className="py-3 px-3">Address & Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Admin Dispatch Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 font-mono font-bold text-sky-800">
                        {req.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{req.userName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{req.contactNumber}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 capitalize">
                          {req.deviceName || req.category} ({req.quantity} unit)
                        </div>
                        <span className="text-[10px] text-slate-400 capitalize">{req.condition}</span>
                        {req.hasBatteryHazard && (
                          <span className="block text-rose-600 font-bold text-[9px] uppercase">Hazardous Swollen Cell</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-800">{req.address}, {req.city}</div>
                        <div className="text-[10px] text-slate-400">{req.preferredDate} ({req.preferredTimeSlot})</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
                          {req.status}
                        </span>
                        {req.pointsAwarded && (
                          <span className="block text-[9px] text-emerald-600 font-semibold mt-0.5">
                            ✓ {req.pointsEarned} pts awarded
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                        {req.status === 'submitted' && (
                          <button
                            onClick={() => updateRequestStatus(req.id, 'confirmed', 'Courier team scheduled for dispatch')}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shadow-2xs transition cursor-pointer"
                          >
                            Confirm Dispatch
                          </button>
                        )}
                        {req.status === 'confirmed' && (
                          <button
                            onClick={() => updateRequestStatus(req.id, 'collected', 'Picked up by verified courier at doorstep')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-2xs transition cursor-pointer"
                          >
                            Mark Collected (+Points)
                          </button>
                        )}
                        {req.status === 'collected' && (
                          <button
                            onClick={() => updateRequestStatus(req.id, 'recycled', 'Components smelted & metals extracted')}
                            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] shadow-2xs transition cursor-pointer"
                          >
                            Mark Recycled
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setTrackedRequestId(req.id);
                            setActiveTab('track_request');
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium transition cursor-pointer"
                        >
                          View Log
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs space-y-2">
              <Truck className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No customer pickups scheduled yet. Once citizens book a pickup, requests will populate here in real time.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
