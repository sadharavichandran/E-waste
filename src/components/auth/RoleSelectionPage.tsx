import React from 'react';
import { UserRole } from '../../types';
import {
  Leaf,
  User,
  Building2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface RoleSelectionPageProps {
  onSelectRoute: (route: string) => void;
}

export const RoleSelectionPage: React.FC<RoleSelectionPageProps> = ({ onSelectRoute }) => {
  return (
    <div className="min-h-screen bg-[#FBFBF9] text-slate-800 flex flex-col justify-between font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Header */}
      <header className="px-6 py-6 max-w-7xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-800 flex items-center justify-center text-white shadow-sm shadow-emerald-900/10">
            <Leaf className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-900 text-lg leading-tight tracking-tight">
              Eco<span className="text-emerald-700">Loop</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Don't Dump It. Loop It.</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Real-Time Circular Economy Platform</span>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center items-center text-center space-y-10">
        <div className="space-y-3 max-w-2xl">
          <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-100">
            Select Your Portal
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Choose your role to access <span className="text-emerald-700">EcoLoop</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            Every account type has dedicated role-based controls. Choose your portal to proceed to your role-specific authentication.
          </p>
        </div>

        {/* 3 Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          {/* Card 1: Citizen / User */}
          <div
            onClick={() => onSelectRoute('/auth/user/login')}
            className="group relative p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-500 transition-all duration-300 flex flex-col justify-between cursor-pointer transform hover:-translate-y-1"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                <User className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Citizen & Student
                </span>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition">
                  Resident User Portal
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed pt-1">
                  Schedule doorstep pickups, track your recycling requests live, discover verified local drop-off kiosks, and earn EcoPoints.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
              <span>Sign In as Citizen</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 2: Centre Admin */}
          <div
            onClick={() => onSelectRoute('/auth/centre/login')}
            className="group relative p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-sky-500 transition-all duration-300 flex flex-col justify-between cursor-pointer transform hover:-translate-y-1"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                  Operations & Facility
                </span>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-800 transition">
                  Centre Admin Portal
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed pt-1">
                  Register new collection hubs with GPS & EPA licenses, monitor verification status, and fulfill customer pickup routes.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-700 group-hover:text-sky-800">
              <span>Sign In to Centre Desk</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 3: SuperAdmin */}
          <div
            onClick={() => onSelectRoute('/auth/superadmin/login')}
            className="group relative p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-purple-500 transition-all duration-300 flex flex-col justify-between cursor-pointer transform hover:-translate-y-1"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                  Compliance Authority
                </span>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-800 transition">
                  SuperAdmin Access
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed pt-1">
                  Protect citizens against fraudulent collectors. Audit facility licenses, approve compliant centers, and block unverified actors.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700 group-hover:text-purple-800">
              <span>Secure Regulatory Access</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
            </div>
          </div>
        </div>

        {/* Security & Verification Assurance Banner */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 flex items-center gap-3 text-xs text-emerald-950 max-w-xl text-left">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <div className="leading-relaxed">
            <strong>Zero-Trust Authorization:</strong> Authenticated sessions are strictly verified against assigned roles to prevent unauthorized portal access.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-200/70 text-xs text-slate-400 text-center flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2 text-slate-500">
          <span className="font-bold text-slate-800">EcoLoop</span>
          <span>•</span>
          <span>“Don't Dump It. Loop It.”</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>EPA Compliant</span>
          <span>•</span>
          <span>R2 / e-Stewards Verified</span>
          <span>•</span>
          <span>Supabase Auth Protected</span>
        </div>
      </footer>
    </div>
  );
};
