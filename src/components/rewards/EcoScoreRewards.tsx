import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Award,
  Sparkles,
  TreePine,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Cpu,
  GraduationCap,
  Crown,
  Clock,
  Gift,
  Layers,
  Recycle,
  Truck,
  ArrowRight,
} from 'lucide-react';
import { ECO_BADGES } from '../../data/seedData';
import confetti from 'canvas-confetti';

interface RedeemOption {
  id: string;
  title: string;
  cost: number;
  provider: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const REDEEM_OPTIONS: RedeemOption[] = [
  {
    id: 'rdm-tree',
    title: 'Plant a Verified Native Tree',
    cost: 100,
    provider: 'OneTreePlanted Partner',
    description: 'Sponsor an indigenous tree planted in deforested watersheds with geo-coordinates certificate.',
    icon: TreePine,
  },
  {
    id: 'rdm-voucher',
    title: '$15 Green Tech Repair Credit',
    cost: 150,
    provider: 'iFixit & Right-to-Repair Network',
    description: 'Redeemable for certified replacement batteries, repair toolkits, and screen parts.',
    icon: Gift,
  },
  {
    id: 'rdm-campus',
    title: 'Eco Dining Voucher',
    cost: 80,
    provider: 'Sustainable Dining Network',
    description: 'Free organic meal or fair-trade beverage credit across participating campus cafes.',
    icon: GraduationCap,
  },
];

export const EcoScoreRewards: React.FC = () => {
  const { currentUser, activityHistory, showToast, requests, userEcoPoints, setActiveTab } = useApp();
  const [redeemedIds, setRedeemedIds] = useState<string[]>([]);

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

  const handleRedeem = (item: RedeemOption) => {
    if (userEcoPoints < item.cost) {
      showToast(`Insufficient EcoPoints. You have ${userEcoPoints} pts (need ${item.cost} pts).`, 'warning');
      return;
    }

    try {
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch (e) {
      // ignore
    }

    setRedeemedIds((prev) => [...prev, item.id]);
    showToast(`Successfully redeemed "${item.title}"! Voucher dispatched to ${currentUser?.email || 'your registered email'}.`, 'success');
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-indigo-600" />;
      case 'Award':
        return <Award className="w-5 h-5 text-teal-600" />;
      case 'Crown':
        return <Crown className="w-5 h-5 text-amber-500" />;
      default:
        return <Award className="w-5 h-5 text-emerald-600" />;
    }
  };

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

      {/* Achievement Badges Grid */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Achievement Badges</h3>
            <p className="text-xs text-slate-500">Unlocked automatically as your EcoPoints balance increases</p>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">
            {ECO_BADGES.filter((b) => userEcoPoints >= b.requiredPoints).length} of {ECO_BADGES.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {ECO_BADGES.map((badge) => {
            const isUnlocked = userEcoPoints >= badge.requiredPoints;
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isUnlocked
                    ? 'border-emerald-200 bg-emerald-50/40 shadow-2xs'
                    : 'border-slate-200 bg-slate-50/50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                    {isUnlocked ? getBadgeIcon(badge.icon) : <Lock className="w-4 h-4 text-slate-400" />}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isUnlocked
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isUnlocked ? 'Unlocked' : `${badge.requiredPoints} pts`}
                  </span>
                </div>

                <div className="mt-3">
                  <h4 className="text-xs font-bold text-slate-900">{badge.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{badge.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rewards Redemption Grid */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Gift className="w-4 h-4 text-emerald-600" />
              Redeem EcoPoints
            </h3>
            <p className="text-xs text-slate-500">Exchange real earned points for sustainability impact</p>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
            {userEcoPoints} Available Pts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {REDEEM_OPTIONS.map((item) => {
            const Icon = item.icon;
            const isRedeemed = redeemedIds.includes(item.id);
            const canAfford = userEcoPoints >= item.cost;

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{item.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-700">{item.cost} pts</span>
                  <button
                    onClick={() => handleRedeem(item)}
                    disabled={isRedeemed || !canAfford}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isRedeemed
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : canAfford
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {isRedeemed ? 'Claimed ✓' : canAfford ? 'Redeem' : 'Need More Pts'}
                  </button>
                </div>
              </div>
            );
          })}
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
