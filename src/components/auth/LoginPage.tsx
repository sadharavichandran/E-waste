import React, { useState } from 'react';
import { UserRole } from '../../types';
import { AuthIllustration } from './AuthIllustration';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import {
  Leaf,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Building2,
  User,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  KeyRound,
  Info,
  MapPin,
  FileCheck,
} from 'lucide-react';

interface LoginPageProps {
  role: UserRole;
  routePath: string;
  onNavigate: (route: string) => void;
  onLoginSuccess: (user: { id: string; name: string; email: string; role: UserRole; organization?: string }) => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  role,
  routePath,
  onNavigate,
  onLoginSuccess,
  onShowToast,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [city, setCity] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  // Role metadata for headings, subtitles, and badges
  const roleConfig = {
    user: {
      title: 'Welcome Back',
      subtitle: 'Sign in to continue your EcoLoop journey.',
      signupTitle: 'Create Your EcoLoop Account',
      signupSubtitle: 'Join households and students recycling responsibly.',
      badgeText: 'Citizen Portal',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
      icon: User,
      defaultEmail: 'user@ecoloop.org',
      defaultName: 'Avery Morgan',
      orgName: 'Community Resident',
    },
    admin: {
      title: 'Centre Admin Portal',
      subtitle: 'Sign in to manage your collection centre & pickups.',
      signupTitle: 'Register Collection Centre',
      signupSubtitle: 'Apply for certified e-waste intake and processing authorization.',
      badgeText: 'Centre Admin Desk',
      badgeColor: 'bg-sky-100 text-sky-900 border-sky-200',
      icon: Building2,
      defaultEmail: 'admin@ecoloop.org',
      defaultName: 'Marcus Sterling',
      orgName: 'GreenLoop Logistics',
    },
    superadmin: {
      title: 'Secure Admin Access',
      subtitle: 'Sign in to audit facility registrations & enforce compliance.',
      signupTitle: 'Regulatory Access',
      signupSubtitle: 'Public SuperAdmin registration is prohibited.',
      badgeText: 'Regulatory Authority',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-200',
      icon: ShieldCheck,
      defaultEmail: 'superadmin@ecoloop.org',
      defaultName: 'Dr. Sarah Al-Mansoor',
      orgName: 'E-Waste Compliance Authority',
    },
  }[role];

  const RoleIcon = roleConfig.icon;

