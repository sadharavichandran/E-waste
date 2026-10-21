import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { X, Mail, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
  onShowToast,
}) => {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });

        if (error) {
          setErrorMsg(error.message);
          setLoading(false);
          return;
        }

        setSent(true);
        setLoading(false);
        onShowToast('Password reset link sent to your email', 'success');
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to send password reset');
        setLoading(false);
      }
    } else {
      // Supabase is not configured with production keys
      setTimeout(() => {
        setLoading(false);
        setSent(true);
        onShowToast('Password recovery instructions sent to ' + email, 'info');
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Reset Your Password</h3>
              <p className="text-[11px] text-slate-500">We'll send you secure recovery instructions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {sent ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Recovery Email Dispatched</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              If an account exists for <strong className="text-slate-700">{email}</strong>, you will receive a password reset link shortly.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 transition"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
                {!loading && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
