import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RequestStatus, PickupRequest } from '../../types';
import {
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Recycle,
  Calendar,
  MapPin,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  FileText,
  User,
  Phone,
  AlertTriangle,
  Building2,
} from 'lucide-react';

const TIMELINE_STEPS: { status: RequestStatus; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { status: 'submitted', label: 'Submitted', description: 'Request logged into dispatch queue', icon: FileText },
  { status: 'confirmed', label: 'Confirmed', description: 'Courier & route assigned', icon: Clock },
  { status: 'collected', label: 'Collected', description: 'Handover verified at doorstep', icon: Truck },
  { status: 'recycled', label: 'Recycled', description: 'Dismantled & circular extraction', icon: Recycle },
];

export const RequestTracker: React.FC = () => {
  const {
    requests,
    trackedRequestId,
    setTrackedRequestId,
    updateRequestStatus,
    setActiveTab,
    activeRole,
  } = useApp();

  const [inputQuery, setInputQuery] = useState(trackedRequestId || '');
  const [activeRequest, setActiveRequest] = useState<PickupRequest | null>(() => {
    if (trackedRequestId) {
      return requests.find((r) => r.id.toLowerCase() === trackedRequestId.toLowerCase()) || null;
    }
    return requests[0] || null;
  });

  // Keep activeRequest in sync with requests
  useEffect(() => {
    if (trackedRequestId) {
      const found = requests.find((r) => r.id.toLowerCase() === trackedRequestId.toLowerCase());
      if (found) setActiveRequest(found);
    } else if (requests.length > 0 && !activeRequest) {
      setActiveRequest(requests[0]);
    }
  }, [requests, trackedRequestId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = inputQuery.trim().toUpperCase();
    if (!cleanId) return;

    const found = requests.find((r) => r.id.toUpperCase() === cleanId);
    setActiveRequest(found || null);
    setTrackedRequestId(cleanId);
  };

  const handleSelectRecent = (req: PickupRequest) => {
    setActiveRequest(req);
    setInputQuery(req.id);
    setTrackedRequestId(req.id);
  };

  const getStepIndex = (status: RequestStatus) => {
    switch (status) {
      case 'submitted':
        return 0;
      case 'confirmed':
        return 1;
      case 'collected':
        return 2;
      case 'recycled':
        return 3;
      case 'cancelled':
        return -1;
    }
  };

  const currentStepIdx = activeRequest ? getStepIndex(activeRequest.status) : -1;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
          <Search className="w-4 h-4" />
          Real-Time Tracking & Verification
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Track Your E-Waste Request
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Enter your unique Request ID to inspect verified collection status, dispatch route, and material recycling audit logs.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Enter Request ID (e.g. ECL-2026-8941)..."
              className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono uppercase placeholder:font-sans placeholder:normal-case placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 outline-hidden transition"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            Track Status
          </button>
        </form>

        {/* Quick Recent Chips */}
        {requests.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-400">Your Recent Bookings:</span>
            {requests.slice(0, 4).map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelectRecent(r)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition cursor-pointer ${
                  activeRequest?.id === r.id
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                {r.id} ({r.category})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Result Display */}
      {activeRequest ? (
        <div className="space-y-6 animate-in fade-in">
          {/* Main Status & Interactive Simulation Header Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Reference ID
                </span>
                <h3 className="text-xl font-mono font-black text-slate-900 flex items-center gap-2">
                  {activeRequest.id}
                </h3>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Current Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  activeRequest.status === 'submitted'
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : activeRequest.status === 'confirmed'
                    ? 'bg-blue-100 text-blue-900 border border-blue-200'
                    : activeRequest.status === 'collected'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    : activeRequest.status === 'recycled'
                    ? 'bg-teal-100 text-teal-900 border border-teal-200'
                    : 'bg-rose-100 text-rose-900 border border-rose-200'
                }`}>
                  {activeRequest.status}
                </span>
              </div>
            </div>

            {/* Visual 4-Step Timeline */}
            <div className="py-2">
              <div className="relative">
                <div className="hidden sm:block absolute top-6 left-12 right-12 h-1 bg-slate-200 -z-0">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-500"
                    style={{
                      width: `${Math.max(0, Math.min(100, (currentStepIdx / (TIMELINE_STEPS.length - 1)) * 100))}%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative z-10">
                  {TIMELINE_STEPS.map((step, idx) => {
                    const isCompleted = currentStepIdx >= idx;
                    const isCurrent = currentStepIdx === idx;
                    const Icon = step.icon;

                    return (
                      <div
                        key={step.status}
                        className={`p-3.5 sm:p-2 rounded-2xl sm:rounded-none flex sm:flex-col items-center sm:text-center gap-3 transition ${
                          isCurrent
                            ? 'bg-emerald-50/70 sm:bg-transparent border border-emerald-200 sm:border-0'
                            : ''
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all shadow-2xs ${
                            isCompleted
                              ? 'bg-emerald-600 text-white shadow-emerald-700/20'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                        </div>
                        <div className="sm:mt-2">
                          <div className={`text-xs font-bold ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                            {idx + 1}. {step.label}
                          </div>
                          <div className="text-[11px] text-slate-500 hidden sm:block mt-0.5">
                            {step.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Status Advancer / Operator Controls */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Dispatch Lifecycle Simulator & Operator Action
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Advancing to <strong>Collected</strong> or <strong>Recycled</strong> triggers real-time EcoPoint rewards!
                  </p>
                </div>
                {activeRequest.pointsAwarded && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full self-start sm:self-auto">
                    ✓ Points Credited: +{activeRequest.pointsEarned} pts
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {activeRequest.status === 'submitted' && (
                  <button
                    onClick={() => updateRequestStatus(activeRequest.id, 'confirmed', 'Courier team assigned')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Advance to Confirmed</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {activeRequest.status === 'confirmed' && (
                  <button
                    onClick={() => updateRequestStatus(activeRequest.id, 'collected', 'Picked up by verified courier at doorstep')}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Advance to Collected (+Points)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {activeRequest.status === 'collected' && (
                  <button
                    onClick={() => updateRequestStatus(activeRequest.id, 'recycled', 'Dismantled at certified R2 smelter')}
                    className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Advance to Recycled (Final Loop)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {activeRequest.status === 'recycled' && (
                  <div className="text-xs text-teal-800 font-semibold flex items-center gap-2 bg-teal-50 px-3 py-2 rounded-xl border border-teal-200">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Complete circular lifecycle achieved! Materials safely recovered.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details & Status Audit History Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                Equipment & Pickup Location
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Contact Person</span>
                  <span className="font-semibold text-slate-900">{activeRequest.userName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Contact Number</span>
                  <span className="font-mono text-slate-800">{activeRequest.contactNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Category & Model</span>
                  <span className="font-semibold text-slate-900 capitalize">
                    {activeRequest.deviceName || activeRequest.category.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Quantity</span>
                  <span className="font-semibold text-slate-900">{activeRequest.quantity} unit(s)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Reported Condition</span>
                  <span className="font-medium text-slate-800 capitalize">
                    {activeRequest.condition.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Pickup Address</span>
                  <span className="font-medium text-slate-800 text-right max-w-xs">
                    {activeRequest.address}, {activeRequest.city} ({activeRequest.pincode})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Pickup Appointment</span>
                  <span className="font-medium text-slate-800">
                    {activeRequest.preferredDate} ({activeRequest.preferredTimeSlot})
                  </span>
                </div>
                {activeRequest.hasBatteryHazard && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="text-[11px] font-semibold">Hazardous swollen battery protocol active</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                Status Audit Trail & Logs
              </h4>

              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
                {activeRequest.statusHistory.map((item, idx) => (
                  <div key={idx} className="relative flex items-start gap-3 pl-1 text-xs">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 z-10 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                          {item.status}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{item.note}</p>
                      {item.updatedBy && (
                        <span className="text-[9px] text-slate-400 block font-mono">
                          Operator: {item.updatedBy}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 rounded-3xl bg-white border border-slate-200/90 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
            <Truck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Pickup Requests in Queue</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Real-time platform active. Once you submit a pickup booking, you will receive a unique Request ID to track here in real time.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('schedule_pickup')}
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            Schedule a Pickup Now
          </button>
        </div>
      )}
    </div>
  );
};
