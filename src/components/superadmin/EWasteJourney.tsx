import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Truck,
  Package,
  Recycle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Scale,
  Flag,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { RequestStatus } from '../../types';

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

const DEVICE_LABELS: Record<string, string> = {
  mobile: 'Mobile Phone', laptop: 'Laptop', tablet: 'Tablet',
  desktop: 'Desktop', battery: 'Battery', charger_cable: 'Charger / Cable',
  audio_wearable: 'Audio / Wearable', home_appliance: 'Home Appliance', other: 'Other',
};

const STATUS_STYLES: Record<RequestStatus, string> = {
  submitted: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed:  'bg-blue-50 text-blue-700 border-blue-200',
  collected:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  recycled:   'bg-teal-50 text-teal-800 border-teal-200',
  cancelled:  'bg-rose-50 text-rose-700 border-rose-200',
};

const PIPELINE = [
  { key: 'submitted', label: 'Submitted',  icon: Package,      color: 'text-amber-600',   bg: 'bg-amber-50' },
  { key: 'confirmed', label: 'Confirmed',  icon: CheckCircle2, color: 'text-blue-600',    bg: 'bg-blue-50' },
  { key: 'collected', label: 'Collected',  icon: Truck,        color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'recycled',  label: 'Recycled',   icon: Recycle,      color: 'text-teal-600',    bg: 'bg-teal-50' },
];

