import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CollectionCentre, DeviceCategory } from '../../types';
import {
  MapPin,
  Search,
  Filter,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Navigation,
  ExternalLink,
  Flame,
  CheckCircle2,
  Sparkles,
  Info,
  ShieldAlert,
  Building2,
} from 'lucide-react';
import L from 'leaflet';

const CATEGORY_FILTER_OPTIONS: { id: DeviceCategory; label: string }[] = [
  { id: 'mobile', label: 'Mobile' },
  { id: 'laptop', label: 'Laptop' },
  { id: 'desktop', label: 'Desktop' },
  { id: 'battery', label: 'Battery' },
  { id: 'charger_cable', label: 'Cables & Adapters' },
  { id: 'home_appliance', label: 'Appliances' },
];

export const CentreLocator: React.FC = () => {
  const {
    approvedCentres,
    pendingCentres,
    preselectedCategory,
    setPreselectedCategory,
    activeRole,
    switchRole,
    setActiveTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategory | 'all'>(
    preselectedCategory || 'all'
  );
  const [onlyHazardCertified, setOnlyHazardCertified] = useState(false);
  const [selectedCentre, setSelectedCentre] = useState<CollectionCentre | null>(
    approvedCentres[0] || null
  );

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Clear preselected once mounted
  useEffect(() => {
    if (preselectedCategory) {
      setSelectedCategory(preselectedCategory);
      setPreselectedCategory(null);
    }
  }, [preselectedCategory, setPreselectedCategory]);

  // Only verified, approved centres are shown on the citizen map to protect against fake hubs!
  const filteredCentres = approvedCentres.filter((centre) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      centre.name.toLowerCase().includes(q) ||
      centre.city.toLowerCase().includes(q) ||
      centre.pincode.toLowerCase().includes(q) ||
      centre.address.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === 'all' || centre.acceptedCategories.includes(selectedCategory);

    const matchesHazard = !onlyHazardCertified || centre.isHazardousBatteryCertified;

    return matchesSearch && matchesCategory && matchesHazard;
  });

  // Initialize & Update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [37.7749, -122.4194],
        zoom: 11,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;

    if (markersGroup) {
      markersGroup.clearLayers();

      filteredCentres.forEach((centre) => {
        const isSelected = selectedCentre?.id === centre.id;

        const iconHtml = `
          <div style="
            background: ${isSelected ? '#047857' : '#059669'};
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
          ">
            ♻
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-eco-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        const marker = L.marker([centre.lat, centre.lng], { icon: customIcon });

        marker.on('click', () => {
          setSelectedCentre(centre);
          map.setView([centre.lat, centre.lng], 13);
        });

        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; padding: 2px; color: #0f172a;">
            <strong style="color: #047857; display: block; font-size: 13px;">${centre.name}</strong>
            <p style="margin: 4px 0 6px; color: #475569;">${centre.address}, ${centre.city}</p>
            <span style="background: #ecfdf5; color: #065f46; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold;">
              ✓ SuperAdmin Verified
            </span>
          </div>
        `);

        markersGroup.addLayer(marker);
      });

      if (filteredCentres.length > 0) {
        const bounds = L.latLngBounds(filteredCentres.map((c) => [c.lat, c.lng]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }
  }, [filteredCentres, selectedCentre]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 13);
          L.circleMarker([latitude, longitude], {
            radius: 8,
            color: '#2563eb',
            fillColor: '#60a5fa',
            fillOpacity: 0.9,
          })
            .addTo(mapInstanceRef.current)
            .bindPopup('Your Current Location')
            .openPopup();
        }
      },
      (err) => {
        console.warn('Location permission dismissed or denied:', err.message);
      }
    );
  };

  const handleCentreCardClick = (centre: CollectionCentre) => {
    setSelectedCentre(centre);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([centre.lat, centre.lng], 14, { animate: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Verified E-Waste Collection Network
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Certified E-Waste Drop-off Locator
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time directory. Only facilities audited & approved by our regulatory SuperAdmin appear below to safeguard citizens from fraudulent collectors.
          </p>
        </div>

        {/* Anti-Fraud Protection Badge */}
        <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-2.5 text-xs text-emerald-950 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <div>
            <span className="font-bold block">100% SuperAdmin Verified</span>
            <span className="text-[10px] text-emerald-700">Fake/Unapproved hubs automatically blocked</span>
          </div>
        </div>
      </div>

      {/* Notice if there are pending centres awaiting SuperAdmin review */}
      {pendingCentres.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>{pendingCentres.length} facility registration(s)</strong> are currently under SuperAdmin regulatory review.
            </span>
          </div>
          {activeRole === 'superadmin' ? (
            <button
              onClick={() => setActiveTab('superadmin_approvals')}
              className="px-3 py-1 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition cursor-pointer self-start sm:self-auto"
            >
              Review in SuperAdmin Portal →
            </button>
          ) : (
            <button
              onClick={() => switchRole('superadmin')}
              className="px-3 py-1 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-xs transition cursor-pointer self-start sm:self-auto"
            >
              Switch to SuperAdmin to Approve →
            </button>
          )}
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search verified hubs by city, area, hub name, or pincode..."
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 outline-hidden transition"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <button
              onClick={handleUseMyLocation}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              <span>Use My Location</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter by:
          </span>

          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Verified Hubs
          </button>

          {CATEGORY_FILTER_OPTIONS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}

          <button
            onClick={() => setOnlyHazardCertified(!onlyHazardCertified)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              onlyHazardCertified
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <Flame className="w-3 h-3" />
            Hazardous Battery Certified
          </button>
        </div>
      </div>

      {/* Main Content Layout: Leaflet Map (Left) + Centre Cards (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Map (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col h-[480px]">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Live Interactive Map (OpenStreetMap)
            </span>
            <span className="text-[10px] text-slate-400">
              {filteredCentres.length} Verified Location{filteredCentres.length === 1 ? '' : 's'}
            </span>
          </div>

          <div ref={mapContainerRef} className="w-full flex-1 z-0" />
        </div>

        {/* Centre Cards List (5 cols) */}
        <div className="lg:col-span-5 space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {filteredCentres.length > 0 ? (
            filteredCentres.map((centre) => {
              const isSelected = selectedCentre?.id === centre.id;
              return (
                <div
                  key={centre.id}
                  onClick={() => handleCentreCardClick(centre)}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                          {centre.name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        {centre.organization} • {centre.centreType}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{centre.address}, {centre.city} - {centre.pincode}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                    <span className="flex items-center gap-1.5 truncate">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{centre.operatingHours}</span>
                    </span>
                    <span className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-mono truncate">{centre.phone}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-slate-100 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                      Lic: {centre.licenseNumber}
                    </span>
                    {centre.isCertifiedR2 && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> R2 / e-Stewards
                      </span>
                    )}
                    {centre.isHazardousBatteryCertified && (
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Hazardous Certified
                      </span>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${centre.name} ${centre.address} ${centre.city}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="ml-auto text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 underline underline-offset-2"
                    >
                      Directions
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            /* Pristine Real-Time Empty State with CTA */
            <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">No Verified E-Waste Centres Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Real-time anti-fraud protection active. An <strong>Admin</strong> must register the facility with its EPA license, then the <strong>SuperAdmin</strong> must review and accept it before it appears here.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => switchRole('admin')}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                >
                  Switch to Admin to Register Centre
                </button>
                {pendingCentres.length > 0 && (
                  <button
                    onClick={() => switchRole('superadmin')}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                  >
                    Switch to SuperAdmin to Approve ({pendingCentres.length})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
