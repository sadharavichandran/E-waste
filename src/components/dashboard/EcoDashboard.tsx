import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Truck,
  Recycle,
  Layers,
  ArrowUpRight,
  Sparkles,
  Clock,
  ShieldCheck,
  TrendingUp,
  Building2,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ENVIRONMENTAL_IMPACT_FACTORS } from '../../data/seedData';
import { DeviceCategory, RequestStatus } from '../../types';

const CATEGORY_COLORS: Record<string, string> = {
  mobile: '#059669',
  laptop: '#10b981',
  tablet: '#34d399',
  desktop: '#047857',
  battery: '#f59e0b',
  charger_cable: '#6366f1',
  audio_wearable: '#8b5cf6',
  home_appliance: '#0ea5e9',
  other: '#64748b',
};

export const EcoDashboard: React.FC = () => {
  const {
    requests,
    approvedCentres,
    pendingCentres,
    setActiveTab,
    setTrackedRequestId,
    updateRequestStatus,
    activeRole,
    switchRole,
    setIsAuthModalOpen,
  } = useApp();

  // Metrics calculated strictly from real-time requests
  const metrics = useMemo(() => {
    let totalDevicesRegistered = 0;
    let pendingPickupRequests = 0;
    let devicesCollected = 0;
    let devicesRecycled = 0;
    let totalCo2SavedKg = 0;
    let toxicMetalsGrams = 0;
    let preciousMetalsGrams = 0;
    let rawMineralsKg = 0;

    const categoryCounts: Record<string, number> = {};

    requests.forEach((req) => {
      const qty = req.quantity || 1;
      totalDevicesRegistered += qty;

      if (req.status === 'submitted' || req.status === 'confirmed') {
        pendingPickupRequests += 1;
      }

      if (req.status === 'collected' || req.status === 'recycled') {
        devicesCollected += qty;
      }

      if (req.status === 'recycled') {
        devicesRecycled += qty;
      }

      const factor = ENVIRONMENTAL_IMPACT_FACTORS[req.category] || ENVIRONMENTAL_IMPACT_FACTORS.other;
      const multiplier = req.status === 'recycled' ? 1.0 : req.status === 'collected' ? 0.7 : 0.4;
      
      totalCo2SavedKg += factor.co2KgPerUnit * qty * multiplier;
      toxicMetalsGrams += factor.toxicMetalsPreventedGrams * qty * multiplier;
      preciousMetalsGrams += factor.preciousMetalsRecoveredGrams * qty * multiplier;
      rawMineralsKg += factor.rawMineralsPreservedKg * qty * multiplier;

      categoryCounts[req.category] = (categoryCounts[req.category] || 0) + qty;
    });

    const categoryData = Object.entries(categoryCounts).map(([cat, count]) => ({
      name: ENVIRONMENTAL_IMPACT_FACTORS[cat as DeviceCategory]?.label || cat,
      key: cat,
      value: count,
      color: CATEGORY_COLORS[cat] || '#64748b',
    }));

    return {
      totalDevicesRegistered,
      pendingPickupRequests,
      devicesCollected,
      devicesRecycled,
      totalCo2SavedKg: Math.round(totalCo2SavedKg),
      toxicMetalsGrams: Math.round(toxicMetalsGrams),
      preciousMetalsGrams: parseFloat(preciousMetalsGrams.toFixed(3)),
      rawMineralsKg: Math.round(rawMineralsKg),
      categoryData,
    };
  }, [requests]);

  const recentRequests = requests.slice(0, 5);

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'submitted':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Pending Review</span>;
      case 'confirmed':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Courier Scheduled</span>;
      case 'collected':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Collected at Doorstep</span>;
      case 'recycled':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-300">Recycled / Recovered</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-radial from-emerald-800 to-slate-950 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold uppercase tracking-wider backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Real-Time Circular Economy Platform
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Don't Dump It. <span className="text-emerald-400">Loop It.</span>
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed font-normal">
            Safeguard the environment by scheduling certified doorstep e-waste pickups and locating SuperAdmin-verified drop-off hubs. Real data only, zero simulated placeholders.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('schedule_pickup')}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs md:text-sm shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              Schedule a Pickup
            </button>
            <button
              onClick={() => setActiveTab('decision_engine')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs md:text-sm border border-white/15 backdrop-blur-xs transition flex items-center gap-2 cursor-pointer"
            >
              Smart Triage Guide
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              onClick={() => setActiveTab('collection_centres')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs md:text-sm border border-white/15 backdrop-blur-xs transition flex items-center gap-2 cursor-pointer"
            >
              Verified Drop-off Map ({approvedCentres.length})
            </button>
          </div>
        </div>
      </div>

      {/* Role Notice & Portal Switcher Strip */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <KeyRound className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-900 block">
              Active Session: <span className="text-emerald-700 capitalize">{activeRole} Portal</span>
            </span>
            <span className="text-slate-500">
              {activeRole === 'user'
                ? 'Citizens can schedule pickups, track requests, and browse verified centers.'
                : activeRole === 'admin'
                ? 'Admins can add new e-waste centers with location & dispatch pickups.'
                : 'SuperAdmins audit and approve centers to protect users from fake actors.'}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span>Switch Portal</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Devices</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{metrics.totalDevicesRegistered}</span>
            <span className="text-xs text-slate-500 font-medium">units</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Real-time citizen bookings</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Pickups</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{metrics.pendingPickupRequests}</span>
            <span className="text-xs text-amber-700 font-medium">queued</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Awaiting admin courier assignment</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Devices Collected</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{metrics.devicesCollected}</span>
            <span className="text-xs text-blue-700 font-medium">received</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Verified by collection courier</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fully Recycled</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Recycle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{metrics.devicesRecycled}</span>
            <span className="text-xs text-teal-700 font-medium">closed loop</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Processed at certified facility</p>
        </div>
      </div>

      {/* Analytics Row: Real Category Breakdown & Verification Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Equipment Composition Breakdown</h3>
              <p className="text-xs text-slate-500">Live tally of devices submitted across active orders</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
              {metrics.totalDevicesRegistered} Total Units
            </span>
          </div>

          {metrics.categoryData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {metrics.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 text-xs">
                {metrics.categoryData.map((item) => (
                  <div key={item.key} className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="font-bold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs space-y-2">
              <Layers className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No electronics submitted yet.</p>
              <button
                onClick={() => setActiveTab('schedule_pickup')}
                className="text-emerald-700 font-bold hover:underline"
              >
                Schedule your first pickup now →
              </button>
            </div>
          )}
        </div>

        {/* E-Waste Centre Verification Network Status (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Circular Hubs Network Status
            </h3>
            <p className="text-xs text-slate-500">Live regulatory safety overview</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-emerald-950 block">Verified & Approved Centres</span>
                <span className="text-[11px] text-emerald-800">Publicly active on citizen locator map</span>
              </div>
              <span className="text-xl font-black text-emerald-800">{approvedCentres.length}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-950 block">Under SuperAdmin Audit</span>
                <span className="text-[11px] text-amber-800">Pending license verification</span>
              </div>
              <span className="text-xl font-black text-amber-800">{pendingCentres.length}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setActiveTab('collection_centres')}
              className="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Explore Verified Drop-off Centres</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Environmental Impact Summary */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-emerald-50 via-teal-50 to-emerald-50/40 border border-emerald-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Real-Time Environmental Savings
            </h3>
            <p className="text-xs text-emerald-800">
              Calculated live from actual equipment entries using UNITAR / EPA lifecycle conversion equations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-white/90 border border-emerald-100 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">CO₂e Prevented</span>
            <div className="text-xl font-extrabold text-emerald-900">{metrics.totalCo2SavedKg} kg</div>
            <p className="text-[10px] text-slate-400">Avoided virgin smelting emissions</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/90 border border-emerald-100 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Toxic Leaching Halted</span>
            <div className="text-xl font-extrabold text-amber-900">{metrics.toxicMetalsGrams} g</div>
            <p className="text-[10px] text-slate-400">Lead & cadmium kept from aquifers</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/90 border border-emerald-100 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Precious Metals</span>
            <div className="text-xl font-extrabold text-teal-900">{metrics.preciousMetalsGrams} g</div>
            <p className="text-[10px] text-slate-400">Gold & silver reclaim potential</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/90 border border-emerald-100 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Raw Mineral Mining Saved</span>
            <div className="text-xl font-extrabold text-slate-900">{metrics.rawMineralsKg} kg</div>
            <p className="text-[10px] text-slate-400">Preserved cobalt and lithium ore</p>
          </div>
        </div>
      </div>

      {/* Recent Pickup Requests Queue */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Customer Pickups ({requests.length})</h3>
            <p className="text-xs text-slate-500">Live real-time pickup requests from citizen forms</p>
          </div>
          <button
            onClick={() => setActiveTab('schedule_pickup')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            + New Pickup
          </button>
        </div>

        {recentRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Device</th>
                  <th className="py-3 px-4">Pickup Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                      <button
                        onClick={() => {
                          setTrackedRequestId(req.id);
                          setActiveTab('track_request');
                        }}
                        className="hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {req.id}
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{req.userName}</div>
                      <div className="text-[10px] text-slate-400">{req.city}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 capitalize">
                        {req.deviceName || req.category} ({req.quantity} unit)
                      </div>
                      <span className="text-[10px] text-slate-400 capitalize">{req.condition}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>{req.preferredDate}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{req.preferredTimeSlot}</div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setTrackedRequestId(req.id);
                          setActiveTab('track_request');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold cursor-pointer"
                      >
                        Track Status
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
            <p>No customer pickups scheduled yet.</p>
            <button
              onClick={() => setActiveTab('schedule_pickup')}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition"
            >
              Book Doorstep Pickup Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