export const EWasteJourney: React.FC = () => {
  const { requests } = useApp();
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
  const [search, setSearch]             = useState('');

  const pipelineCounts = useMemo(() => ({
    submitted: requests.filter((r) => r.status === 'submitted').length,
    confirmed:  requests.filter((r) => r.status === 'confirmed').length,
    collected:  requests.filter((r) => r.status === 'collected').length,
    recycled:   requests.filter((r) => r.status === 'recycled').length,
  }), [requests]);

  // Weight discrepancy analysis per device category
  const discrepancy = useMemo(() => {
    const map: Record<string, { collectedKg: number; recycledKg: number }> = {};
    requests.forEach((r) => {
      if (r.status !== 'collected' && r.status !== 'recycled') return;
      if (!map[r.category]) map[r.category] = { collectedKg: 0, recycledKg: 0 };
      const w = (DEVICE_WEIGHTS[r.category] ?? 1) * (r.quantity || 1);
      map[r.category].collectedKg += w;
      if (r.status === 'recycled') map[r.category].recycledKg += w;
    });

    return Object.entries(map)
      .map(([cat, { collectedKg, recycledKg }]) => {
        const gap    = Math.round((collectedKg - recycledKg) * 10) / 10;
        const gapPct = collectedKg > 0 ? Math.round((gap / collectedKg) * 100) : 0;
        return {
          cat,
          collectedKg: Math.round(collectedKg * 10) / 10,
          recycledKg:  Math.round(recycledKg  * 10) / 10,
          gap,
          gapPct,
          flagged: gapPct > 20 && gap > 0,
        };
      })
      .sort((a, b) => b.gap - a.gap);
  }, [requests]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter((r) => {
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchSearch =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.userName.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        (r.deviceName ?? '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [requests, statusFilter, search]);

  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-radial from-purple-950 via-slate-950 to-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.15)_0%,_transparent_60%)]" />
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold uppercase tracking-wider">
            <Truck className="w-3.5 h-3.5 text-purple-400" />
            Journey Tracking
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">E-Waste Journey Control</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Monitor every pickup from submission to verified recycling. Identify weight discrepancies and delayed statuses for investigation — no automatic fraud assumption.
          </p>
        </div>
      </div>

      {/* Pipeline stages */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PIPELINE.map(({ key, label, icon: Icon, color, bg }, i) => (
          <div key={key} className="relative">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-center">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className={`text-2xl font-black ${color}`}>
                {pipelineCounts[key as keyof typeof pipelineCounts]}
              </div>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{label}</p>
            </div>
            {i < PIPELINE.length - 1 && (
              <div className="hidden sm:flex absolute -right-1.5 top-1/2 -translate-y-1/2 z-10">
                <ArrowRight className="w-3 h-3 text-slate-300" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Weight Discrepancy Analysis */}
      {discrepancy.length > 0 && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-600" />
              Weight Discrepancy Analysis
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Collected weight vs. verified recycled weight by device category. Items are flagged when &gt;20% of collected weight is unverified — pending investigation, not assumed fraud.
            </p>
          </div>

          <div className="space-y-3">
            {discrepancy.map((item) => (
              <div
                key={item.cat}
                className={`p-4 rounded-2xl border transition ${
                  item.flagged ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100 bg-slate-50/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {item.flagged && <Flag className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                    <span className="text-xs font-bold text-slate-900">
                      {DEVICE_LABELS[item.cat] ?? item.cat}
                    </span>
                    {item.flagged && (
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                        Flagged — Pending Review
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-center">
                      <div className="font-bold text-emerald-700">{item.collectedKg} kg</div>
                      <div className="text-[10px] text-slate-400">Collected</div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-300" />
                    <div className="text-center">
                      <div className="font-bold text-teal-700">{item.recycledKg} kg</div>
                      <div className="text-[10px] text-slate-400">Recycled</div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-300" />
                    <div className="text-center">
                      <div className={`font-bold ${item.flagged ? 'text-rose-600' : 'text-slate-600'}`}>
                        {item.gap} kg ({item.gapPct}%)
                      </div>
                      <div className="text-[10px] text-slate-400">Unverified</div>
                    </div>
                  </div>
                </div>
                <div className="mt-2.5 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-500"
                    style={{ width: item.collectedKg > 0 ? `${(item.recycledKg / item.collectedKg) * 100}%` : '0%' }}
                  />
                </div>
                {item.flagged && (
                  <p className="text-[10px] text-rose-600 mt-1.5 leading-relaxed">
                    ⚠ {item.collectedKg} kg collected, only {item.recycledKg} kg processing verified — {item.gap} kg ({item.gapPct}%) remains unaccounted. Flagged for discrepancy investigation.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-purple-600" />
              All Pickup Requests ({filtered.length})
            </h3>
            <p className="text-xs text-slate-500">Assigned collectors, schedules, and statuses</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="ID, user, city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-purple-400 w-40"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RequestStatus | 'all')}
              className="text-xs border border-slate-200 rounded-xl bg-slate-50 px-2.5 py-1.5 focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="confirmed">Confirmed</option>
              <option value="collected">Collected</option>
              <option value="recycled">Recycled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3">Request ID</th>
                  <th className="py-3 px-3">Citizen</th>
                  <th className="py-3 px-3">Device / Category</th>
                  <th className="py-3 px-3">Est. Weight</th>
                  <th className="py-3 px-3">Pickup Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((req) => {
                  const estKg  = Math.round((DEVICE_WEIGHTS[req.category] ?? 1) * (req.quantity || 1) * 100) / 100;
                  const stalled = req.status === 'submitted' &&
                    Date.now() - new Date(req.submittedAt).getTime() > THREE_DAYS_MS;
                  return (
                    <tr
                      key={req.id}
                      className={`hover:bg-slate-50/70 transition ${stalled ? 'bg-amber-50/40' : ''}`}
                    >
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-purple-800 text-[11px]">{req.id}</span>
                        {stalled && (
                          <AlertTriangle className="inline w-3 h-3 text-amber-500 ml-1" title="No update for 3+ days" />
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{req.userName}</div>
                        <div className="text-[10px] text-slate-400">{req.city}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{req.deviceName || DEVICE_LABELS[req.category]}</div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {DEVICE_LABELS[req.category]} × {req.quantity}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{estKg} kg</td>
                      <td className="py-2.5 px-3 text-slate-600">{req.preferredDate}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${STATUS_STYLES[req.status]}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{req.submittedAt.split('T')[0]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-slate-400 text-xs space-y-2">
            <Truck className="w-8 h-8 text-slate-300 mx-auto" />
            <p>{requests.length === 0 ? 'No pickup requests yet.' : 'No requests match the current filter.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
