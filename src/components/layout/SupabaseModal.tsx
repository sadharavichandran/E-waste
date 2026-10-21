import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Database,
  Copy,
  Check,
  X,
  Shield,
  Server,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  ExternalLink,
  Key,
  Globe,
  Radio,
} from 'lucide-react';
import { SUPABASE_SQL_SCHEMA } from '../../data/supabaseSchema';
import {
  getSupabaseConfig,
  saveSupabaseCredentials,
  removeSupabaseCredentials,
} from '../../lib/supabaseClient';
import {
  testSupabaseConnection,
  ConnectionTestResult,
} from '../../lib/supabaseService';

export const SupabaseModal: React.FC = () => {
  const {
    isSupabaseModalOpen,
    setIsSupabaseModalOpen,
    clearAllData,
    syncToSupabase,
    reloadFromDatabase,
    isSupabaseConnected,
    isDatabaseLoading,
    showToast,
    centres,
    requests,
    activityHistory,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'connect' | 'schema' | 'rls'>('status');

  // Input credentials state
  const initialConfig = getSupabaseConfig();
  const [inputUrl, setInputUrl] = useState(initialConfig.url || '');
  const [inputKey, setInputKey] = useState(initialConfig.anonKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  useEffect(() => {
    if (isSupabaseModalOpen) {
      const current = getSupabaseConfig();
      setInputUrl(current.url);
      setInputKey(current.anonKey);
      runQuickTest();
    }
  }, [isSupabaseModalOpen]);

  if (!isSupabaseModalOpen) return null;

  const runQuickTest = async () => {
    setIsTesting(true);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        message: 'Connection failed',
        error: err.message,
        tables: {},
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim().startsWith('https://')) {
      showToast('Please enter a valid Supabase URL starting with https://', 'error');
      return;
    }
    if (inputKey.trim().length < 20) {
      showToast('Please enter a valid Supabase anon key', 'error');
      return;
    }

    setIsTesting(true);
    try {
      saveSupabaseCredentials(inputUrl.trim(), inputKey.trim());
      const test = await testSupabaseConnection();
      setTestResult(test);

      if (test.success) {
        showToast('Successfully connected to Supabase Database!', 'success');
        await reloadFromDatabase();
      } else {
        showToast(`Connected to endpoint, but: ${test.message}`, 'warning');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save credentials', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = () => {
    removeSupabaseCredentials();
    setInputUrl('');
    setInputKey('');
    setTestResult(null);
    showToast('Supabase custom credentials cleared. Operating in local sandbox mode.', 'info');
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    try {
      await syncToSupabase();
      await runQuickTest();
    } catch (err: any) {
      showToast(`Sync failed: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Supabase Real-Time Database Center
                {isSupabaseConnected ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                    <Radio className="w-2.5 h-2.5" />
                    Setup / Offline
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Every pickup request, collection centre, and reward point is stored directly in PostgreSQL.
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
        <div className="flex items-center px-6 border-b border-slate-200 bg-white gap-2 sm:gap-4 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'status'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Database Status & Sync
          </button>
          <button
            onClick={() => setActiveTab('connect')}
            className={`py-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'connect'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Connect Credentials
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'schema'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            PostgreSQL Schema (DDL)
          </button>
          <button
            onClick={() => setActiveTab('rls')}
            className={`py-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'rls'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Row Level Security (RLS)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-700 text-sm flex-1">
          {/* TAB 1: STATUS & DATA SYNC */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Connection Status Card */}
              <div
                className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                  isSupabaseConnected
                    ? 'border-emerald-200 bg-emerald-50/80 text-emerald-950'
                    : 'border-amber-200 bg-amber-50/80 text-amber-950'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl mt-0.5 ${
                      isSupabaseConnected ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                    }`}
                  >
                    <Server className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      {isSupabaseConnected
                        ? 'Supabase PostgreSQL Storage is ACTIVE'
                        : 'Supabase Database Not Connected'}
                      {testResult && testResult.latencyMs > 0 && (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/80 border border-slate-200 text-slate-700">
                          {testResult.latencyMs} ms
                        </span>
                      )}
                    </h4>
                    <p className="text-xs leading-relaxed opacity-90">
                      {isSupabaseConnected
                        ? 'Real-time database replication active. Every pickup request and collection centre is stored directly in Supabase PostgreSQL and synced across all user tabs.'
                        : 'Data is temporarily held in local sandbox. Add your Supabase project credentials in the "Connect Credentials" tab to enable persistent cloud storage.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={runQuickTest}
                  disabled={isTesting}
                  className="px-3 py-1.5 rounded-xl border bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  Test Ping
                </button>
              </div>

              {/* Table Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Pickup Requests
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-extrabold text-slate-900">{requests.length}</span>
                    <span className="text-xs text-emerald-600 font-semibold">
                      {testResult?.tables['pickup_requests']?.accessible ? '✓ PostgreSQL' : 'Local / Synced'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Dispatch bookings & items</p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Collection Centres
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-extrabold text-slate-900">{centres.length}</span>
                    <span className="text-xs text-emerald-600 font-semibold">
                      {testResult?.tables['collection_centres']?.accessible ? '✓ PostgreSQL' : 'Local / Synced'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Verified e-waste hubs</p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Activity & Points
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-extrabold text-slate-900">{activityHistory.length}</span>
                    <span className="text-xs text-emerald-600 font-semibold">
                      {testResult?.tables['activity_history']?.accessible ? '✓ PostgreSQL' : 'Local / Synced'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Audit logs & EcoPoints</p>
                </div>
              </div>

              {/* 1-Click Sync to Supabase */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-emerald-700" />
                    Push All Local Data to Supabase Database
                  </h5>
                  <p className="text-[11px] text-slate-600">
                    Upload all initial collection centres, active pickup requests, and activity records into your Supabase database in 1 click.
                  </p>
                </div>
                <button
                  onClick={handleSyncToSupabase}
                  disabled={isSyncing || isDatabaseLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  <Zap className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
                  {isSyncing ? 'Pushing to DB...' : 'Sync Data Now'}
                </button>
              </div>

              {/* Clear Data Sandbox */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-slate-900 text-xs">Reset Local Sandbox State</h5>
                  <p className="text-[11px] text-slate-500">Clear cached data to restart from clean default tables.</p>
                </div>
                <button
                  onClick={clearAllData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  Clear Data
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CONNECT CREDENTIALS */}
          {activeTab === 'connect' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-sky-200 bg-sky-50/70 text-sky-950 text-xs space-y-2">
                <div className="font-bold flex items-center gap-2 text-sm text-sky-900">
                  <Globe className="w-4 h-4" />
                  How to get your Supabase Database Credentials
                </div>
                <ol className="list-decimal list-inside space-y-1 text-sky-800 leading-relaxed">
                  <li>
                    Open{' '}
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-bold hover:text-sky-950 inline-flex items-center gap-1"
                    >
                      Supabase Dashboard <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    and open your project.
                  </li>
                  <li>
                    Go to <strong>Project Settings</strong> (gear icon) &rarr; <strong>API</strong>.
                  </li>
                  <li>
                    Copy your <strong>Project URL</strong> (e.g. <code>https://xyzcompany.supabase.co</code>) and your <strong>Project API key (anon / public)</strong>.
                  </li>
                  <li>Paste them below and click <strong>Save & Test Connection</strong>.</li>
                </ol>
              </div>

              <form onSubmit={handleSaveAndConnect} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    Supabase Project URL (VITE_SUPABASE_URL)
                  </label>
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://your-project-id.supabase.co"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs font-mono text-slate-900 transition outline-hidden"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-500" />
                    Supabase Anon Public API Key (VITE_SUPABASE_ANON_KEY)
                  </label>
                  <input
                    type="password"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs font-mono text-slate-900 transition outline-hidden"
                    required
                  />
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isTesting}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isTesting ? 'Testing Connection...' : 'Save & Test Connection'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition cursor-pointer"
                    >
                      Reset Credentials
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-500">
                    Credentials are saved in your browser & can also be placed in <code>.env</code>
                  </span>
                </div>
              </form>

              {testResult && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                    testResult.success
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                      : 'border-rose-200 bg-rose-50 text-rose-950'
                  }`}
                >
                  <div className="font-bold flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    )}
                    {testResult.message}
                  </div>
                  {testResult.error && (
                    <div className="font-mono text-[11px] text-rose-800 bg-white/60 p-2 rounded-lg border border-rose-200">
                      {testResult.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SCHEMA DDL */}
          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-950 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold">Step: Run this in Supabase SQL Editor</span>
                  <p className="text-[11px] text-emerald-800">
                    Go to Supabase Dashboard &rarr; <strong>SQL Editor</strong> &rarr; Click <strong>New query</strong> &rarr; Paste and click <strong>Run</strong>.
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied SQL!' : 'Copy SQL Script'}
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 text-xs font-mono overflow-x-auto max-h-[380px] leading-relaxed border border-slate-800">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          )}

          {/* TAB 4: RLS POLICIES */}
          {activeTab === 'rls' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 flex items-start gap-2.5">
                <Shield className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong>Zero-Trust Data Protection:</strong> All tables have Row Level Security enabled. Unapproved collection centres are restricted from non-admin queries, safeguarding citizens from fake collectors, and all submissions are strictly audit-logged.
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <div className="font-semibold text-slate-900">1. Collection Centres Table (Realtime Directory)</div>
                  <div className="text-slate-500 font-mono mt-0.5">
                    SELECT / INSERT / UPDATE / DELETE enabled for registered centres and verification pipeline.
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <div className="font-semibold text-slate-900">2. Pickup Requests Table (Customer Dispatch)</div>
                  <div className="text-slate-500 font-mono mt-0.5">
                    Users can schedule requests, track progress by ECL-ID, and receive real-time status updates.
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <div className="font-semibold text-slate-900">3. Audit Log & EcoRewards Table</div>
                  <div className="text-slate-500 font-mono mt-0.5">
                    Every status update (submitted &rarr; confirmed &rarr; collected &rarr; recycled) triggers an audit row and EcoPoints credit.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">EcoLoop Architecture Engine v4.0</span>
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
