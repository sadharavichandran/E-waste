import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CollectionCentre, DeviceCategory, PickupRequest, RequestStatus } from '../../types';
import {
  Building2,
  PlusCircle,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  FileCheck,
  Truck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Flame,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
  Calendar,
  Package,
  BarChart3,
  Bell,
  RefreshCw,
  Search,
  Filter,
  Check,
  Inbox,
  PackageOpen,
  CalendarX,
  BellOff,
  FileSpreadsheet,
  History,
  Settings,
  Edit,
  Save,
  HelpCircle,
  Activity,
  Award,
  Crosshair,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  AuditLogEntry,
  fetchStatusAuditHistory,
  subscribeToDatabaseChanges,
  testSupabaseConnection,
} from '../../lib/mongoService';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import L from 'leaflet';

const CATEGORY_CHOICES: { id: DeviceCategory; label: string }[] = [
  { id: 'mobile', label: 'Mobile / Smartphones' },
  { id: 'laptop', label: 'Laptops / Notebooks' },
  { id: 'tablet', label: 'Tablets / iPads' },
  { id: 'desktop', label: 'Desktop Computers' },
  { id: 'battery', label: 'Batteries / Power Packs' },
  { id: 'charger_cable', label: 'Cables & Adapters' },
  { id: 'home_appliance', label: 'Small Appliances' },
  { id: 'audio_wearable', label: 'Audio & Wearables' },
  { id: 'other', label: 'Other Electronic Items' },
];

const CATEGORY_COLORS: Record<string, string> = {
  mobile: '#0284c7',
  laptop: '#059669',
  desktop: '#7c3aed',
  battery: '#e11d48',
  tablet: '#0d9488',
  charger_cable: '#f59e0b',
  home_appliance: '#ea580c',
  audio_wearable: '#4f46e5',
  other: '#64748b',
};

