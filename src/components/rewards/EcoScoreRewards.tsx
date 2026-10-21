import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Award,
  CheckCircle2,
  Clock,
  Layers,
  Recycle,
  Truck,
} from 'lucide-react';




export const EcoScoreRewards: React.FC = () => {
  const { currentUser, activityHistory, requests, userEcoPoints } = useApp();

  // Calculate live counts from real-time customer requests
  const totalSubmitted = requests.reduce((sum, r) => sum + (r.quantity || 1), 0);
  const totalCollected = requests.reduce(
    (sum, r) => (r.status === 'collected' || r.status === 'recycled' ? sum + (r.quantity || 1) : sum),
    0
  );
  const totalRecycled = requests.reduce(
    (sum, r) => (r.status === 'recycled' ? sum + (r.quantity || 1) : sum),
    0
  );

  // Dynamic Tier
  const tiers = [
    { name: 'Eco Novice', min: 0, max: 150 },
    { name: 'Green Guardian', min: 150, max: 400 },
    { name: 'Circular Champion', min: 400, max: 800 },
    { name: 'Emerald Ambassador', min: 800, max: 2000 },
  ];

  const currentTierObj =
    tiers.find((t) => userEcoPoints >= t.min && userEcoPoints < t.max) || tiers[tiers.length - 1];
  const nextTierObj = tiers[tiers.indexOf(currentTierObj) + 1] || null;

  const pointsIntoTier = userEcoPoints - currentTierObj.min;
  const tierRange = nextTierObj ? nextTierObj.min - currentTierObj.min : 500;
  const tierProgressPercent = nextTierObj
    ? Math.min(100, Math.round((pointsIntoTier / tierRange) * 100))
    : 100;



  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
          <Award className="w-4 h-4" />
          Real-Time Citizen Sustainability Recognition
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          My EcoScore & Circular Rewards
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Points are exclusively awarded in real time when an Admin courier physically collects or recycles your registered electronic devices.
        </p>
      </div>

      {/* Profile Overview & Tier Progress Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-radial from-slate-900 via-slate-950 to-slate-950 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 flex items-center gap-4">
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser?.name || 'User Profile'}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md shrink-0"
            />
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                {currentTierObj.name}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white">{currentUser?.name || 'Citizen Recycler'}</h3>
              <p className="text-xs text-slate-400 capitalize">
                {currentUser?.role || 'Citizen'} Account • {currentUser?.organization || 'EcoLoop Member'}
              </p>
            </div>
          </div>

          <div className="lg:col-span-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-center sm:text-left">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Earned EcoPoints
            </span>
            <div className="flex items-baseline justify-center sm:justify-start gap-2 mt-1">
              <span className="text-3xl font-black text-emerald-400">{userEcoPoints}</span>
              <span className="text-xs text-slate-300">points</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Awarded on verified collection</p>
          </div>

          <div className="lg:col-span-4 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Tier Milestone</span>
              <span className="text-emerald-400 font-bold">{tierProgressPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${tierProgressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>{currentTierObj.name}</span>
              <span>{nextTierObj ? `Next: ${nextTierObj.name} (${nextTierObj.min} pts)` : 'Top Tier'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lifetime Real-Time Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Devices Registered</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalSubmitted}</div>
          <span className="text-[11px] text-slate-400">Your total active requests</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Verified Collected</span>
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{totalCollected}</div>
          <span className="text-[11px] text-slate-400">Handed over at doorstep</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Fully Recycled</span>
            <Recycle className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-700 mt-2">{totalRecycled}</div>
          <span className="text-[11px] text-slate-400">Smelted & materials recovered</span>
        </div>
      </div>



      {/* Activity History Log */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
          <Clock className="w-4 h-4 text-emerald-600" />
          Verified Activity History
        </h3>

        {activityHistory.length > 0 ? (
          <div className="divide-y divide-slate-100 text-xs">
            {activityHistory.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{act.title}</div>
                    <div className="text-[11px] text-slate-500">{act.description}</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-emerald-700">+{act.points} pts</div>
                  <div className="text-[10px] text-slate-400">{act.date}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No verified turnover activity yet.</p>
            <p className="text-[11px]">When an Admin marks your pickup request as Collected or Recycled, activity and points will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};
