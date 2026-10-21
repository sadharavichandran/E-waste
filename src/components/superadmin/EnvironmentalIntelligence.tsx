import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart2,
  MapPin,
  Recycle,
  AlertTriangle,
  TrendingUp,
  Leaf,
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
import { DeviceCategory } from '../../types';

const CATEGORY_COLORS: Record<string, string> = {
  mobile:          '#059669',
  laptop:          '#10b981',
  tablet:          '#34d399',
  desktop:         '#047857',
  battery:         '#f59e0b',
  charger_cable:   '#6366f1',
  audio_wearable:  '#8b5cf6',
  home_appliance:  '#0ea5e9',
  other:           '#64748b',
};

const CATEGORY_LABELS: Record<string, string> = {
  mobile: 'Mobile', laptop: 'Laptop', tablet: 'Tablet', desktop: 'Desktop',
  battery: 'Battery', charger_cable: 'Charger/Cable', audio_wearable: 'Audio/Wearable',
  home_appliance: 'Home Appliance', other: 'Other',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const EnvironmentalIntelligence: React.FC = () => {
  const { requests } = useApp();

  /* ── Category Breakdown ── */
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + (r.quantity || 1);
    });
    return Object.entries(counts)
      .map(([cat, value]) => ({
        name:  CATEGORY_LABELS[cat] ?? cat,
        key:   cat,
        value,
        color: CATEGORY_COLORS[cat] ?? '#64748b',
      }))
      .sort((a, b) => b.value - a.value);
  }, [requests]);

  /* ── City / District Breakdown (top 8) ── */
  const cityData = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach((r) => {
      if (r.city) counts[r.city] = (counts[r.city] || 0) + (r.quantity || 1);
    });
    return Object.entries(counts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [requests]);

  /* ── Monthly Collection Trend (last 6 months) ── */
  const monthlyData = useMemo(() => {
    const months: Record<string, { collected: number; recycled: number }> = {};
    requests.forEach((r) => {
      if (!r.submittedAt) return;
      const ym = r.submittedAt.substring(0, 7); // YYYY-MM
      if (!months[ym]) months[ym] = { collected: 0, recycled: 0 };
      months[ym].collected += r.quantity || 1;
      if (r.status === 'recycled') months[ym].recycled += r.quantity || 1;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([ym, data]) => {
        const [, mm] = ym.split('-');
        return { month: MONTH_NAMES[parseInt(mm, 10) - 1], ...data };
      });
  }, [requests]);

  /* ── Reuse vs Recycling ── */
  const reuseVsRecycle = useMemo(() => {
    const recycled = requests.filter((r) => r.status === 'recycled').reduce((s, r) => s + (r.quantity || 1), 0);
    const potential = requests.filter((r) => r.status === 'collected').reduce((s, r) => s + (r.quantity || 1), 0);
    return [
      { name: 'Verified Recycled', value: recycled,  color: '#059669' },
      { name: 'Potential Reuse',   value: potential, color: '#6366f1' },
    ];
  }, [requests]);

  /* ── Low Coverage Areas ── */
  const lowCoverage = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach((r) => { if (r.city) counts[r.city] = (counts[r.city] || 0) + 1; });
    return Object.entries(counts)
      .filter(([, n]) => n <= 2)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => a.count - b.count);
  }, [requests]);

  const isEmpty = requests.length === 0;
  const reuseTotal = reuseVsRecycle.reduce((s, d) => s + d.value, 0);

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: '#0f172a', borderRadius: '8px',
      color: '#f8fafc', fontSize: '11px', border: 'none',
    },
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-radial from-purple-950 via-slate-950 to-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.15)_0%,_transparent_60%)]" />
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold uppercase tracking-wider">
            <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
            Data Intelligence
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Environmental Intelligence Center</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Collection patterns, device categories, geographic coverage, and monthly trends — all derived from live records. Historical data can later be used to predict future collection demand.
          </p>
        </div>
      </div>

      {isEmpty ? (
        <div className="p-14 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-3">
          <BarChart2 className="w-12 h-12 text-slate-200 mx-auto" />
          <p className="font-semibold text-slate-600 text-sm">No data available yet</p>
          <p className="text-xs max-w-xs mx-auto">
            Intelligence charts will populate automatically as citizens submit pickup requests and admins register collection centres.
          </p>
        </div>
      ) : (
        <>
          {/* Row 1: Category Pie + Monthly Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Most Commonly Discarded Categories */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Most Commonly Discarded Categories</h3>
                <p className="text-xs text-slate-500 mt-0.5">Device type distribution across all registered requests</p>
              </div>
              {categoryData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%" cy="50%"
                          innerRadius={44} outerRadius={74}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip {...tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {categoryData.map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-600 truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="truncate">{item.name}</span>
                        </span>
                        <span className="font-bold text-slate-900 ml-2">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No category data yet.</p>
              )}
            </div>

            {/* Monthly Collection Trends */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  Monthly Collection Trends
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Devices submitted vs. verified recycled per month (last 6 months)</p>
              </div>
              {monthlyData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip {...tooltipStyle} />
                      <Area type="monotone" dataKey="collected" stroke="#059669" fill="#d1fae5" name="Collected"  strokeWidth={2} />
                      <Area type="monotone" dataKey="recycled"  stroke="#0d9488" fill="#ccfbf1" name="Recycled"   strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Insufficient data for trend analysis.</p>
              )}
            </div>
          </div>

          {/* Row 2: City Breakdown + Reuse vs Recycling + Low Coverage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* E-Waste Collection by District / Area */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  E-Waste Collection by District / Area
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Top 8 cities by total device units submitted</p>
              </div>
              {cityData.length > 0 ? (
                <div className="space-y-2.5">
                  {cityData.map((item) => {
                    const pct = Math.round((item.count / cityData[0].count) * 100);
                    return (
                      <div key={item.city} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-600 truncate">{item.city}</span>
                          <span className="font-bold text-slate-900 ml-2">{item.count} units</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No city data available.</p>
              )}
            </div>

            {/* Right column: Reuse vs Recycling + Low Coverage */}
            <div className="space-y-4">
              {/* Reuse vs Recycling */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Recycle className="w-4 h-4 text-emerald-600" />
                    Reuse vs. Recycling Comparison
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Collected-not-recycled units indicate potential reuse or repair pathways
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  {reuseVsRecycle.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-600">{d.name}:</span>
                      <span className="font-bold text-slate-900">{d.value}</span>
                    </div>
                  ))}
                </div>
                {reuseTotal > 0 && (
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    {reuseVsRecycle.map((d) => (
                      <div
                        key={d.name}
                        className="h-full transition-all"
                        style={{
                          width: `${(d.value / reuseTotal) * 100}%`,
                          backgroundColor: d.color,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Areas with Low Collection Coverage */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Areas with Low Collection Coverage
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cities with ≤2 pickup requests — potential zones for expansion or awareness campaigns
                  </p>
                </div>
                {lowCoverage.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {lowCoverage.map((a) => (
                      <span
                        key={a.city}
                        className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                      >
                        {a.city} ({a.count})
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-emerald-700">
                    <Leaf className="w-4 h-4 text-emerald-500" />
                    All active areas have sufficient collection activity.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