export const AdminPortal: React.FC = () => {
  const {
    currentUser,
    centres,
    registerCentre,
    updateCentre,
    requests,
    updateRequestStatus,
    activeTab,
    setActiveTab,
    setTrackedRequestId,
    showToast,
    isSupabaseConfigured,
    isSupabaseConnected,
    isDatabaseLoading,
    databaseError,
    reloadFromDatabase,
    setIsSupabaseModalOpen,
  } = useApp();

  type AdminSubTab =
    | 'my_centre'
    | 'pickups'
    | 'schedule'
    | 'inventory'
    | 'history'
    | 'analytics'
    | 'notifications'
    | 'settings';

  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('my_centre');

  // Synchronize internal activeSubTab with AppContext activeTab
  useEffect(() => {
    if (activeTab === 'admin_my_centre' || activeTab === 'admin_centres') {
      setActiveSubTab('my_centre');
    } else if (activeTab === 'admin_pickups') {
      setActiveSubTab('pickups');
    } else if (activeTab === 'admin_schedule') {
      setActiveSubTab('schedule');
    } else if (activeTab === 'admin_inventory') {
      setActiveSubTab('inventory');
    } else if (activeTab === 'admin_history') {
      setActiveSubTab('history');
    } else if (activeTab === 'admin_analytics') {
      setActiveSubTab('analytics');
    } else if (activeTab === 'admin_notifications') {
      setActiveSubTab('notifications');
    } else if (activeTab === 'admin_settings') {
      setActiveSubTab('settings');
    }
  }, [activeTab]);

  const switchSubTab = (tab: AdminSubTab) => {
    setActiveSubTab(tab);
    switch (tab) {
      case 'my_centre':
        setActiveTab('admin_my_centre');
        break;
      case 'pickups':
        setActiveTab('admin_pickups');
        break;
      case 'schedule':
        setActiveTab('admin_schedule');
        break;
      case 'inventory':
        setActiveTab('admin_inventory');
        break;
      case 'history':
        setActiveTab('admin_history');
        break;
      case 'analytics':
        setActiveTab('admin_analytics');
        break;
      case 'notifications':
        setActiveTab('admin_notifications');
        break;
      case 'settings':
        setActiveTab('admin_settings');
        break;
    }
  };

  // Real Audit Log state fetched directly from Supabase request_status_history
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Filters for pickup requests
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Centre Form & Map Edit State
  const [isEditingCentre, setIsEditingCentre] = useState(false);
  const [centreName, setCentreName] = useState('');
  const [organization, setOrganization] = useState(currentUser?.organization || '');
  const [centreType, setCentreType] = useState<CollectionCentre['centreType']>('Certified Recycler');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [lat, setLat] = useState<string>('13.0827');
  const [lng, setLng] = useState<string>('80.2707');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [operatingHours, setOperatingHours] = useState('Mon-Sat: 09:00 AM - 06:00 PM');
  const [selectedCategories, setSelectedCategories] = useState<DeviceCategory[]>([
    'mobile',
    'laptop',
    'desktop',
    'battery',
    'charger_cable',
  ]);
  const [isCertifiedR2, setIsCertifiedR2] = useState(true);
  const [isHazardousBatteryCertified, setIsHazardousBatteryCertified] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Supabase Latency diagnostic test state
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  // Leaflet map refs for embedded location coordinate picker
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // 1. Authorised Admin Centre Scoping
  // Filter centres belonging to this authorized administrator or their organization
  const adminCentres = useMemo(() => {
    return centres.filter(
      (c) =>
        c.submittedByAdminId === currentUser?.id ||
        (currentUser?.organization && c.organization?.toLowerCase() === currentUser.organization.toLowerCase()) ||
        c.id === (currentUser as any)?.centreId
    );
  }, [centres, currentUser]);

  // Primary active centre for this admin
  const activeCentre: CollectionCentre | null = adminCentres[0] || (centres.length === 1 ? centres[0] : null);

  // Populate form with active centre values when entering edit mode
  const handleStartEditCentre = () => {
    if (activeCentre) {
      setCentreName(activeCentre.name);
      setOrganization(activeCentre.organization || currentUser?.organization || '');
      setCentreType(activeCentre.centreType);
      setLicenseNumber(activeCentre.licenseNumber || '');
      setAddress(activeCentre.address);
      setCity(activeCentre.city);
      setPincode(activeCentre.pincode);
      setLat(activeCentre.lat.toString());
      setLng(activeCentre.lng.toString());
      setPhone(activeCentre.phone);
      setEmail(activeCentre.email);
      setOperatingHours(activeCentre.operatingHours);
      setSelectedCategories(activeCentre.acceptedCategories);
      setIsCertifiedR2(activeCentre.isCertifiedR2);
      setIsHazardousBatteryCertified(activeCentre.isHazardousBatteryCertified);
    }
    setIsEditingCentre(true);
  };

  const handleStartNewRegistration = () => {
    setCentreName('');
    setOrganization(currentUser?.organization || '');
    setCentreType('Certified Recycler');
    setLicenseNumber('');
    setAddress('');
    setCity('');
    setPincode('');
    setLat('13.0827');
    setLng('80.2707');
    setPhone('');
    setEmail('');
    setOperatingHours('Mon-Sat: 09:00 AM - 06:00 PM');
    setSelectedCategories(['mobile', 'laptop', 'desktop', 'battery', 'charger_cable']);
    setIsCertifiedR2(true);
    setIsHazardousBatteryCertified(false);
    setIsEditingCentre(true);
  };

  // 2. Pickup Requests assigned strictly to this admin's centre / geographic hub
  const assignedRequests: PickupRequest[] = useMemo(() => {
    if (!activeCentre) {
      return requests;
    }
    return requests.filter((r) => {
      const matchCity = activeCentre.city && r.city.toLowerCase() === activeCentre.city.toLowerCase();
      const matchCentreId = (r as any).centreId === activeCentre.id;
      return matchCity || matchCentreId;
    });
  }, [requests, activeCentre]);

  // 3. Real-Time Dashboard KPI Calculations from actual database records ONLY
  const kpiStats = useMemo(() => {
    const total = assignedRequests.length;
    const submitted = assignedRequests.filter((r) => r.status === 'submitted').length;
    const confirmed = assignedRequests.filter((r) => r.status === 'confirmed').length;
    const collected = assignedRequests.filter((r) => r.status === 'collected').length;
    const recycled = assignedRequests.filter((r) => r.status === 'recycled').length;

    const completedRequests = assignedRequests.filter((r) => r.status === 'collected' || r.status === 'recycled');
    const totalInventoryUnits = completedRequests.reduce((sum, r) => sum + (r.quantity || 1), 0);
    const totalCo2SavedKg = completedRequests
      .reduce((sum, r) => sum + (r.estimatedCo2SavedKg || 0), 0)
      .toFixed(1);

    return {
      total,
      pendingAction: submitted,
      dispatched: confirmed,
      processed: collected + recycled,
      inventoryUnits: totalInventoryUnits,
      co2SavedKg: parseFloat(totalCo2SavedKg),
    };
  }, [assignedRequests]);

  // 4. Collection Schedule (Actual future or scheduled requests sorted by date)
  const scheduledCollections = useMemo(() => {
    return assignedRequests
      .filter((r) => r.status === 'submitted' || r.status === 'confirmed')
      .sort((a, b) => new Date(a.preferredDate).getTime() - new Date(b.preferredDate).getTime());
  }, [assignedRequests]);

  // 5. Genuine E-Waste Inventory from database (only collected & recycled items)
  const inventoryItems = useMemo(() => {
    return assignedRequests.filter((r) => r.status === 'collected' || r.status === 'recycled');
  }, [assignedRequests]);

  // 6. Complete Collection History (Completed/recycled pickups sorted by date descending)
  const collectionHistory = useMemo(() => {
    return assignedRequests
      .filter((r) => r.status === 'collected' || r.status === 'recycled')
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [assignedRequests]);

  // Filtered Collection History by search
  const filteredCollectionHistory = useMemo(() => {
    const q = historySearchQuery.toLowerCase().trim();
    if (!q) return collectionHistory;
    return collectionHistory.filter(
      (item) =>
        item.id.toLowerCase().includes(q) ||
        item.userName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.deviceName && item.deviceName.toLowerCase().includes(q)) ||
        item.city.toLowerCase().includes(q)
    );
  }, [collectionHistory, historySearchQuery]);

  // Category distribution for inventory and reports
  const categoryAnalytics = useMemo(() => {
    const counts: Record<string, number> = {};
    inventoryItems.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + (item.quantity || 1);
    });
    return Object.entries(counts).map(([category, count]) => ({
      name: category.replace('_', ' ').toUpperCase(),
      count,
      color: CATEGORY_COLORS[category] || '#64748b',
    }));
  }, [inventoryItems]);

  // Fetch real audit log history from Supabase
  const loadAuditLogs = async () => {
    setIsLoadingAuditLogs(true);
    setAuditError(null);
    try {
      const logs = await fetchStatusAuditHistory();
      setAuditLogs(logs);
    } catch (e: any) {
      setAuditError(e.message || 'Failed to load audit history');
    } finally {
      setIsLoadingAuditLogs(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();

    const unsub = subscribeToDatabaseChanges(
      () => {},
      () => {
        loadAuditLogs();
      },
      () => {
        loadAuditLogs();
      }
    );

    return () => {
      unsub();
    };
  }, []);

  // Form Validation
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!centreName.trim()) errs.centreName = 'Centre name is required';
    if (!licenseNumber.trim()) errs.licenseNumber = 'Official EPA / Environmental license is required';
    if (!address.trim()) errs.address = 'Street address is required';
    if (!city.trim()) errs.city = 'City is required';
    if (!pincode.trim()) errs.pincode = 'Pincode is required';
    if (!phone.trim()) errs.phone = 'Contact phone is required';
    if (!email.trim() || !email.includes('@')) errs.email = 'Valid contact email is required';
    if (selectedCategories.length === 0) errs.categories = 'Select at least one accepted category';

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const toggleCategory = (cat: DeviceCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // GPS auto-locate
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'warning');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude.toFixed(4);
        const newLng = pos.coords.longitude.toFixed(4);
        setLat(newLat);
        setLng(newLng);
        if (mapInstanceRef.current && markerRef.current) {
          const latNum = parseFloat(newLat);
          const lngNum = parseFloat(newLng);
          mapInstanceRef.current.setView([latNum, lngNum], 14);
          markerRef.current.setLatLng([latNum, lngNum]);
        }
        showToast('Updated coordinates with device GPS position', 'info');
      },
      () => {
        showToast('Location permission not granted.', 'warning');
      }
    );
  };

  // Embedded Leaflet map lifecycle for Adding / Editing Centre Location
  useEffect(() => {
    const isShowingMap = activeSubTab === 'my_centre' && (!activeCentre || isEditingCentre);

    if (isShowingMap) {
      const timer = setTimeout(() => {
        const container = mapContainerRef.current;
        if (!container) return;

        const initialLat = parseFloat(lat) || 13.0827;
        const initialLng = parseFloat(lng) || 80.2707;

        if (!mapInstanceRef.current) {
          const map = L.map(container, {
            center: [initialLat, initialLng],
            zoom: 13,
            zoomControl: true,
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(map);

          const customIcon = L.divIcon({
            html: `
              <div style="
                background: #0284c7;
                color: white;
                width: 36px;
                height: 36px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                cursor: grab;
              ">
                <span style="transform: rotate(45deg); font-size: 15px; font-weight: bold;">🏢</span>
              </div>
            `,
            className: 'custom-admin-marker',
            iconSize: [36, 36],
            iconAnchor: [18, 36],
          });

          const marker = L.marker([initialLat, initialLng], {
            draggable: true,
            icon: customIcon,
          }).addTo(map);

          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            setLat(pos.lat.toFixed(4));
            setLng(pos.lng.toFixed(4));
          });

          map.on('click', (e: L.LeafletMouseEvent) => {
            marker.setLatLng(e.latlng);
            setLat(e.latlng.lat.toFixed(4));
            setLng(e.latlng.lng.toFixed(4));
          });

          mapInstanceRef.current = map;
          markerRef.current = marker;

          setTimeout(() => {
            map.invalidateSize();
          }, 200);
        } else {
          const map = mapInstanceRef.current;
          const marker = markerRef.current;
          if (map && marker) {
            map.setView([initialLat, initialLng], 13);
            marker.setLatLng([initialLat, initialLng]);
            setTimeout(() => {
              map.invalidateSize();
            }, 100);
          }
        }
      }, 150);

      return () => {
        clearTimeout(timer);
      };
    } else {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    }
  }, [activeSubTab, isEditingCentre, activeCentre]);

  // Clean up Leaflet on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Submit Centre Registration or Update strictly into Supabase
  const handleSubmitCentre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (isEditingCentre && activeCentre) {
        await updateCentre({
          ...activeCentre,
          name: centreName.trim(),
          organization: organization.trim() || currentUser?.organization || 'Authorized Circular Facility',
          centreType,
          licenseNumber: licenseNumber.trim(),
          address: address.trim(),
          city: city.trim(),
          pincode: pincode.trim(),
          lat: parseFloat(lat) || 13.0827,
          lng: parseFloat(lng) || 80.2707,
          phone: phone.trim(),
          email: email.trim(),
          operatingHours: operatingHours.trim(),
          acceptedCategories: selectedCategories,
          isCertifiedR2,
          isHazardousBatteryCertified,
        });
        showToast(`Centre "${centreName.trim()}" updated successfully in Supabase!`, 'success');
        setIsEditingCentre(false);
      } else {
        const created = registerCentre({
          name: centreName.trim(),
          organization: organization.trim() || currentUser?.organization || 'Authorized Circular Facility',
          centreType,
          licenseNumber: licenseNumber.trim(),
          address: address.trim(),
          city: city.trim(),
          pincode: pincode.trim(),
          lat: parseFloat(lat) || 13.0827,
          lng: parseFloat(lng) || 80.2707,
          phone: phone.trim(),
          email: email.trim(),
          operatingHours: operatingHours.trim(),
          acceptedCategories: selectedCategories,
          isCertifiedR2,
          isHazardousBatteryCertified,
        });
        showToast(`Centre "${created.name}" registered and stored in Supabase!`, 'success');
        setIsEditingCentre(false);
      }
    } catch (err: any) {
      showToast(`Operation failed: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Status in Supabase with confirmation
  const handleUpdateStatus = async (requestId: string, newStatus: RequestStatus, note: string) => {
    try {
      await updateRequestStatus(requestId, newStatus, note);
      await loadAuditLogs();
    } catch (err: any) {
      showToast(`Update failed: ${err.message}`, 'error');
    }
  };

  // Run live Supabase test in Settings tab
  const handleTestDatabasePing = async () => {
    setIsPinging(true);
    setPingStatus(null);
    try {
      const res = await testSupabaseConnection();
      if (res.success) {
        setPingStatus(`Online: Live PostgreSQL response in ${res.latencyMs}ms (HTTP 200 OK)`);
      } else {
        setPingStatus(`Offline: ${res.error || res.message || 'Connection failed'}`);
      }
    } catch (e: any) {
      setPingStatus(`Ping Error: ${e.message}`);
    } finally {
      setIsPinging(false);
    }
  };

  // Filtered requests view for Pickups tab
  const filteredRequests = useMemo(() => {
    return assignedRequests.filter((req) => {
      const matchStatus = statusFilter === 'all' || req.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        req.id.toLowerCase().includes(q) ||
        req.userName.toLowerCase().includes(q) ||
        req.category.toLowerCase().includes(q) ||
        (req.deviceName && req.deviceName.toLowerCase().includes(q)) ||
        req.city.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [assignedRequests, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              Centre Admin Portal
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Facility Operations & E-Waste Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Logged in as <strong>{currentUser?.name || 'Administrator'}</strong> ({currentUser?.organization || 'Facility Admin'}). All data is synchronized live with Supabase PostgreSQL.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <button
            onClick={() => reloadFromDatabase()}
            disabled={isDatabaseLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDatabaseLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          {!activeCentre && (
            <button
              onClick={() => {
                switchSubTab('my_centre');
                handleStartNewRegistration();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register Centre</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Error / Offline Banner */}
      {!isSupabaseConfigured && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Supabase is not configured yet</p>
              <p className="text-amber-800 text-[11px] mt-0.5">
                The Centre Admin Dashboard runs exclusively on real PostgreSQL database records. Please configure your project credentials.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSupabaseModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
          >
            Configure Supabase
          </button>
        </div>
      )}

      {databaseError && isSupabaseConfigured && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Database Communication Error</p>
              <p className="text-rose-800 text-[11px] font-mono mt-0.5">{databaseError}</p>
            </div>
          </div>
          <button
            onClick={() => reloadFromDatabase()}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 3. Top KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Pickups</span>
            <Truck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{kpiStats.total}</span>
            <span className="text-[10px] font-semibold text-slate-400">Assigned Records</span>
          </div>
          <p className="text-[11px] text-slate-500">Live database bookings</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Action</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-600">{kpiStats.pendingAction}</span>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Awaiting Courier
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Submitted customer pickups</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Inventory Processed</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-600">{kpiStats.inventoryUnits}</span>
            <span className="text-[10px] font-semibold text-slate-400">Units Recovered</span>
          </div>
          <p className="text-[11px] text-slate-500">Verified collected / recycled</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">CO2 Diverted</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-purple-600">{kpiStats.co2SavedKg}</span>
            <span className="text-xs font-semibold text-slate-500">kg CO2e</span>
          </div>
          <p className="text-[11px] text-slate-500">Calculated from genuine devices</p>
        </div>
      </div>



      {/* Loading Skeleton */}
      {isDatabaseLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200/70 rounded-2xl"></div>
          ))}
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. MY CENTRE (Profile + Embedded Leaflet Location Map Picker) */}
      {/* ============================================================== */}
      {activeSubTab === 'my_centre' && (
        <div className="space-y-6">
          {activeCentre && !isEditingCentre ? (
            /* Active Centre Profile Display Card */
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 uppercase tracking-wider">
                      Authorized Facility
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      ID: {activeCentre.id}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mt-1">
                    <Building2 className="w-5 h-5 text-sky-600" />
                    {activeCentre.name}
                  </h3>
                  <p className="text-xs text-slate-500">{activeCentre.organization}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                      activeCentre.approvalStatus === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : activeCentre.approvalStatus === 'rejected'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                    }`}
                  >
                    {activeCentre.approvalStatus === 'approved'
                      ? '✓ SuperAdmin Approved & Live'
                      : activeCentre.approvalStatus === 'rejected'
                      ? '✗ Rejected by Regulator'
                      : '⏳ Pending Regulatory Review'}
                  </span>

                  <button
                    onClick={handleStartEditCentre}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Edit facility coordinates & address on map"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Location on Map</span>
                  </button>

                  <button
                    onClick={handleStartNewRegistration}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    + Register Another Centre
                  </button>
                </div>
              </div>

              {/* Centre Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 space-y-2 border border-slate-100">
                  <h4 className="font-bold text-slate-900 text-xs">Facility Regulatory Details</h4>
                  <p><strong>License Number:</strong> <span className="font-mono text-slate-800">{activeCentre.licenseNumber || 'Verified Hub'}</span></p>
                  <p><strong>Facility Type:</strong> {activeCentre.centreType}</p>
                  <p><strong>Operating Hours:</strong> {activeCentre.operatingHours}</p>
                  <p><strong>Compliance Rating:</strong> {activeCentre.rating || 4.8} / 5.0</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 space-y-2 border border-slate-100">
                  <h4 className="font-bold text-slate-900 text-xs">Contact & Geolocation</h4>
                  <p><strong>Address:</strong> {activeCentre.address}, {activeCentre.city} - {activeCentre.pincode}</p>
                  <p className="flex items-center gap-2">
                    <strong>GPS Coordinates:</strong>
                    <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {activeCentre.lat}, {activeCentre.lng}
                    </span>
                  </p>
                  <p><strong>Phone:</strong> {activeCentre.phone}</p>
                  <p><strong>Email:</strong> {activeCentre.email}</p>
                </div>
              </div>

              {/* Certifications & Accepted Categories */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                <h4 className="font-bold text-slate-900 text-xs">Accepted Equipment Categories</h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeCentre.acceptedCategories.map((cat) => (
                    <span key={cat} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700 capitalize text-[11px]">
                      {cat.replace('_', ' ')}
                    </span>
                  ))}
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  {activeCentre.isCertifiedR2 && (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      R2v3 Certified Recycler
                    </span>
                  )}
                  {activeCentre.isHazardousBatteryCertified && (
                    <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      Hazardous Battery Certified
                    </span>
                  )}
                </div>
              </div>

              {activeCentre.verificationNotes && (
                <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-950 space-y-1">
                  <span className="font-bold uppercase text-[10px] text-sky-800">SuperAdmin Regulatory Notes:</span>
                  <p>{activeCentre.verificationNotes}</p>
                </div>
              )}
            </div>
          ) : (
            /* Add or Edit Centre Form with Embedded Interactive Leaflet Location Map */
            <form onSubmit={handleSubmitCentre} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-sky-600" />
                    {isEditingCentre && activeCentre
                      ? `Edit Centre Location & Details: ${activeCentre.name}`
                      : 'Register New E-Waste Collection Centre'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Saves directly to Supabase collection_centres table. Position your facility's exact GPS location on the map below.
                  </p>
                </div>
                {activeCentre && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingCentre(false);
                      setFormErrors({});
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Facility / Centre Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={centreName}
                    onChange={(e) => setCentreName(e.target.value)}
                    placeholder="e.g. EcoLoop Metro Recovery Facility"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-hidden transition ${
                      formErrors.centreName ? 'border-rose-400 bg-rose-50' : 'border-slate-200 focus:border-sky-600 focus:bg-white'
                    }`}
                  />
                  {formErrors.centreName && <p className="text-[10px] text-rose-500 mt-1">{formErrors.centreName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Operating Organization
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. EcoLoop Facility Partner"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-sky-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Facility Type
                  </label>
                  <select
                    value={centreType}
                    onChange={(e) => setCentreType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-sky-600 focus:bg-white transition"
                  >
                    <option value="Certified Recycler">Certified Recycler</option>
                    <option value="Drop-off Kiosk">Drop-off Kiosk</option>
                    <option value="Brand Take-Back">Brand Take-Back Hub</option>
                    <option value="Municipal Hub">Municipal Hub</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Environmental License Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. EPA-RCRA-2026-981 / PCB-TN-EW-041"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-hidden font-mono uppercase transition ${
                      formErrors.licenseNumber ? 'border-rose-400 bg-rose-50' : 'border-slate-200 focus:border-sky-600 focus:bg-white'
                    }`}
                  />
                  {formErrors.licenseNumber && (
                    <p className="text-[10px] text-rose-500 mt-1">{formErrors.licenseNumber}</p>
                  )}
                </div>
              </div>

              {/* Physical Location & Address */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  Physical Location Details & Map Pin Picker
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Street Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street number, industrial estate, avenue"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-sky-600 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Chennai"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-sky-600 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pincode <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="600001"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-sky-600 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* ============================================================== */}
                {/* EMBEDDED LEAFLET INTERACTIVE LOCATION MAP PICKER */}
                {/* ============================================================== */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Crosshair className="w-4 h-4 text-sky-600" />
                        Pin Exact Facility GPS Coordinates on Map
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Click anywhere on the map or drag the pin to set your centre's physical coordinates for dispatch routing.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleUseLocation}
                      className="px-3 py-1.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Auto-Detect My GPS</span>
                    </button>
                  </div>

                  {/* Leaflet Map Canvas */}
                  <div
                    ref={mapContainerRef}
                    className="w-full h-72 rounded-xl border border-slate-300 overflow-hidden shadow-inner relative z-0"
                  />

                  {/* Coordinates Status Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Latitude</label>
                      <input
                        type="text"
                        value={lat}
                        onChange={(e) => {
                          setLat(e.target.value);
                          const num = parseFloat(e.target.value);
                          if (!isNaN(num) && mapInstanceRef.current && markerRef.current) {
                            markerRef.current.setLatLng([num, parseFloat(lng) || 0]);
                            mapInstanceRef.current.panTo([num, parseFloat(lng) || 0]);
                          }
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-hidden focus:border-sky-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Longitude</label>
                      <input
                        type="text"
                        value={lng}
                        onChange={(e) => {
                          setLng(e.target.value);
                          const num = parseFloat(e.target.value);
                          if (!isNaN(num) && mapInstanceRef.current && markerRef.current) {
                            markerRef.current.setLatLng([parseFloat(lat) || 0, num]);
                            mapInstanceRef.current.panTo([parseFloat(lat) || 0, num]);
                          }
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-hidden focus:border-sky-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact info & Operating Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-sky-600 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="centre@cleancircular.org"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-sky-600 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(e.target.value)}
                    placeholder="Mon-Sat: 09:00 AM - 06:00 PM"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-sky-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Accepted Equipment Categories */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700">
                  Accepted E-Waste Categories <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORY_CHOICES.map((choice) => {
                    const isSelected = selectedCategories.includes(choice.id);
                    return (
                      <button
                        type="button"
                        key={choice.id}
                        onClick={() => toggleCategory(choice.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-sky-50 border-sky-500 text-sky-900'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>{choice.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Certifications */}
              <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCertifiedR2}
                    onChange={(e) => setIsCertifiedR2(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span className="font-semibold text-slate-700">R2v3 Certified Electronics Recycler</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHazardousBatteryCertified}
                    onChange={(e) => setIsHazardousBatteryCertified(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span className="font-semibold text-slate-700">Hazardous Li-ion Battery Isolation Certified</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                {activeCentre && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingCentre(false);
                      setFormErrors({});
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Saving to Supabase...'
                      : isEditingCentre && activeCentre
                      ? 'Update Centre & Map Coordinates'
                      : 'Register Centre in Supabase'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. PICKUP REQUESTS DISPATCH DESK */}
      {/* ============================================================== */}
      {activeSubTab === 'pickups' && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-600" />
                Customer Pickup Requests
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  {assignedRequests.length} Live Records
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real customer pickup requests stored in Supabase. Status changes update PostgreSQL and record audit logs.
              </p>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-hidden"
              >
                <option value="all">All Statuses ({assignedRequests.length})</option>
                <option value="submitted">Submitted ({assignedRequests.filter((r) => r.status === 'submitted').length})</option>
                <option value="confirmed">Confirmed ({assignedRequests.filter((r) => r.status === 'confirmed').length})</option>
                <option value="collected">Collected ({assignedRequests.filter((r) => r.status === 'collected').length})</option>
                <option value="recycled">Recycled ({assignedRequests.filter((r) => r.status === 'recycled').length})</option>
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by Request ID, customer name, device or city..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded-xl text-xs text-slate-800 outline-hidden transition"
            />
          </div>

          {filteredRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Request ID</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Device & Qty</th>
                    <th className="py-3 px-3">Pickup Address</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Dispatch Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-3 font-mono font-bold text-sky-800">
                        {req.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{req.userName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{req.contactNumber}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{req.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 capitalize">
                          {req.deviceName || req.category.replace('_', ' ')}
                        </div>
                        <div className="text-[10px] text-slate-500 capitalize">
                          {req.quantity} unit(s) • {req.condition}
                        </div>
                        {req.hasBatteryHazard && (
                          <span className="inline-block mt-0.5 text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded uppercase">
                            Hazardous Swollen Cell
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-800">{req.address}, {req.city} ({req.pincode})</div>
                        <div className="text-[10px] text-slate-400">
                          {req.preferredDate} • {req.preferredTimeSlot}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            req.status === 'recycled'
                              ? 'bg-teal-100 text-teal-800'
                              : req.status === 'collected'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                        {req.pointsAwarded && (
                          <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">
                            +{req.pointsEarned} EcoPoints
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap space-x-1">
                        {req.status === 'submitted' && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(req.id, 'confirmed', 'Courier dispatched by facility admin')
                            }
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition cursor-pointer shadow-2xs"
                          >
                            Confirm Dispatch
                          </button>
                        )}
                        {req.status === 'confirmed' && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(req.id, 'collected', 'Picked up & handed to recovery facility')
                            }
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition cursor-pointer shadow-2xs"
                          >
                            Mark Collected (+Points)
                          </button>
                        )}
                        {req.status === 'collected' && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(req.id, 'recycled', 'Material dismantling & certified extraction completed')
                            }
                            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] transition cursor-pointer shadow-2xs"
                          >
                            Mark Recycled
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setTrackedRequestId(req.id);
                            setActiveTab('track_request');
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium transition cursor-pointer"
                        >
                          Audit Log
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Inbox className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No pickup requests yet.</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'No database records match your active search filter.'
                  : 'Customer pickup requests booked for your centre will automatically appear here via Supabase Realtime.'}
              </p>
              {(searchQuery || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. PICKUP SCHEDULE */}
      {/* ============================================================== */}
      {activeSubTab === 'schedule' && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Actual Pickup Schedule ({scheduledCollections.length})
              </h3>
              <p className="text-xs text-slate-500">
                Scheduled customer pickup appointments organized chronologically by preferred date.
              </p>
            </div>
          </div>

          {scheduledCollections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scheduledCollections.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="font-mono font-bold text-xs text-slate-900 block">{req.id}</span>
                      <h4 className="font-bold text-sm text-slate-900">{req.userName}</h4>
                      <p className="text-[11px] text-slate-500">{req.contactNumber}</p>
                    </div>

                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs">
                        {req.preferredDate}
                      </span>
                      <span className="block text-[10px] text-slate-500 font-medium capitalize mt-0.5">
                        Slot: {req.preferredTimeSlot}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{req.deviceName || req.category.replace('_', ' ')}</span>
                      <span>Qty: {req.quantity}</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Address: {req.address}, {req.city} ({req.pincode})
                    </p>
                    {req.additionalInstructions && (
                      <p className="text-slate-600 text-[11px] italic">Note: "{req.additionalInstructions}"</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        req.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.status === 'confirmed' ? 'Courier Assigned' : 'Awaiting Confirmation'}
                    </span>

                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          req.id,
                          req.status === 'submitted' ? 'confirmed' : 'collected',
                          'Status advanced from pickup schedule desk'
                        )
                      }
                      className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-[10px] transition cursor-pointer"
                    >
                      {req.status === 'submitted' ? 'Confirm Appointment' : 'Mark Completed'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <CalendarX className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No collections scheduled.</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active pickup appointments are currently queued on your facility dispatch calendar.
              </p>
              <button
                onClick={() => switchSubTab('pickups')}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                View Pickup Requests Queue
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. E-WASTE INVENTORY */}
      {/* ============================================================== */}
      {activeSubTab === 'inventory' && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-sky-600" />
                Verified E-Waste Facility Inventory ({inventoryItems.length} Lots)
              </h3>
              <p className="text-xs text-slate-500">
                Genuinely recorded electronic items collected and processed at this facility.
              </p>
            </div>

            {inventoryItems.length > 0 && (
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
                Total Units: {kpiStats.inventoryUnits}
              </span>
            )}
          </div>

          {inventoryItems.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-3">Item / Device Description</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Quantity</th>
                      <th className="py-3 px-3">Condition</th>
                      <th className="py-3 px-3">Collection Date</th>
                      <th className="py-3 px-3">CO2 Diverted</th>
                      <th className="py-3 px-3">Origin Request</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventoryItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {item.deviceName || item.category.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-3 capitalize">
                          <span
                            className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold"
                            style={{
                              backgroundColor: `${CATEGORY_COLORS[item.category] || '#64748b'}15`,
                              color: CATEGORY_COLORS[item.category] || '#64748b',
                            }}
                          >
                            {item.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{item.quantity}</td>
                        <td className="py-3 px-3 capitalize text-slate-600">{item.condition}</td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{item.preferredDate}</td>
                        <td className="py-3 px-3 text-emerald-700 font-bold">{item.estimatedCo2SavedKg} kg</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-sky-800">{item.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <PackageOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">Your inventory is currently empty.</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Devices collected and confirmed from customer pickups will appear in your verified facility inventory.
              </p>
              <button
                onClick={() => switchSubTab('pickups')}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Check Pickup Requests
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. COLLECTION HISTORY */}
      {/* ============================================================== */}
      {activeSubTab === 'history' && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-sky-600" />
                Collection & Processing History ({collectionHistory.length} Completed)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Archived chain-of-custody records of all collected and recycled electronic items stored in Supabase.
              </p>
            </div>

            {/* Summary badges */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                {kpiStats.co2SavedKg} kg CO2e Diverted
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-sky-50 text-sky-800 border border-sky-200">
                {kpiStats.inventoryUnits} Units Processed
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              placeholder="Search history by Request ID, customer, device or city..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded-xl text-xs text-slate-800 outline-hidden transition"
            />
          </div>

          {filteredCollectionHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Date Completed</th>
                    <th className="py-3 px-3">Request ID</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Device & Qty</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Impact Diverted</th>
                    <th className="py-3 px-3 text-right">Audit Record</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCollectionHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                        {item.preferredDate}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-sky-800">
                        {item.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{item.userName}</div>
                        <div className="text-[10px] text-slate-400">{item.city}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 capitalize">
                          {item.deviceName || item.category.replace('_', ' ')}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {item.quantity} unit(s) • {item.condition}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'recycled'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.status === 'recycled' ? 'Recycled & Smelted' : 'Collected In-Facility'}
                        </span>
                        {item.pointsAwarded && (
                          <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">
                            +{item.pointsEarned} EcoPoints
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-emerald-700">
                          {item.estimatedCo2SavedKg} kg CO2e
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setTrackedRequestId(item.id);
                            setActiveTab('track_request');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition cursor-pointer"
                        >
                          View Chain of Custody
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <History className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No collection history recorded yet.</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Once customer pickups are marked as collected or recycled, complete chain-of-custody transactions are stored in Supabase and displayed here.
              </p>
              <button
                onClick={() => switchSubTab('pickups')}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Go to Pickup Requests Desk
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. REPORTS & ANALYTICS */}
      {/* ============================================================== */}
      {activeSubTab === 'analytics' && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Real-Time Material Recovery & Processing Analytics
              </h3>
              <p className="text-xs text-slate-500">
                Generated dynamically from genuine database transactions in Supabase.
              </p>
            </div>
          </div>

          {assignedRequests.length > 0 ? (
            <div className="space-y-6">
              {/* Category Breakdown & Status Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    E-Waste Equipment Distribution
                  </h4>
                  {categoryAnalytics.length > 0 ? (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryAnalytics}>
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                            {categoryAnalytics.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-10 text-center">
                      No collected items yet to display equipment breakdown.
                    </p>
                  )}
                </div>

                {/* Status Pipeline Chart */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Dispatch Queue Pipeline Status
                  </h4>
                  <div className="space-y-3 text-xs pt-2">
                    {[
                      { label: 'Submitted (New)', count: kpiStats.pendingAction, color: 'bg-amber-500' },
                      { label: 'Confirmed (Dispatched)', count: kpiStats.dispatched, color: 'bg-blue-500' },
                      {
                        label: 'Collected / In-Facility',
                        count: assignedRequests.filter((r) => r.status === 'collected').length,
                        color: 'bg-emerald-500',
                      },
                      {
                        label: 'Recycled / Smelted',
                        count: assignedRequests.filter((r) => r.status === 'recycled').length,
                        color: 'bg-teal-500',
                      },
                    ].map((row) => (
                      <div key={row.label} className="space-y-1">
                        <div className="flex justify-between font-semibold text-slate-700">
                          <span>{row.label}</span>
                          <span>{row.count} ({kpiStats.total > 0 ? Math.round((row.count / kpiStats.total) * 100) : 0}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full ${row.color} rounded-full transition-all duration-500`}
                            style={{
                              width: `${kpiStats.total > 0 ? (row.count / kpiStats.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Environmental Impact Summary */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-emerald-900">
                    Net Certified Circular Impact
                  </h4>
                  <p className="text-emerald-800">
                    Based on real ITU / EPA WARM factors applied to your verified database inventory.
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">CO2 Diverted</span>
                    <span className="text-xl font-extrabold text-emerald-900">{kpiStats.co2SavedKg} kg</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Units</span>
                    <span className="text-xl font-extrabold text-emerald-900">{kpiStats.inventoryUnits}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <BarChart3 className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No analytics available yet.</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Performance charts and circular recovery analytics will generate automatically as genuine collection transactions are processed.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. NOTIFICATIONS & AUDIT LOGS */}
      {/* ============================================================== */}
      {activeSubTab === 'notifications' && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-sky-600" />
                Operational Notifications & Audit Logs ({auditLogs.length})
              </h3>
              <p className="text-xs text-slate-500">
                Every status update and dispatch modification recorded directly in Supabase request_status_history.
              </p>
            </div>
            <button
              onClick={loadAuditLogs}
              disabled={isLoadingAuditLogs}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAuditLogs ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {auditLogs.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{log.requestId}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 text-slate-700">
                        {log.status}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium">{log.note || 'Status updated'}</p>
                    {log.updatedBy && (
                      <p className="text-[10px] text-slate-400">By: {log.updatedBy}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <BellOff className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No notifications recorded yet.</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                System notifications and immutable request status audit entries will appear here as dispatches occur.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. SETTINGS & SUPPORT */}
      {/* ============================================================== */}
      {activeSubTab === 'settings' && (
        <div className="space-y-6">
          {/* Operational Settings Card */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-sky-600" />
                Facility Operational Settings & Preferences
              </h3>
              <p className="text-xs text-slate-500">
                Centre operating configurations, dispatch radiuses, and regulatory compliance settings.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">Dispatch & Operational Radius</h4>
                <p className="text-slate-600">
                  Operating City: <strong>{activeCentre?.city || 'Unregistered Hub'}</strong>
                </p>
                <p className="text-slate-600">
                  Pickup Service Radius: <strong>25 km Municipal Coverage</strong>
                </p>
                <p className="text-slate-600">
                  Default Working Hours: <strong>{activeCentre?.operatingHours || 'Mon-Sat: 09:00 AM - 06:00 PM'}</strong>
                </p>
                <button
                  onClick={() => {
                    switchSubTab('my_centre');
                    handleStartEditCentre();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer"
                >
                  Edit in My Centre Profile
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">Hazardous Battery Safety Protocol</h4>
                <p className="text-slate-600">
                  Lithium-Ion Fireproof Containment: <strong className="text-emerald-700">Active Protocol</strong>
                </p>
                <p className="text-slate-600">
                  Emergency Hazardous Waste Hotline: <strong>1800-ECO-LOOP (Toll-Free)</strong>
                </p>
                <p className="text-slate-600">
                  R2v3 Chain-of-Custody Logging: <strong className="text-emerald-700">Enabled</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Real-Time Supabase Database Diagnostics Card */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Supabase Real-Time Database Diagnostics
                </h3>
                <p className="text-xs text-slate-500">
                  Live connection health, latency measurement, and PostgreSQL table availability.
                </p>
              </div>

              <span
                className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                  isSupabaseConnected
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                {isSupabaseConnected ? '● PostgreSQL Live Connected' : '○ Offline / Reconnecting'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="font-bold text-slate-800 block">Ping Latency Test</span>
                  <span className="text-[11px] text-slate-500">
                    Verify real-time communication speed with the Supabase PostgreSQL cluster.
                  </span>
                  {pingStatus && (
                    <p className="mt-1 font-mono text-[11px] font-bold text-emerald-700">{pingStatus}</p>
                  )}
                </div>

                <button
                  onClick={handleTestDatabasePing}
                  disabled={isPinging}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                  <span>{isPinging ? 'Pinging...' : 'Test Database Latency'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="font-bold text-slate-800 block">Resynchronize All Tables</span>
                  <span className="text-[11px] text-slate-500">
                    Force an immediate reload of collection centres, pickup requests, and audit logs.
                  </span>
                </div>
                <button
                  onClick={() => reloadFromDatabase()}
                  disabled={isDatabaseLoading}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  Sync Tables
                </button>
              </div>
            </div>
          </div>

          {/* SuperAdmin & Regulatory Support Card */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-600" />
                Regulatory Authority & SuperAdmin Support Desk
              </h3>
              <p className="text-xs text-slate-500">
                Direct official assistance, compliance inquiries, and hazardous equipment emergency coordination.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-purple-950 text-xs">Chief Environmental Auditor</span>
                </div>
                <p className="text-slate-700"><strong>Name:</strong> Dr. Sarah Al-Mansoor</p>
                <p className="text-slate-700"><strong>Office:</strong> Regulatory Certification & Verification</p>
                <p className="text-slate-700"><strong>Official Channel:</strong> <span className="font-mono text-purple-900">regulatory@ecoloop.org</span></p>
                <p className="text-[11px] text-slate-500">
                  Responsible for inspecting your facility's license documents and approving public citizen map visibility.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-600" />
                  <span className="font-bold text-slate-900 text-xs">24/7 Logistics & Technical Helpdesk</span>
                </div>
                <p className="text-slate-700"><strong>Dispatch Desk:</strong> +91 800-432-LOOP</p>
                <p className="text-slate-700"><strong>Support Email:</strong> support@ecoloop.org</p>
                <p className="text-slate-700"><strong>Escalations:</strong> Immediate supervisor dispatch</p>
                <p className="text-[11px] text-slate-500">
                  Contact technical dispatch for courier route adjustments or hardware tracking inquiries.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
