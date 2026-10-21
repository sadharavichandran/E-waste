import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Database, Copy, Check, X, Shield, Server, RefreshCw } from 'lucide-react';
import { SUPABASE_SQL_SCHEMA } from '../../data/supabaseSchema';

export const SupabaseModal: React.FC = () => {
  const { isSupabaseModalOpen, setIsSupabaseModalOpen, clearAllData } = useApp();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'schema' | 'rls'>('status');

  if (!isSupabaseModalOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Supabase PostgreSQL Database Architecture
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  Real-Time Storage
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Persistent relational data storage, Row Level Security, and 3-Role audit trails
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSupabaseModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-slate-200 bg-white gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === 'status'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Configuration & Real-Time Sync
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === 'schema'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            PostgreSQL Schema (DDL)
          </button>
          <button
            onClick={() => setActiveTab('rls')}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === 'rls'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Row Level Security (RLS)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-700 text-sm">
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 flex items-start gap-3">
                <Server className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-emerald-950 text-sm">
                    Real-Time Reactive Storage Engine Active
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Zero static or fake mock data. When an <strong>Admin</strong> submits an E-Waste Centre, it is saved in real time and queued for <strong>SuperAdmin</strong> inspection. Upon approval, it becomes publicly searchable on the interactive locator map.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Required Environment Variables</span>
                  <div className="font-mono text-xs text-slate-800 space-y-1">
                    <div className="bg-white p-2 rounded-xl border border-slate-200 truncate">VITE_SUPABASE_URL</div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200 truncate">VITE_SUPABASE_ANON_KEY</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configured Relational Tables</span>
                  <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                    <li><code className="font-semibold text-emerald-700">pickup_requests</code> - Customer dispatch</li>
                    <li><code className="font-semibold text-emerald-700">collection_centres</code> - Verified geo hub index</li>
                    <li><code className="font-semibold text-emerald-700">request_status_history</code> - Audit logs</li>
                    <li><code className="font-semibold text-emerald-700">user_profiles</code> - Roles (User/Admin/SuperAdmin)</li>
                    <li><code className="font-semibold text-emerald-700">eco_rewards</code> - Real EcoPoints</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-slate-900 text-xs">Clear Real-Time Storage</h5>
                  <p className="text-[11px] text-slate-500">Purge local database tables to start completely fresh.</p>
                </div>
                <button
                  onClick={clearAllData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  Wipe Data
                </button>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Execute this script in Supabase SQL Editor:</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied SQL!' : 'Copy SQL Script'}
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto max-h-[380px] leading-relaxed border border-slate-800">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          )}

          {activeTab === 'rls' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 flex items-start gap-2.5">
                <Shield className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong>Zero-Trust Data Protection:</strong> All tables have Row Level Security enabled. Unapproved collection centres are restricted from non-admin queries, safeguarding citizens from fake collectors.
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <div className="font-semibold text-slate-900">1. Collection Centres Policy (Public Verified Only)</div>
                  <div className="text-slate-500 font-mono mt-0.5">ON public.collection_centres FOR SELECT USING (approval_status = 'approved' OR auth.jwt() -&gt;&gt; 'role' = 'superadmin');</div>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <div className="font-semibold text-slate-900">2. User Profile Isolation Policy</div>
                  <div className="text-slate-500 font-mono mt-0.5">ON public.user_profiles FOR ALL USING (auth.uid() = id);</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">EcoLoop Architecture Engine v3.0</span>
          <button
            onClick={() => setIsSupabaseModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
