import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Database,
  Check,
  X,
  Server,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  Radio,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { testMongoConnection, MongoStatusResult } from '../../lib/mongoService';

export const SupabaseModal: React.FC = () => {
  const {
    isSupabaseModalOpen,
    setIsSupabaseModalOpen,
    clearAllData,
    syncToSupabase,
    reloadFromDatabase,
    isDatabaseLoading,
    showToast,
    centres,
    requests,
    activityHistory,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'status' | 'migrate' | 'schemas'>('status');
  const [isTesting, setIsTesting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [mongoStatus, setMongoStatus] = useState<MongoStatusResult | null>(null);

  useEffect(() => {
    if (isSupabaseModalOpen) {
      runQuickTest();
    }
  }, [isSupabaseModalOpen]);

  if (!isSupabaseModalOpen) return null;

  const runQuickTest = async () => {
    setIsTesting(true);
    try {
      const res = await testMongoConnection();
      setMongoStatus(res);
    } catch (err: any) {
      setMongoStatus({
        success: false,
        isConnected: false,
        dbName: 'ecoloop',
        host: 'unknown',
        latencyMs: -1,
        counts: { users: 0, centres: 0, requests: 0, activities: 0 },
        error: err.message,
        message: 'Unable to reach MongoDB API backend',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRunMigration = async () => {
    setIsMigrating(true);
    try {
      const res = await syncToSupabase();
      showToast(`Migrated ${res.centresCount} centres, ${res.requestsCount} requests to MongoDB!`, 'success');
      await runQuickTest();
    } catch (err: any) {
      showToast(`Migration error: ${err.message}`, 'error');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleClearCollections = async () => {
    if (window.confirm('Are you sure you want to clear all MongoDB business collections? This tests empty database behaviour.')) {
      await clearAllData();
      await runQuickTest();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">MongoDB Real-Time Engine</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-300 border border-emerald-700">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-400">Production Mongoose Schemas & WebSocket Broadcast</p>
            </div>
          </div>
          <button
            onClick={() => setIsSupabaseModalOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 bg-slate-50/60">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'status'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Database Status & Health
          </button>
          <button
            onClick={() => setActiveTab('migrate')}
            className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'migrate'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Data Migration Tool
          </button>
          <button
            onClick={() => setActiveTab('schemas')}
            className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'schemas'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            MongoDB Schemas
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs">
          {/* TAB 1: Database Status */}
          {activeTab === 'status' && (
            <div className="space-y-5">
              {/* Connection Status Card */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                  mongoStatus?.isConnected
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}
              >
                {mongoStatus?.isConnected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">
                      {mongoStatus?.isConnected ? 'MongoDB Connected' : 'MongoDB Standby / Connecting'}
                    </span>
                    {mongoStatus?.latencyMs !== undefined && mongoStatus.latencyMs >= 0 && (
                      <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-emerald-300">
                        {mongoStatus.latencyMs}ms latency
                      </span>
                    )}
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {mongoStatus?.message || 'Database status checking...'}
                  </p>
                  <div className="text-[11px] font-mono pt-1 text-slate-600">
                    Host: <span className="font-bold text-slate-800">{mongoStatus?.host || 'localhost'}</span> | Database:{' '}
                    <span className="font-bold text-slate-800">{mongoStatus?.dbName || 'ecoloop'}</span>
                  </div>
                </div>
              </div>

              {/* Live Record Counts */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  MongoDB Document Collections
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Centres</span>
                    <span className="text-xl font-extrabold text-slate-900">{centres.length}</span>
                    <span className="text-[10px] text-emerald-700 block font-medium">Real-Time</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Pickups</span>
                    <span className="text-xl font-extrabold text-slate-900">{requests.length}</span>
                    <span className="text-[10px] text-sky-700 block font-medium">Real-Time</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Activities</span>
                    <span className="text-xl font-extrabold text-slate-900">{activityHistory.length}</span>
                    <span className="text-[10px] text-purple-700 block font-medium">Ledger</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">WebSocket</span>
                    <span className="text-xl font-extrabold text-emerald-600">Active</span>
                    <span className="text-[10px] text-slate-500 block font-medium">Live Broadcast</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={runQuickTest}
                  disabled={isTesting}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>Test MongoDB Connection</span>
                </button>
                <button
                  type="button"
                  onClick={reloadFromDatabase}
                  disabled={isDatabaseLoading}
                  className="px-4 py-2.5 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs hover:bg-emerald-200 transition flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Refresh Real-Time Data</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearCollections}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs hover:bg-rose-100 transition cursor-pointer"
                >
                  <span>Clear MongoDB Collections (Test Empty States)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Migration Tool */}
          {activeTab === 'migrate' && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-sky-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-sky-900">
                  <Layers className="w-4 h-4 text-sky-700" />
                  <span>1-Click Safe Migration: Supabase → MongoDB</span>
                </div>
                <p className="text-xs text-sky-800 leading-relaxed">
                  Transfer existing Supabase PostgreSQL records into MongoDB without data loss. The script verifies
                  exact counts and uses atomic upserts based on primary keys.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-900">Execute Migration</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Click the button below to sync all active collection centres, pickup requests, and history records
                  from the legacy layer directly into your connected MongoDB database.
                </p>
                <button
                  type="button"
                  onClick={handleRunMigration}
                  disabled={isMigrating}
                  className="px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition flex items-center gap-2 cursor-pointer"
                >
                  {isMigrating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Transferring Records to MongoDB...</span>
                    </>
                  ) : (
                    <>
                      <span>Execute Supabase to MongoDB Transfer</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 bg-slate-900 text-slate-300 rounded-2xl space-y-2 font-mono text-[11px]">
                <span className="text-slate-400 block font-bold">CLI Migration Alternative:</span>
                <p className="text-emerald-400">npm run migrate:supabase</p>
                <p className="text-slate-400 text-[10px]">
                  Runs scripts/migrate-from-supabase.ts against MONGODB_URI and validates row integrity.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Schemas */}
          {activeTab === 'schemas' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Production MongoDB Mongoose Collections</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The backend models enforce strict TypeScript definitions, unique constraints, bcrypt password hashes,
                  and compound indexing for rapid geospatial & status lookups.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <strong className="text-slate-900 block">users</strong>
                  <span className="text-slate-500 block">
                    Fields: name, email, password (bcrypt), role, organization, city, isEmailVerified
                  </span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <strong className="text-slate-900 block">collectioncentres</strong>
                  <span className="text-slate-500 block">
                    Fields: id, name, organization, address, city, lat, lng, approvalStatus ('pending' | 'approved' |
                    'rejected'), submittedByAdminId
                  </span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <strong className="text-slate-900 block">pickuprequests</strong>
                  <span className="text-slate-500 block">
                    Fields: id, userId, userName, category, quantity, address, city, preferredDate, status, statusHistory
                  </span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <strong className="text-slate-900 block">activityhistories</strong>
                  <span className="text-slate-500 block">
                    Fields: id, requestId, title, description, date, points, type ('pickup' | 'dropoff')
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>MongoDB Atlas / Local • Port 5001 • Real-time Enabled</span>
          </div>
          <button
            type="button"
            onClick={() => setIsSupabaseModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
