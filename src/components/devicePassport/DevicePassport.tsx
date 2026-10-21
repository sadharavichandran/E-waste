import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  identifyDeviceFromImage,
  identifyDeviceFromText,
} from '../../utils/devicePassportAI';
import type { AIErrorType } from '../../utils/devicePassportAI';
import type { DevicePassportResult, MaterialEntry, HazardEntry, SavedDevicePassport } from '../../types/devicePassport';
import {
  ScanLine, Upload, Keyboard, AlertTriangle, CheckCircle2, ShieldAlert,
  Info, Cpu, Zap, Leaf, FlaskConical, Save, RefreshCw, ChevronDown,
  ChevronUp, Camera, Edit3, X, Star, BookOpen, Truck, KeyRound, WifiOff,
  Clock, HelpCircle,
} from 'lucide-react';

/* ─── helpers ─────────────────────────────────────────── */

const MATERIAL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Gold:       { bg: 'bg-amber-50',   text: 'text-amber-900',   border: 'border-amber-200'  },
  Silver:     { bg: 'bg-slate-50',   text: 'text-slate-800',   border: 'border-slate-200'  },
  Copper:     { bg: 'bg-orange-50',  text: 'text-orange-900',  border: 'border-orange-200' },
  Cobalt:     { bg: 'bg-blue-50',    text: 'text-blue-900',    border: 'border-blue-200'   },
  Lithium:    { bg: 'bg-violet-50',  text: 'text-violet-900',  border: 'border-violet-200' },
  Lead:       { bg: 'bg-rose-50',    text: 'text-rose-900',    border: 'border-rose-200'   },
  Mercury:    { bg: 'bg-rose-50',    text: 'text-rose-900',    border: 'border-rose-200'   },
  Cadmium:    { bg: 'bg-rose-50',    text: 'text-rose-900',    border: 'border-rose-200'   },
  Aluminum:   { bg: 'bg-sky-50',     text: 'text-sky-900',     border: 'border-sky-200'    },
  Steel:      { bg: 'bg-slate-50',   text: 'text-slate-800',   border: 'border-slate-200'  },
  Plastic:    { bg: 'bg-teal-50',    text: 'text-teal-900',    border: 'border-teal-200'   },
  Palladium:  { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-200'},
  Tin:        { bg: 'bg-gray-50',    text: 'text-gray-800',    border: 'border-gray-200'   },
  Nickel:     { bg: 'bg-green-50',   text: 'text-green-900',   border: 'border-green-200'  },
  default:    { bg: 'bg-slate-50',   text: 'text-slate-700',   border: 'border-slate-200'  },
};

function getMaterialColor(name: string) {
  for (const key of Object.keys(MATERIAL_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return MATERIAL_COLORS[key];
  }
  return MATERIAL_COLORS.default;
}

const HAZARD_META: Record<string, { label: string; icon: string; color: string }> = {
  lithium_battery:     { label: 'Lithium Battery',            icon: '⚡', color: 'text-amber-700 bg-amber-50 border-amber-200'   },
  lead:                { label: 'Lead (Pb)',                   icon: '☠', color: 'text-rose-700 bg-rose-50 border-rose-200'      },
  mercury:             { label: 'Mercury (Hg)',                icon: '☠', color: 'text-rose-700 bg-rose-50 border-rose-200'      },
  cadmium:             { label: 'Cadmium (Cd)',                icon: '☠', color: 'text-rose-700 bg-rose-50 border-rose-200'      },
  crt:                 { label: 'CRT Display Glass',           icon: '📺', color: 'text-orange-700 bg-orange-50 border-orange-200'},
  pcb_flame_retardant: { label: 'Brominated Flame Retardants', icon: '🔥', color: 'text-orange-700 bg-orange-50 border-orange-200'},
  beryllium:           { label: 'Beryllium (Be)',              icon: '⚠', color: 'text-rose-700 bg-rose-50 border-rose-200'      },
  other:               { label: 'Other Hazardous Material',    icon: '⚠', color: 'text-slate-700 bg-slate-50 border-slate-200'   },
};

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-rose-600 text-white',
  high:     'bg-orange-500 text-white',
  medium:   'bg-amber-400 text-slate-900',
  low:      'bg-slate-200 text-slate-700',
};

