import React, { useState } from 'react';
import { PickupRequest } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  CheckCircle2,
  Copy,
  Check,
  Search,
  Calendar,
  MapPin,
  Clock,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface PickupConfirmationProps {
  request: PickupRequest;
  onReset: () => void;
}

export const PickupConfirmation: React.FC<PickupConfirmationProps> = ({ request, onReset }) => {
  const { setActiveTab, setTrackedRequestId } = useApp();
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(request.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTrackNow = () => {
    setTrackedRequestId(request.id);
    setActiveTab('track_request');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
      {/* Success Badge */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-md text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Booking Confirmed
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Doorstep Collection Scheduled!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Your e-waste collection order has been placed into our circular dispatch queue. Save your unique reference ID to track status updates.
          </p>
        </div>

        {/* Unique Request ID Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-md mx-auto">
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pickup Request ID
            </span>
            <span className="text-xl font-mono font-black text-emerald-700 tracking-wide">
              {request.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyId}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy ID'}
            </button>
            <button
              onClick={() => window.print()}
              className="p-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="Print Booking Slip"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* QR Code Simulation & Booking Pass */}
        <div className="p-4 rounded-2xl bg-slate-950 text-white text-left space-y-3 max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="font-semibold text-emerald-400">EcoLoop Gate Pass</span>
            <span className="text-[10px] text-slate-400 font-mono">SEC-VERIFIED</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Contact Name</span>
              <span className="font-semibold">{request.userName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Items</span>
              <span className="font-semibold capitalize">{request.category.replace('_', ' ')} (x{request.quantity})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Pickup Date</span>
              <span className="font-semibold">{request.preferredDate} ({request.preferredTimeSlot})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Location</span>
              <span className="font-semibold truncate block">{request.city} - {request.pincode}</span>
            </div>
          </div>
        </div>

        {/* Rewards Notice */}
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 max-w-md mx-auto text-left">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>EcoPoints Policy:</strong> As per platform sustainability integrity standards, EcoPoints are credited once our courier completes physical collection and verifies device condition.
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleTrackNow}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            Track Request Timeline
          </button>
          <button
            onClick={onReset}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            Book Another Pickup
          </button>
        </div>
      </div>
    </div>
  );
};
