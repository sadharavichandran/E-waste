import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Building2,
  Truck,
  Recycle,
  Clock,
  AlertCircle,
  ShieldCheck,
  Package,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from 'lucide-react';

const DEVICE_WEIGHTS: Record<string, number> = {
  mobile: 0.15,
  laptop: 2.2,
  tablet: 0.5,
  desktop: 8.0,
  battery: 0.25,
  charger_cable: 0.1,
  audio_wearable: 0.08,
  home_appliance: 6.0,
  other: 1.0,
};

export const SuperAdminOverview: React.FC = () => {
  const { requests, centres, approvedCentres, pendingCentres } = useApp();

  const m = useMemo(() => {
    const collected = requests.filter((r) => r.status === 'collected' || r.status === 'recycled');
    const recycled  = requests.filter((r) => r.status === 'recycled');
    const pending   = requests.filter((r) => r.status === 'submitted' || r.status === 'confirmed');
    const rejected  = centres.filter((c) => c.approvalStatus === 'rejected');

    const collectedKg = collected.reduce(
      (s, r) => s + (DEVICE_WEIGHTS[r.category] ?? 1) * (r.quantity || 1), 0
    );
    const recycledKg = recycled.reduce(
      (s, r) => s + (DEVICE_WEIGHTS[r.category] ?? 1) * (r.quantity || 1), 0
    );

    const uniqueUsers = new Set(requests.map((r) => r.userName)).size;

    return {
      totalRequests:    requests.length,
      uniqueUsers,
      totalCentres:     centres.length,
      approvedCentres:  approvedCentres.length,
      pendingCentres:   pendingCentres.length,
      rejectedCentres:  rejected.length,
      pendingPickups:   pending.length,
      collectedDevices: collected.reduce((s, r) => s + (r.quantity || 1), 0),
      recycledDevices:  recycled.reduce((s, r) => s + (r.quantity || 1), 0),
      collectedKg:      Math.round(collectedKg * 10) / 10,
      recycledKg:       Math.round(recycledKg * 10) / 10,
      unverifiedKg:     Math.round((collectedKg - recycledKg) * 10) / 10,
      unverifiedRecords: collected.length - recycled.length,
      cancelledRequests: requests.filter((r) => r.status === 'cancelled').length,
    };
  }, [requests, centres, approvedCentres, pendingCentres]);

  const statusBreakdown = [
    { label: 'Submitted',  count: requests.filter((r) => r.status === 'submitted').length,  bar: 'bg-amber-400' },
    { label: 'Confirmed',  count: requests.filter((r) => r.status === 'confirmed').length,  bar: 'bg-blue-400' },
    { label: 'Collected',  count: requests.filter((r) => r.status === 'collected').length,  bar: 'bg-emerald-400' },
    { label: 'Recycled',   count: requests.filter((r) => r.status === 'recycled').length,   bar: 'bg-teal-500' },
    { label: 'Cancelled',  count: requests.filter((r) => r.status === 'cancelled').length,  bar: 'bg-rose-400' },
  ];

  const topCards = [
    { label: 'Registered Users',     value: m.uniqueUsers,       sub: 'Unique citizen accounts',         icon: Users,       color: 'text-purple-700', bg: 'bg-purple-50',  border: 'border-purple-100' },
    { label: 'Registered Centres',   value: m.totalCentres,      sub: `${m.approvedCentres} approved, ${m.pendingCentres} pending`, icon: Building2,   color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-100' },
    { label: 'Total Requests',        value: m.totalRequests,     sub: 'All-time submissions',             icon: Package,     color: 'text-slate-700',  bg: 'bg-slate-100',  border: 'border-slate-200' },
    { label: 'Pending Pickups',       value: m.pendingPickups,    sub: 'Queued for collection',            icon: Clock,       color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-100' },
    { label: 'Devices Collected',     value: m.collectedDevices,  sub: `${m.collectedKg} kg estimated`,   icon: Truck,       color: 'text-sky-700',    bg: 'bg-sky-50',     border: 'border-sky-100' },
    { label: 'Verified Recycled',     value: m.recycledDevices,   sub: `${m.recycledKg} kg confirmed`,    icon: Recycle,     color: 'text-teal-700',   bg: 'bg-teal-50',    border: 'border-teal-100' },
    { label: 'Unverified Records',    value: m.unverifiedRecords, sub: `${m.unverifiedKg} kg gap`,        icon: AlertCircle, color: 'text-rose-700',   bg: 'bg-rose-50',    border: 'border-rose-100' },
    { label: 'Pending Verifications', value: m.pendingCentres,    sub: 'Centres awaiting review',         icon: ShieldCheck, color: 'text-violet-700', bg: 'bg-violet-50',  border: 'border-violet-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-radial from-purple-950 via-slate-950 to-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.15)_0%,_transparent_60%)]" />
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            Live Platform Metrics
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Overview Dashboard</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            All values reflect real-time database records — no hardcoded statistics. Data updates automatically when citizens submit requests or admins register centres.
          </p>
        </div>
      </div>

      {/* 8-card KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {topCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`p-5 rounded-2xl bg-white border ${card.border} shadow-xs hover:shadow-md transition-all`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
              <div className={`text-2xl font-black ${card.color}`}>{card.value}</div>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">{card.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Weight summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total E-Waste Collected</span>
          <div className="text-3xl font-black text-emerald-700">{m.collectedKg} <span className="text-base font-normal text-emerald-500">kg</span></div>
          <p className="text-[11px] text-slate-500 mt-1">Estimated weight across {m.collectedDevices} collected devices</p>
        </div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50 to-white border border-teal-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Verified Recycled Weight</span>
          <div className="text-3xl font-black text-teal-700">{m.recycledKg} <span className="text-base font-normal text-teal-500">kg</span></div>
          <p className="text-[11px] text-slate-500 mt-1">Confirmed processed at certified recycling facilities</p>
        </div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-white border border-rose-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Unverified Recycling Records</span>
          <div className="text-3xl font-black text-rose-700">{m.unverifiedKg} <span className="text-base font-normal text-rose-500">kg</span></div>
          <p className="text-[11px] text-slate-500 mt-1">{m.unverifiedRecords} records collected but recycling not yet confirmed</p>
        </div>
      </div>

      {/* Bottom 2-column row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Request Status Distribution */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Request Status Distribution
          </h3>
          {m.totalRequests === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No requests submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map((s) => (
                <div key={s.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">{s.label}</span>
                    <span className="font-bold text-slate-900">{s.count}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${s.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${(s.count / m.totalRequests) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Centre Verification Status */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Centre Verification Status
          </h3>
          {m.totalCentres === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No centres registered yet.</p>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Approved & Live', count: m.approvedCentres,  Icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-700' },
                { label: 'Pending Review',  count: m.pendingCentres,   Icon: Clock,        bg: 'bg-amber-50',   color: 'text-amber-700' },
                { label: 'Rejected',        count: m.rejectedCentres,  Icon: XCircle,      bg: 'bg-rose-50',    color: 'text-rose-700' },
              ].map(({ label, count, Icon, bg, color }) => (
                <div key={label} className={`flex items-center justify-between p-3.5 rounded-xl ${bg}`}>
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className={`text-xs font-semibold ${color}`}>{label}</span>
                  </div>
                  <span className={`text-xl font-black ${color}`}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