function formatRange(min: number, max: number, unit: string): string {
  const fmt = (n: number) => n < 1 ? n.toFixed(3) : n < 10 ? n.toFixed(2) : n.toFixed(1);
  if (min === max) return `~${fmt(min)} ${unit}`;
  return `${fmt(min)}–${fmt(max)} ${unit}`;
}

/* ─── Error Card ──────────────────────────────────────── */

const ERROR_CONFIGS: Record<AIErrorType | 'not_configured', {
  icon: React.ReactNode;
  title: string;
  color: string;
  steps: string[];
}> = {
  api_key: {
    icon: <KeyRound className="w-6 h-6 text-rose-500" />,
    title: 'Invalid API Key',
    color: 'bg-rose-50 border-rose-200',
    steps: [
      'Go to https://aistudio.google.com and sign in with your Google account.',
      'Click "Get API Key" → "Create API Key".',
      'Copy the key — it will look like: AIzaSy...',
      'Open your project\'s .env file and set: VITE_GEMINI_API_KEY=AIzaSy...',
      'Save the file — the dev server will auto-restart and pick up the new key.',
    ],
  },
  not_configured: {
    icon: <KeyRound className="w-6 h-6 text-slate-500" />,
    title: 'API Key Not Configured',
    color: 'bg-slate-50 border-slate-200',
    steps: [
      'Go to https://aistudio.google.com and sign in.',
      'Click "Get API Key" → "Create API Key" and copy it.',
      'Open your project\'s .env file.',
      'Add: VITE_GEMINI_API_KEY=your_key_here',
      'Save and let the dev server restart.',
    ],
  },
  quota: {
    icon: <Clock className="w-6 h-6 text-amber-500" />,
    title: 'Rate Limit / Quota Exceeded',
    color: 'bg-amber-50 border-amber-200',
    steps: [
      'You have exceeded the free Gemini API quota for now.',
      'Wait 60 seconds and try again.',
      'If the problem persists, check your quota at https://aistudio.google.com.',
    ],
  },
  network: {
    icon: <WifiOff className="w-6 h-6 text-slate-500" />,
    title: 'Network Error',
    color: 'bg-slate-50 border-slate-200',
    steps: [
      'Check your internet connection.',
      'Make sure you are not behind a firewall blocking Google APIs.',
      'Try again in a few seconds.',
    ],
  },
  unknown: {
    icon: <HelpCircle className="w-6 h-6 text-slate-500" />,
    title: 'Something Went Wrong',
    color: 'bg-slate-50 border-slate-200',
    steps: [
      'Please try again — this is usually a temporary issue.',
      'If it keeps happening, check your API key in the .env file.',
    ],
  },
};

