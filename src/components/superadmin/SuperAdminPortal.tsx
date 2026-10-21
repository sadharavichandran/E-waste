import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CollectionCentre } from '../../types';
import {
  ShieldCheck,
  ShieldAlert,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  MapPin,
  Clock,
  Phone,
  Mail,
  UserCheck,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
  Flame,
} from 'lucide-react';

export const SuperAdminPortal: React.FC = () => {
  const {
    currentUser,
    centres,
    pendingCentres,
    approvedCentres,
    reviewCentre,
    deleteCentre,
    requests,
    clearAllData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'pending' | 'all_centres' | 'audit'>('pending');
  const [rejectingCentreId, setRejectingCentreId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('License number unverified in government database.');

  const rejectedCentres = centres.filter((c) => c.approvalStatus === 'rejected');

  const handleApprove = (centre: CollectionCentre) => {
    reviewCentre(
      centre.id,
      'approved',
      `Verified by SuperAdmin ${currentUser?.name || 'Regulatory Authority'}. EPA license and facility fire containment confirmed.`
    );
  };

  const handleConfirmReject = (centreId: string) => {
    reviewCentre(centreId, 'rejected', rejectionReason);
    setRejectingCentreId(null);
  };

  return (
    <div className="space-y-6">
      {/* SuperAdmin Banner */}
      <div className="bg-radial from-purple-950 via-slate-950 to-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            Platform Regulatory Authority
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
            SuperAdmin Anti-Fraud & Verification Console
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Safeguarding citizens from fraudulent recyclers. SuperAdmins must audit facility licenses, environmental compliance, and physical addresses before approving any e-waste center to the public locator map.
          </p>

          <div className="pt-2 flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-purple-500 text-slate-950 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              Pending Verifications ({pendingCentres.length})
            </button>
            <button
              onClick={() => setActiveTab('all_centres')}
              className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'all_centres'
                  ? 'bg-purple-500 text-slate-950 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              All Registered Hubs ({centres.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-purple-500 text-slate-950 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Security & Fraud Shield
            </button>
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Awaiting Verification
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">{pendingCentres.length}</div>
          <span className="text-[10px] text-slate-500">Requires SuperAdmin sign-off</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Approved & Live on Map
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{approvedCentres.length}</div>
          <span className="text-[10px] text-slate-500">Publicly visible to citizens</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Rejected / Fraud Blocked
          </span>
          <div className="text-2xl font-black text-rose-600 mt-1">{rejectedCentres.length}</div>
          <span className="text-[10px] text-slate-500">Unverified centers kept hidden</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Live Customer Orders
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{requests.length}</div>
          <span className="text-[10px] text-slate-500">Protected real-time requests</span>
        </div>
      </div>

      {/* Rejection Modal Overlay if active */}
      {rejectingCentreId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-rose-200">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Reject E-Waste Centre Application</h4>
                <p className="text-xs text-slate-500">Provide official compliance reason</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rejection Remarks (Returned to Admin)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-rose-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingCentreId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmReject(rejectingCentreId)}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-md transition cursor-pointer"
              >
                Confirm Rejection & Shield Users
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 1: Pending Verifications Desk */}
      {activeTab === 'pending' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Pending E-Waste Center Applications ({pendingCentres.length})
              </h3>
              <p className="text-xs text-slate-500">
                These facilities are currently HIDDEN from regular users until you verify their credentials.
              </p>
            </div>
          </div>

          {pendingCentres.length > 0 ? (
            <div className="space-y-4">
              {pendingCentres.map((centre) => (
                <div
                  key={centre.id}
                  className="p-5 rounded-2xl border-2 border-amber-200 bg-amber-50/20 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900">{centre.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          {centre.centreType}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        Operating Entity: <strong>{centre.organization}</strong> • Submitted by: <strong>{centre.submittedByAdminName}</strong>
                      </span>
                    </div>

                    <span className="text-xs font-mono font-bold bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700">
                      License: {centre.licenseNumber}
                    </span>
                  </div>

                  {/* Physical Location & Coordinates Check */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Address</span>
                      <span>{centre.address}, {centre.city} - {centre.pincode}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Geo Coordinates</span>
                      <span className="font-mono">{centre.lat}, {centre.lng}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Contact Phone & Hours</span>
                      <span>{centre.phone} ({centre.operatingHours})</span>
                    </div>
                  </div>

                  {/* Badges / Safety */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-500 text-[11px] font-semibold">Claimed Standards:</span>
                    {centre.isCertifiedR2 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        ✓ R2 / e-Stewards Certified
                      </span>
                    )}
                    {centre.isHazardousBatteryCertified ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Hazardous Battery Handling Certified
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[10px]">
                        Standard Electronics Only
                      </span>
                    )}
                  </div>

                  {/* SuperAdmin Decision Actions */}
                  <div className="pt-3 border-t border-amber-200 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      Verify against regional EPA / Cadastral records before approving.
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRejectingCentreId(centre.id)}
                        className="px-4 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject Application (Fake/Ineligible)
                      </button>
                      <button
                        onClick={() => handleApprove(centre)}
                        className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve & Publish to Citizens
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-semibold text-slate-700">All submissions verified!</p>
              <p>No e-waste centres currently awaiting SuperAdmin review. When an Admin adds a facility, it will immediately appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: All Centres Directory */}
      {activeTab === 'all_centres' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                Comprehensive Platform Registry ({centres.length})
              </h3>
              <p className="text-xs text-slate-500">
                Audit all active, pending, and blocked e-waste centers across the ecosystem.
              </p>
            </div>
          </div>

          {centres.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {centres.map((centre) => (
                <div key={centre.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{centre.name}</h4>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          centre.approvalStatus === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : centre.approvalStatus === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {centre.approvalStatus}
                      </span>
                    </div>
                    <div className="text-slate-500">
                      {centre.address}, {centre.city} • License: <strong className="font-mono text-slate-700">{centre.licenseNumber}</strong>
                    </div>
                    {centre.verificationNotes && (
                      <div className="text-[11px] text-slate-600 italic">
                        Note: {centre.verificationNotes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {centre.approvalStatus !== 'approved' && (
                      <button
                        onClick={() => handleApprove(centre)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition cursor-pointer"
                      >
                        Approve
                      </button>
                    )}
                    {centre.approvalStatus !== 'rejected' && (
                      <button
                        onClick={() => setRejectingCentreId(centre.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px] transition cursor-pointer"
                      >
                        Revoke / Reject
                      </button>
                    )}
                    <button
                      onClick={() => deleteCentre(centre.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      title="Purge record from database"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              No collection centers registered yet. Switch to Admin Portal to add one.
            </div>
          )}
        </div>
      )}

      {/* Subtab 3: Security & Fraud Shield Tools */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              Citizen Safety & Anti-Fraud Shield
            </h3>
            <p className="text-xs text-slate-500">
              Protection protocols implemented to prevent rogue e-waste dumping and unauthorized scrap collection.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block">1. Strict Quarantine Layer</span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Centres added by Admins are automatically isolated with <code className="font-mono bg-white px-1 border rounded">approvalStatus: 'pending'</code>. Under no circumstances are pending centers queryable by citizen frontends.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block">2. EPA License Enforcement</span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Every center submission requires a registered Environmental Protection Agency license number, logged with the submitting admin's digital identity.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block">3. Cryptographic Audit History</span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                All pickup status transitions and center reviews are permanently stamped with timestamp, reviewer ID, and operator notes.
              </p>
            </div>
          </div>

          {/* Database Reset Action */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h5 className="font-bold text-slate-900 text-xs">Clear Real-Time Database</h5>
              <p className="text-[11px] text-slate-500">Purge all local storage state to start completely blank.</p>
            </div>
            <button
              onClick={clearAllData}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              Reset Database to Clean State
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