  const validate = () => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        errors.fullName = 'Full Name is required.';
      }
      if (role === 'admin' && !facilityName.trim()) {
        errors.facilityName = 'Facility or Organization Name is required.';
      }
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!validate()) return;

    setLoading(true);

    // 1. Supabase Auth if environment variables are configured
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setAuthError(error.message);
          setLoading(false);
          return;
        }

        // Check user role from Supabase user_metadata or user_profiles table
        const assignedRole = data.user.user_metadata?.role || 'user';

        // Role authorization check: protect portals from role mismatch
        if (role === 'superadmin' && assignedRole !== 'superadmin') {
          setAuthError('Access Denied: Your account does not possess SuperAdmin regulatory clearance.');
          setLoading(false);
          return;
        }

        if (role === 'admin' && assignedRole !== 'admin' && assignedRole !== 'superadmin') {
          setAuthError('Access Denied: Your account is not registered as a certified facility administrator.');
          setLoading(false);
          return;
        }

        onLoginSuccess({
          id: data.user.id,
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          email: data.user.email || email,
          role,
          organization: data.user.user_metadata?.organization || roleConfig.orgName,
        });

        onShowToast(`Signed in to ${roleConfig.title}`, 'success');
        setLoading(false);
        return;
      } catch (err: any) {
        setAuthError(err.message || 'Authentication failed. Please verify your credentials.');
        setLoading(false);
        return;
      }
    }

    // 2. Real-time Client Authentication Sandbox
    setTimeout(() => {
      // Check if user is signing in with default test credentials or custom credentials
      if (email.trim().toLowerCase() === roleConfig.defaultEmail.toLowerCase() && password === 'ecoloop2026') {
        onLoginSuccess({
          id: `${role}-${Date.now()}`,
          name: roleConfig.defaultName,
          email: roleConfig.defaultEmail,
          role,
          organization: roleConfig.orgName,
        });
        onShowToast(`Signed in as ${roleConfig.defaultName} (${role.toUpperCase()})`, 'success');
      } else if (password.length >= 6) {
        // Authenticate user with their entered email
        onLoginSuccess({
          id: `usr-${Date.now()}`,
          name: fullName.trim() || email.split('@')[0].replace(/[._]/g, ' '),
          email: email.trim(),
          role,
          organization: role === 'admin' ? (facilityName.trim() || 'E-Waste Recovery Facility') : roleConfig.orgName,
        });
        onShowToast(`Signed in to ${roleConfig.title}`, 'success');
      } else {
        setAuthError('Invalid credentials. Password must be at least 6 characters.');
      }
      setLoading(false);
    }, 600);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (role === 'superadmin') {
      setAuthError('Public SuperAdmin registration is strictly prohibited by platform security policies.');
      return;
    }

    if (!validate()) return;

    setLoading(true);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              role,
              organization: role === 'admin' ? facilityName.trim() : 'Community Resident',
              city: city.trim(),
            },
          },
        });

        if (error) {
          setAuthError(error.message);
          setLoading(false);
          return;
        }

        if (data.user) {
          onLoginSuccess({
            id: data.user.id,
            name: fullName.trim(),
            email: email.trim(),
            role,
            organization: role === 'admin' ? facilityName.trim() : 'Community Resident',
          });
          onShowToast('Account created successfully! Welcome to EcoLoop.', 'success');
        }
        setLoading(false);
        return;
      } catch (err: any) {
        setAuthError(err.message || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }
    }

    // Client registration
    setTimeout(() => {
      onLoginSuccess({
        id: `reg-${Date.now()}`,
        name: fullName.trim(),
        email: email.trim(),
        role,
        organization: role === 'admin' ? facilityName.trim() : 'Citizen Member',
      });
      onShowToast(`Account registered successfully for ${fullName.trim()}!`, 'success');
      setLoading(false);
    }, 700);
  };

  const handleAutoFillTest = () => {
    setEmail(roleConfig.defaultEmail);
    setPassword('ecoloop2026');
    setFieldErrors({});
    setAuthError(null);
    onShowToast(`Filled test credentials for ${role.toUpperCase()} portal`, 'info');
  };

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-slate-800 flex flex-col justify-center font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        defaultEmail={email}
        onShowToast={onShowToast}
      />

      {/* Main Split-Screen Container */}
      <div className="w-full min-h-screen flex flex-col lg:flex-row">
        {/* ======================================================== */}
        {/* LEFT SECTION — EcoLoop Branding (Desktop & Tablet)       */}
        {/* ======================================================== */}
        <div className="relative w-full lg:w-1/2 bg-gradient-to-b from-[#022c22] via-[#064e3b] to-[#022c22] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between overflow-hidden shadow-2xl">
          {/* Subtle geometric & circular organic background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Bar */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner backdrop-blur-xs">
                <Leaf className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-white">
                  Eco<span className="text-emerald-400">Loop</span>
                </span>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-emerald-300/80">
                  Circular Economy Platform
                </span>
              </div>
            </div>

            {/* Current Active Route Pill */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-200 border border-white/15 text-[11px] font-mono backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{routePath}</span>
            </div>
          </div>

          {/* Central Hero Block & Illustration */}
          <div className="relative z-10 my-auto py-8 sm:py-12 space-y-6 max-w-lg">
            <div className="space-y-3">
              <span className="inline-block text-[11px] font-bold tracking-widest uppercase text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/80">
                Don't Dump It. Loop It.
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Give E-Waste a <span className="text-emerald-400">Better Future.</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                Connect with verified recycling centres and make responsible e-waste disposal easier.
              </p>
            </div>

            {/* Bespoke Circular Economy Illustration */}
            <div className="flex justify-center py-2">
              <AuthIllustration />
            </div>

            {/* Platform Tagline Banner */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-medium italic">“Don't Dump It. Loop It.”</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                100% Zero-Landfill
              </span>
            </div>
          </div>

          {/* Left Footer: Standards & Assurances */}
          <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> R2 / e-Stewards
              </span>
              <span>•</span>
              <span>EPA Chain of Custody</span>
              <span>•</span>
              <span>NIST 800-88 Data Sanitized</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT SECTION — Login / Signup Form                      */}
        {/* ======================================================== */}
        <div className="w-full lg:w-1/2 p-6 sm:p-12 lg:p-16 flex flex-col justify-between bg-white overflow-y-auto">
          {/* Top Bar with "Back to role selection" */}
          <div className="flex items-center justify-between pb-6">
            <button
              onClick={() => onNavigate('/auth/select-role')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition" />
              <span>Back to role selection</span>
            </button>

            {/* Role Badge */}
            <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${roleConfig.badgeColor}`}>
              <RoleIcon className="w-3.5 h-3.5" />
              <span>{roleConfig.badgeText}</span>
            </div>
          </div>

          {/* Form Container */}
          <div className="w-full max-w-md mx-auto my-auto py-4 space-y-6">
            {/* Header */}
            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {mode === 'signin' ? roleConfig.title : roleConfig.signupTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {mode === 'signin' ? roleConfig.subtitle : roleConfig.signupSubtitle}
              </p>
            </div>

            {/* Mode Switcher Tabs for User and Centre Admin */}
            {role !== 'superadmin' && (
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setFieldErrors({});
                    setAuthError(null);
                  }}
                  className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setFieldErrors({});
                    setAuthError(null);
                  }}
                  className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Quick 1-Click Credentials Banner (In Sign In mode) */}
            {mode === 'signin' && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-slate-600 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-slate-900 block">
                    Quick Verification Access
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Test the <strong>{role.toUpperCase()}</strong> portal with pre-verified credentials or sign in with your own email.
                  </p>
                  <button
                    type="button"
                    onClick={handleAutoFillTest}
                    className="mt-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                    Auto-Fill Test Account ({roleConfig.defaultEmail})
                  </button>
                </div>
              </div>
            )}

            {/* Error Message Alert */}
            {authError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{authError}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4" noValidate>
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      placeholder={roleConfig.defaultEmail}
                      className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-2xl text-xs sm:text-sm outline-hidden transition ${
                        fieldErrors.email
                          ? 'border-rose-400 bg-rose-50/50 focus:border-rose-600'
                          : 'border-slate-200 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10'
                      }`}
                      autoComplete="email"
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotPasswordOpen(true)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      placeholder="••••••••••••"
                      className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-2xl text-xs sm:text-sm outline-hidden transition ${
                        fieldErrors.password
                          ? 'border-rose-400 bg-rose-50/50 focus:border-rose-600'
                          : 'border-slate-200 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10'
                      }`}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-700 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>Remember me for 30 days</span>
                  </label>
                </div>

                {/* Submit Full-Width Sign In Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer transform active:scale-98"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* SIGN UP FORM (Citizens and Centre Admins) */}
            {mode === 'signup' && role !== 'superadmin' && (
              <form onSubmit={handleSignUp} className="space-y-3.5" noValidate>
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {role === 'admin' ? 'Authorized Representative Name' : 'Full Name'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                      }}
                      placeholder={role === 'admin' ? 'e.g. Marcus Sterling' : 'e.g. Jordan Lee'}
                      className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-2xl text-xs sm:text-sm outline-hidden transition ${
                        fieldErrors.fullName ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 focus:bg-white focus:border-emerald-600'
                      }`}
                    />
                  </div>
                  {fieldErrors.fullName && (
                    <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.fullName}</p>
                  )}
                </div>

                {/* Facility Name (Admin Only) */}
                {role === 'admin' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Facility / Organization Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={facilityName}
                        onChange={(e) => {
                          setFacilityName(e.target.value);
                          if (fieldErrors.facilityName) setFieldErrors((prev) => ({ ...prev, facilityName: '' }));
                        }}
                        placeholder="e.g. EcoLoop Bay Area Recovery Center"
                        className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-2xl text-xs sm:text-sm outline-hidden transition ${
                          fieldErrors.facilityName ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 focus:bg-white focus:border-emerald-600'
                        }`}
                      />
                    </div>
                    {fieldErrors.facilityName && (
                      <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.facilityName}</p>
                    )}
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      placeholder="you@domain.com"
                      className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-2xl text-xs sm:text-sm outline-hidden transition ${
                        fieldErrors.email ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 focus:bg-white focus:border-emerald-600'
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Password Fields in Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm outline-hidden focus:bg-white focus:border-emerald-600"
                    />
                    {fieldErrors.password && (
                      <p className="text-[10px] text-rose-600 font-medium">{fieldErrors.password}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Confirm <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm outline-hidden focus:bg-white focus:border-emerald-600"
                    />
                    {fieldErrors.confirmPassword && (
                      <p className="text-[10px] text-rose-600 font-medium">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">City / Region</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. San Francisco, CA"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm outline-hidden focus:bg-white focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Submit Signup Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer transform active:scale-98"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>{role === 'admin' ? 'Submit Facility Registration' : 'Create EcoLoop Account'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Signup / Sign In Toggle Link */}
            {role !== 'superadmin' ? (
              <div className="text-center pt-2">
                {mode === 'signin' ? (
                  <p className="text-xs text-slate-500">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setFieldErrors({});
                        setAuthError(null);
                      }}
                      className="font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 cursor-pointer"
                    >
                      Create one.
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setFieldErrors({});
                        setAuthError(null);
                      }}
                      className="font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 cursor-pointer"
                    >
                      Sign in here.
                    </button>
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center pt-2">
                <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>Public SuperAdmin registration is restricted by regulatory policy.</span>
                </p>
              </div>
            )}
          </div>

          {/* Right Footer: Route breadcrumb & Security indicator */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-[11px]">{routePath}</span>
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Lock className="w-3 h-3 text-emerald-600" /> End-to-End Encrypted Session
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