const ErrorCard: React.FC<{
  errorType: AIErrorType | 'not_configured';
  errorMessage: string;
  onReset: () => void;
}> = ({ errorType, errorMessage, onReset }) => {
  const cfg = ERROR_CONFIGS[errorType] || ERROR_CONFIGS.unknown;
  return (
    <div className={`rounded-3xl border ${cfg.color} overflow-hidden`}>
      {/* Header */}
      <div className="p-6 flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white border border-current/10 flex items-center justify-center shrink-0 shadow-sm">
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">AI Analysis Failed</p>
          <h3 className="text-lg font-black text-slate-900">{cfg.title}</h3>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">{errorMessage}</p>
        </div>
      </div>

      {/* Fix Steps */}
      <div className="px-6 pb-5 border-t border-current/10 pt-4 space-y-3">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">How to fix this:</p>
        <ol className="space-y-2">
          {cfg.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        {(errorType === 'api_key' || errorType === 'not_configured') && (
          <div className="mt-4 p-3.5 rounded-xl bg-slate-900 text-white font-mono text-xs">
            <p className="text-slate-400 mb-1 text-[10px] uppercase tracking-wider">.env file</p>
            <p>VITE_GEMINI_API_KEY=<span className="text-emerald-400">AIzaSy... (your key here)</span></p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 pb-6 flex gap-3">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
        {(errorType === 'api_key' || errorType === 'not_configured') && (
          <a
            href="https://aistudio.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Get API Key →
          </a>
        )}
      </div>
    </div>
  );
};

/* ─── Sub-components ──────────────────────────────────── */

const MaterialCard: React.FC<{ m: MaterialEntry; idx: number }> = ({ m, idx }) => {
  const [open, setOpen] = useState(false);
  const col = getMaterialColor(m.name);
  return (
    <div className={`rounded-2xl border ${col.border} ${col.bg} overflow-hidden transition-all duration-200`} style={{ animationDelay: `${idx * 60}ms` }}>
      <button className="w-full flex items-center justify-between p-4 text-left cursor-pointer" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <div className="flex items-center gap-3 min-w-0">
          {m.isHazardous
            ? <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            : <FlaskConical className={`w-4 h-4 shrink-0 ${col.text}`} />}
          <div className="min-w-0">
            <span className={`text-sm font-bold block truncate ${col.text}`}>{m.name}</span>
            <span className="text-xs text-slate-500 mt-0.5 block">
              ≈ {formatRange(m.estimatedMinGrams, m.estimatedMaxGrams, m.unit)}
              {m.isHazardous && <span className="ml-2 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">Hazardous</span>}
            </span>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 space-y-2 border-t border-slate-100">
          <div className="flex items-start gap-2 pt-3">
            <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Source</p>
              <p className="text-xs text-slate-700 mt-0.5">{m.source}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Variability Note</p>
              <p className="text-xs text-slate-700 mt-0.5">{m.notes}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const HazardCard: React.FC<{ h: HazardEntry }> = ({ h }) => {
  const [open, setOpen] = useState(true);
  const meta = HAZARD_META[h.type] || HAZARD_META.other;
  return (
    <div className={`rounded-2xl border overflow-hidden ${meta.color}`}>
      <button className="w-full flex items-center justify-between p-4 cursor-pointer" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <div className="flex items-center gap-3">
          <span className="text-xl">{meta.icon}</span>
          <div className="text-left">
            <span className="text-sm font-bold block">{meta.label}</span>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${SEVERITY_BADGE[h.severity]}`}>{h.severity} risk</span>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 opacity-50 shrink-0" /> : <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />}
      </button>
      {open && h.safetyInstructions.length > 0 && (
        <div className="px-4 pb-4 border-t border-current/10">
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2 mt-3 opacity-70">Safety Instructions for Pickup</p>
          <ul className="space-y-1.5">
            {h.safetyInstructions.map((instr, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-60" />{instr}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const ConfidencePill: React.FC<{ level: 'high' | 'medium' | 'low' }> = ({ level }) => {
  const map = {
    high:   { label: 'High Confidence',   cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    medium: { label: 'Medium Confidence', cls: 'bg-amber-100 text-amber-800 border-amber-200'       },
    low:    { label: 'Low Confidence',    cls: 'bg-rose-100 text-rose-800 border-rose-200'           },
  };
  const { label, cls } = map[level];
  return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cls}`}>{label}</span>;
};

/* ─── Main Component ──────────────────────────────────── */

type InputMethod = 'photo' | 'text';
type Step = 'input' | 'loading' | 'error' | 'result';

export const DevicePassport: React.FC = () => {
  const { currentUser, showToast, setActiveTab } = useApp();

  const [step, setStep]               = useState<Step>('input');
  const [inputMethod, setInputMethod] = useState<InputMethod>('photo');

  /* photo */
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userHint, setUserHint]       = useState('');
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  /* text */
  const [textBrand, setTextBrand] = useState('');
  const [textModel, setTextModel] = useState('');

  /* result */
  const [result, setResult]           = useState<DevicePassportResult | null>(null);

  /* error */
  const [errorType, setErrorType]     = useState<AIErrorType | 'not_configured' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  /* corrections */
  const [correcting, setCorrecting]   = useState(false);
  const [corrBrand, setCorrBrand]     = useState('');
  const [corrModel, setCorrModel]     = useState('');

  /* saved */
  const [savedPassports, setSavedPassports] = useState<SavedDevicePassport[]>(() => {
    try { const r = localStorage.getItem('ecoloop_device_passports_v1'); if (r) return JSON.parse(r); } catch { /**/ }
    return [];
  });
  const [justSavedId, setJustSavedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [dragging, setDragging]       = useState(false);

  /* ── handlers ── */

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) { showToast('Please upload an image file (JPG, PNG, WEBP)', 'error'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f);
  }, []);

  const runIdentification = async () => {
    if (inputMethod === 'photo' && !imageFile) { showToast('Please upload a device photo first', 'warning'); return; }
    if (inputMethod === 'text' && (!textBrand.trim() || !textModel.trim())) { showToast('Please enter both brand and model name', 'warning'); return; }

    setStep('loading');
    setErrorType(null);

    const res = inputMethod === 'photo'
      ? await identifyDeviceFromImage(imageFile!, userHint || undefined)
      : await identifyDeviceFromText(textBrand.trim(), textModel.trim());

    /* ── error path ── */
    if (res.errorType) {
      setErrorType(res.errorType);
      setErrorMessage(res.errorMessage || 'An unexpected error occurred.');
      setStep('error');
      return;
    }

    /* ── success path ── */
    setResult(res.raw);
    setStep('result');
  };

  const handleReset = () => {
    setStep('input'); setImageFile(null); setImagePreview(null); setUserHint('');
    setTextBrand(''); setTextModel(''); setResult(null);
    setErrorType(null); setErrorMessage(''); setCorrecting(false);
    setCorrBrand(''); setCorrModel(''); setJustSavedId(null);
  };

  const handleApplyCorrection = async () => {
    if (!corrBrand.trim() && !corrModel.trim()) { showToast('Enter the corrected brand and/or model', 'warning'); return; }
    const brand = corrBrand.trim() || result?.brand || '';
    const model = corrModel.trim() || result?.model || '';
    setTextBrand(brand); setTextModel(model); setCorrecting(false); setInputMethod('text');
    setStep('loading');
    const res = await identifyDeviceFromText(brand, model);
    if (res.errorType) { setErrorType(res.errorType); setErrorMessage(res.errorMessage || ''); setStep('error'); return; }
    setResult(res.raw); setStep('result');
    showToast('Re-analysed with your correction', 'info');
  };

  const handleSave = () => {
    if (!result) return;
    const passport: SavedDevicePassport = {
      id: `pp-${Date.now()}`, userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'Guest', createdAt: new Date().toISOString(),
      inputMethod,
      userInput: { brand: inputMethod === 'text' ? textBrand : undefined, model: inputMethod === 'text' ? textModel : undefined, imageFileName: imageFile?.name },
      userCorrections: corrBrand || corrModel ? { brand: corrBrand || undefined, model: corrModel || undefined } : undefined,
      result,
    };
    const updated = [passport, ...savedPassports];
    setSavedPassports(updated);
    try { localStorage.setItem('ecoloop_device_passports_v1', JSON.stringify(updated)); } catch { /**/ }
    setJustSavedId(passport.id);
    showToast('Device Passport saved to your account!', 'success');
  };

  const activeCriticalHazards = result?.hazards.filter(h => h.present && (h.severity === 'critical' || h.severity === 'high')) || [];
  const presentHazards        = result?.hazards.filter(h => h.present) || [];

  /* ════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
          <ScanLine className="w-4 h-4" /> AI-Powered Material Intelligence
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Device Passport — Scan, Don't Select
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
          Upload a photo or enter the brand &amp; model. Our AI identifies your device and retrieves its
          approximate material composition from published research — including hazardous substances,
          recoverable metals, and safe handling instructions.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Approximate estimates only.</strong> Material quantities are derived from published
          lifecycle studies (UNEP, EU JRC, EPA). They vary by manufacturing batch, region, and model
          variant. A photo alone cannot verify exact internal composition. Values are labelled as
          ranges — never presented as exact measurements.
        </p>
      </div>

      {/* History */}
      {savedPassports.length > 0 && (
        <button onClick={() => setShowHistory(s => !s)} className="flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition">
          <BookOpen className="w-3.5 h-3.5" />
          {showHistory ? 'Hide' : 'View'} Saved Passports ({savedPassports.length})
          {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      )}
      {showHistory && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-3 border-b border-slate-100"><span className="text-sm font-bold text-slate-900">Saved Device Passports</span></div>
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {savedPassports.map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{p.result.brand || p.userInput.brand || '?'} {p.result.model || p.userInput.model || 'Unknown'}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{new Date(p.createdAt).toLocaleDateString()} · {p.result.materials.length} materials · {p.inputMethod === 'photo' ? '📷 Photo' : '⌨️ Text'}</p>
                </div>
                <ConfidencePill level={p.result.confidence} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════ INPUT ════ */}
      {step === 'input' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="flex border-b border-slate-100">
            {(['photo', 'text'] as const).map(method => (
              <button key={method} onClick={() => setInputMethod(method)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition cursor-pointer ${inputMethod === method ? 'bg-emerald-50 text-emerald-800 border-b-2 border-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                {method === 'photo' ? <><Camera className="w-4 h-4" /> Upload Device Photo</> : <><Keyboard className="w-4 h-4" /> Enter Brand &amp; Model</>}
              </button>
            ))}
          </div>
          <div className="p-6 sm:p-8 space-y-6">

            {/* Photo input */}
            {inputMethod === 'photo' && (
              <div className="space-y-4">
                <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${dragging ? 'border-emerald-500 bg-emerald-50/60 scale-[1.01]' : imagePreview ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50/60'}`}>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }} />
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img src={imagePreview} alt="Device preview" className="max-h-52 mx-auto rounded-xl object-contain shadow-md" />
                      <p className="text-xs text-emerald-700 font-semibold">{imageFile?.name}</p>
                      <button onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }} className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 mx-auto">
                        <X className="w-3 h-3" /> Remove photo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center"><Upload className="w-7 h-7 text-slate-400" /></div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">Drag &amp; drop your device photo here</p>
                        <p className="text-xs text-slate-400 mt-1">or click to browse — JPG, PNG, WEBP</p>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Optional: Brand / Model Hint</label>
                  <input type="text" value={userHint} onChange={e => setUserHint(e.target.value)} placeholder="e.g. Samsung Galaxy S21 Ultra"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-600 focus:bg-white transition" />
                  <p className="text-[10px] text-slate-400 mt-1">A hint improves AI identification accuracy for similar-looking devices.</p>
                </div>
              </div>
            )}

            {/* Text input */}
            {inputMethod === 'text' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name <span className="text-rose-500">*</span></label>
                    <input type="text" value={textBrand} onChange={e => setTextBrand(e.target.value)} placeholder="e.g. Apple, Samsung, Lenovo"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-600 focus:bg-white transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Model Name / Number <span className="text-rose-500">*</span></label>
                    <input type="text" value={textModel} onChange={e => setTextModel(e.target.value)} placeholder="e.g. iPhone 13 Pro, ThinkPad X1 Carbon"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-600 focus:bg-white transition" />
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-600"><strong>Tip:</strong> The more specific the model, the better the data. E.g. <em>"iPhone 13 Pro Max"</em> is better than <em>"iPhone"</em>.</p>
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <p className="text-[11px] text-slate-400">Powered by Google Gemini · Data sourced from UNEP, EU JRC, EPA lifecycle studies</p>
              <button id="device-passport-analyse-btn" onClick={runIdentification}
                disabled={inputMethod === 'photo' ? !imageFile : !textBrand.trim() || !textModel.trim()}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all transform active:scale-95 cursor-pointer">
                <ScanLine className="w-4 h-4" /> Analyse Device
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ LOADING ════ */}
      {step === 'loading' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-12 flex flex-col items-center justify-center gap-5 text-center min-h-64">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Cpu className="w-8 h-8 text-emerald-600 animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 animate-ping" />
          </div>
          <div className="space-y-1.5">
            <p className="text-base font-bold text-slate-900">Analysing Device…</p>
            <p className="text-xs text-slate-500 max-w-xs">Gemini AI is identifying your device and cross-referencing published material composition databases. This takes 5–15 seconds.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {['Identifying device', 'Matching material database', 'Detecting hazards'].map(label => (
              <span key={label} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{label}</span>
            ))}
          </div>
        </div>
      )}

      {/* ════ ERROR ════ */}
      {step === 'error' && errorType && (
        <ErrorCard errorType={errorType} errorMessage={errorMessage} onReset={handleReset} />
      )}

      {/* ════ RESULT ════ */}
      {step === 'result' && result && (
        <div className="space-y-5">

          {/* Not identified warning (genuine AI uncertainty, not an error) */}
          {!result.identified && result.clarificationQuestion && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-bold text-amber-900">Device Could Not Be Fully Identified</p>
                {result.dataLimitations && <p className="text-xs text-amber-800">{result.dataLimitations}</p>}
                <p className="text-xs font-semibold text-amber-900 bg-amber-100 border border-amber-200 rounded-xl px-3 py-2">
                  💬 {result.clarificationQuestion}
                </p>
              </div>
            </div>
          )}

          {/* Device identity card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Dark header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-400/20">Device Passport</span>
                    <ConfidencePill level={result.confidence} />
                  </div>
                  <h3 className="text-xl font-black text-white mt-2">
                    {result.brand && result.model ? `${result.brand} ${result.model}` : result.brand || result.model || 'Unidentified Device'}
                  </h3>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-300 mt-1">
                    {result.category && <span className="capitalize">📦 {result.category.replace(/_/g, ' ')}</span>}
                    {result.approximateYear && <span>📅 ~{result.approximateYear}</span>}
                    {result.approximateWeightKg && <span>⚖️ ~{result.approximateWeightKg} kg</span>}
                  </div>
                  {result.weightSource && <p className="text-[10px] text-slate-400 mt-1">Weight source: {result.weightSource}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setCorrecting(c => !c); setCorrBrand(result.brand || ''); setCorrModel(result.model || ''); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer">
                    <Edit3 className="w-3.5 h-3.5" /> Correct
                  </button>
                  <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer">
                    <RefreshCw className="w-3.5 h-3.5" /> New Scan
                  </button>
                </div>
              </div>
            </div>

            {/* Correction form */}
            {correcting && (
              <div className="p-5 bg-amber-50 border-b border-amber-100 space-y-3">
                <p className="text-xs font-bold text-amber-900">✏️ Correct the AI identification — we'll re-analyse with your input:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Correct Brand</label>
                    <input type="text" value={corrBrand} onChange={e => setCorrBrand(e.target.value)} placeholder="e.g. Apple"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 bg-white outline-none focus:border-emerald-600" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Correct Model</label>
                    <input type="text" value={corrModel} onChange={e => setCorrModel(e.target.value)} placeholder="e.g. iPhone 11 Pro"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 bg-white outline-none focus:border-emerald-600" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleApplyCorrection} className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition cursor-pointer">Re-Analyse with Correction</button>
                  <button onClick={() => setCorrecting(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition cursor-pointer">Cancel</button>
                </div>
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
              <div className="p-4 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Materials Identified</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{result.materials.length}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Hazards Detected</p>
                <p className={`text-2xl font-black mt-1 ${presentHazards.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{presentHazards.length}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Hazardous Materials</p>
                <p className={`text-2xl font-black mt-1 ${result.materials.filter(m => m.isHazardous).length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{result.materials.filter(m => m.isHazardous).length}</p>
              </div>
            </div>

            {/* Data limitations */}
            {result.dataLimitations && result.identified && (
              <div className="mx-5 mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600">{result.dataLimitations}</p>
              </div>
            )}

            {/* Critical hazards */}
            {activeCriticalHazards.length > 0 && (
              <div className="px-5 pt-4 pb-2">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <h4 className="text-sm font-bold text-rose-800">⚠ Safety Alert — High-Risk Hazards Detected</h4>
                </div>
                <div className="space-y-3">{activeCriticalHazards.map((h, i) => <HazardCard key={i} h={h} />)}</div>
              </div>
            )}

            {/* Materials breakdown */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">What's Inside Your Device?</h4>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Approximate estimates · Published sources</span>
              </div>
              {result.materials.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.materials.map((m, i) => <MaterialCard key={i} m={m} idx={i} />)}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs rounded-2xl bg-slate-50 border border-slate-200">
                  <FlaskConical className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p>No material data available for this device.</p>
                  <p className="mt-1">Try providing a more specific model name using the "Correct" button above.</p>
                </div>
              )}

              {/* Precious metals callout */}
              {result.materials.some(m => ['gold','silver','copper','cobalt','palladium','lithium'].some(n => m.name.toLowerCase().includes(n))) && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2"><Star className="w-4 h-4 text-amber-500" /><span className="text-xs font-bold text-amber-900">Recoverable Precious Metals</span></div>
                  <div className="flex flex-wrap gap-2">
                    {result.materials.filter(m => ['gold','silver','copper','cobalt','palladium','lithium'].some(n => m.name.toLowerCase().includes(n))).map((m, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full bg-white border border-amber-200 text-xs font-semibold text-amber-900">{m.name}: {formatRange(m.estimatedMinGrams, m.estimatedMaxGrams, m.unit)}</span>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-700 mt-2">These materials are recoverable through certified e-waste recycling — too valuable to landfill.</p>
                </div>
              )}
            </div>

            {/* All other hazards */}
            {presentHazards.filter(h => h.severity !== 'critical' && h.severity !== 'high').length > 0 && (
              <div className="px-5 pb-5 space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <h4 className="text-sm font-bold text-slate-900">Other Detected Hazards &amp; Safety Protocol</h4>
                </div>
                <div className="space-y-3">{presentHazards.filter(h => h.severity !== 'critical' && h.severity !== 'high').map((h, i) => <HazardCard key={i} h={h} />)}</div>
              </div>
            )}

            {/* Actions */}
            <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              {justSavedId ? (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Passport saved to your account!
                </div>
              ) : (
                <button id="device-passport-save-btn" onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition cursor-pointer">
                  <Save className="w-3.5 h-3.5" /> Save Device Passport
                </button>
              )}
              <button id="device-passport-pickup-btn" onClick={() => setActiveTab('schedule_pickup')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition cursor-pointer">
                <Truck className="w-3.5 h-3.5" /> Schedule Safe Pickup
              </button>
              <button onClick={handleReset} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" /> Scan Another Device
              </button>
            </div>
          </div>

          {/* Not-present hazards */}
          {result.hazards.filter(h => !h.present).length > 0 && (
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5 text-emerald-500" /> Hazards Screened — Not Detected in this Device Type
              </p>
              <div className="flex flex-wrap gap-2">
                {result.hazards.filter(h => !h.present).map((h, i) => {
                  const meta = HAZARD_META[h.type] || HAZARD_META.other;
                  return <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 font-semibold"><CheckCircle2 className="w-3 h-3" />{meta.icon} {meta.label} — Not present</span>;
                })}
              </div>
            </div>
          )}

          {/* Why recycle CTA */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900 to-slate-900 text-white space-y-2">
            <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-400" /><span className="text-sm font-bold">Why Proper Recycling Matters</span></div>
            <p className="text-xs text-slate-300 leading-relaxed">Every improperly discarded device leaches toxic metals like lead and mercury into soil and groundwater. At the same time, precious metals like gold, copper, and cobalt are lost. Certified e-waste recycling recovers these materials safely while protecting communities.</p>
            <button onClick={() => setActiveTab('schedule_pickup')} className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition cursor-pointer w-fit">
              <Truck className="w-3.5 h-3.5" /> Book a Free, Certified Pickup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
