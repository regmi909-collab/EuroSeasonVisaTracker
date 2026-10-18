import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  ExternalLink,
  Building,
  Calendar,
  DollarSign,
  ShieldCheck,
  Send,
  FileSpreadsheet,
  MessageSquare,
  Layers,
  Compass,
  Maximize2,
  Sparkles,
  X,
} from 'lucide-react';
import { JobListing } from '../types';
import { resolveJobCoordinates } from '../utils/geo';

interface JobMapProps {
  jobs: JobListing[];
  onSyncToSheet?: (job: JobListing) => void;
  onSendTelegram?: (job: JobListing) => void;
  isSheetsConnected: boolean;
  isTelegramConnected: boolean;
}

// Category styling config
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; pinBg: string; icon: string }> = {
  'Ski & Snow': {
    bg: 'bg-sky-500/15',
    border: 'border-sky-500/40',
    text: 'text-sky-300',
    pinBg: '#0284c7', // Sky-600
    icon: '❄️',
  },
  'Hospitality & Chalet': {
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/40',
    text: 'text-amber-300',
    pinBg: '#d97706', // Amber-600
    icon: '🏡',
  },
  'Agriculture & Harvesting': {
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    text: 'text-emerald-300',
    pinBg: '#059669', // Emerald-600
    icon: '🍇',
  },
  'Summer Camp & Childcare': {
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/40',
    text: 'text-purple-300',
    pinBg: '#9333ea', // Purple-600
    icon: '🏕️',
  },
  'Tourism & Watersports': {
    bg: 'bg-teal-500/15',
    border: 'border-teal-500/40',
    text: 'text-teal-300',
    pinBg: '#0d9488', // Teal-600
    icon: '🏄',
  },
  'Other': {
    bg: 'bg-slate-500/15',
    border: 'border-slate-500/40',
    text: 'text-slate-300',
    pinBg: '#64748b',
    icon: '💼',
  },
};

export function JobMap({
  jobs,
  onSyncToSheet,
  onSendTelegram,
  isSheetsConnected,
  isTelegramConnected,
}: JobMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeRegion, setActiveRegion] = useState<string>('all');

  // Compute resolved coordinates for every job
  const jobsWithCoords = useMemo(() => {
    return jobs.map((job) => {
      const coords = resolveJobCoordinates(
        job.location,
        job.country,
        job.id,
        job.latitude,
        job.longitude
      );
      return {
        ...job,
        resolvedLat: coords.lat,
        resolvedLng: coords.lng,
      };
    });
  }, [jobs]);

  // Filtered list based on category filter
  const filteredJobs = useMemo(() => {
    if (activeCategory === 'All') return jobsWithCoords;
    return jobsWithCoords.filter((j) => j.category === activeCategory);
  }, [jobsWithCoords, activeCategory]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // European central coordinates
      const map = L.map(mapContainerRef.current, {
        center: [48.0, 11.0],
        zoom: 4.5,
        minZoom: 3,
        maxZoom: 16,
        zoomControl: false,
      });

      // Add high-clarity OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      // Add custom zoom control in top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    // Force map size refresh
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Update map markers when filteredJobs changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    filteredJobs.forEach((job) => {
      const catConfig = CATEGORY_COLORS[job.category] || CATEGORY_COLORS['Other'];
      const isSelected = selectedJob?.id === job.id;

      // Custom HTML Marker Pin
      const pinHtml = `
        <div class="relative group cursor-pointer" style="transform: translate(-50%, -100%);">
          <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg border-2 border-white text-white font-bold transition-transform duration-200 hover:scale-125 ${
            isSelected ? 'scale-125 ring-4 ring-emerald-400' : ''
          }" style="background-color: ${catConfig.pinBg};">
            <span style="font-size: 14px;">${catConfig.icon}</span>
          </div>
          <div class="w-2 h-2 rotate-45 mx-auto -mt-1 shadow-md" style="background-color: ${catConfig.pinBg};"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-job-pin',
        html: pinHtml,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
      });

      const marker = L.marker([job.resolvedLat, job.resolvedLng], {
        icon: customIcon,
        title: `${job.title} - ${job.company}`,
      });

      // Popup content
      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 230px; max-width: 280px; padding: 4px;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #059669; margin-bottom: 2px;">
            ${job.category} • ${job.country}
          </div>
          <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; line-height: 1.3;">
            ${job.title}
          </h4>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">
            🏢 <strong>${job.company}</strong><br/>
            📍 ${job.location} | 📅 ${job.season}
          </div>
          <div style="font-size: 10px; background-color: #f1f5f9; padding: 4px 6px; border-radius: 6px; color: #1e293b; margin-bottom: 8px;">
            💶 ${job.payAndPerks}
          </div>
          <div style="display: flex; gap: 4px;">
            <a href="${job.applyUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; flex: 1; text-align: center; font-size: 11px; font-weight: 600; background-color: #059669; color: white; padding: 5px 8px; border-radius: 6px; text-decoration: none;">
              Apply Online ↗
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: false,
        offset: [0, -32],
      });

      marker.on('click', () => {
        setSelectedJob(job);
      });

      markersLayer.addLayer(marker);
    });
  }, [filteredJobs, selectedJob]);

  // Jump to specific European regions
  const handleJumpRegion = (region: string) => {
    setActiveRegion(region);
    const map = mapInstanceRef.current;
    if (!map) return;

    switch (region) {
      case 'alps':
        map.flyTo([46.5, 8.5], 7, { duration: 1.2 });
        break;
      case 'mediterranean':
        map.flyTo([38.5, 16.0], 5.5, { duration: 1.2 });
        break;
      case 'nordics':
        map.flyTo([61.5, 8.5], 5.5, { duration: 1.2 });
        break;
      case 'iberia':
        map.flyTo([39.5, -3.5], 6, { duration: 1.2 });
        break;
      default:
        map.flyTo([48.0, 11.0], 4.5, { duration: 1.2 });
        break;
    }
  };

  const handleSelectJobCard = (job: JobListing & { resolvedLat: number; resolvedLng: number }) => {
    setSelectedJob(job);
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([job.resolvedLat, job.resolvedLng], 9, { duration: 1 });
    }
  };

  return (
    <div className="space-y-4">
      {/* Map Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              European Seasonal Hotspots Map
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                {filteredJobs.length} locations
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Interactive geographic explorer across French Alps, Austrian Tyrol, Balearic Islands, and Norwegian Fjords.
            </p>
          </div>
        </div>

        {/* Quick Regional Focus Jump Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Regions:</span>
          <button
            onClick={() => handleJumpRegion('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              activeRegion === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Europe
          </button>
          <button
            onClick={() => handleJumpRegion('alps')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              activeRegion === 'alps'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            ❄️ Alps & Ski
          </button>
          <button
            onClick={() => handleJumpRegion('mediterranean')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              activeRegion === 'mediterranean'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🏖️ Mediterranean
          </button>
          <button
            onClick={() => handleJumpRegion('nordics')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              activeRegion === 'nordics'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🍓 Nordics & Fjords
          </button>
          <button
            onClick={() => handleJumpRegion('iberia')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              activeRegion === 'iberia'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            ☀️ Spain & Portugal
          </button>
        </div>
      </div>

      {/* Category Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setActiveCategory('All')}
          className={`px-3 py-1 rounded-full font-medium transition shrink-0 ${
            activeCategory === 'All'
              ? 'bg-slate-100 text-slate-900 font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Categories ({jobsWithCoords.length})
        </button>
        {Object.keys(CATEGORY_COLORS).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition shrink-0 ${
              activeCategory === cat
                ? `${CATEGORY_COLORS[cat].bg} ${CATEGORY_COLORS[cat].text} ${CATEGORY_COLORS[cat].border} border font-bold`
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>{CATEGORY_COLORS[cat].icon}</span>
            <span>{cat}</span>
          </button>
        ))}
      </div>

      {/* Map & Detail Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Leaflet Map Container */}
        <div className="lg:col-span-2 relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl h-[520px] sm:h-[580px]">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Map legend overlay */}
          <div className="absolute bottom-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 shadow-xl text-[11px] text-slate-300 space-y-1 hidden sm:block">
            <div className="font-bold text-white text-[11px] flex items-center gap-1 mb-1">
              <Layers className="w-3 h-3 text-emerald-400" />
              <span>Map Legend</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>Ski & Snow Resorts</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Chalet & Hospitality</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Agriculture & Harvesting</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span>Watersports & Coast</span>
            </div>
          </div>
        </div>

        {/* Selected Job Card Side Panel / Quick Sidebar List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between h-[520px] sm:h-[580px] overflow-hidden">
          {selectedJob ? (
            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {selectedJob.category}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5 leading-snug">
                    {selectedJob.title}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedJob.company}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Location & Season */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>{selectedJob.country}</strong> • {selectedJob.location}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>{selectedJob.season}</span>
                </div>
              </div>

              {/* Perks highlight */}
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs text-slate-200">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-300 mb-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Pay & Perks</span>
                </div>
                <p className="leading-relaxed">{selectedJob.payAndPerks}</p>
              </div>

              {/* Visa Sponsorship */}
              <div className="text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {selectedJob.visaSponsorship}
                </span>
              </div>

              {/* Description */}
              {selectedJob.description && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">About the Role</span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedJob.description}
                  </p>
                </div>
              )}

              {/* Requirements */}
              {selectedJob.requirements && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Requirements</span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {selectedJob.requirements}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <a
                  href={selectedJob.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition"
                >
                  <span>Apply Directly Online</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <div className="flex items-center gap-2">
                  {onSyncToSheet && (
                    <button
                      onClick={() => onSyncToSheet(selectedJob)}
                      disabled={!isSheetsConnected}
                      title={!isSheetsConnected ? 'Connect Google Sheet first' : 'Sync to Google Sheet'}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sync to Sheet</span>
                    </button>
                  )}

                  {onSendTelegram && (
                    <button
                      onClick={() => onSendTelegram(selectedJob)}
                      disabled={!isTelegramConnected}
                      title={!isTelegramConnected ? 'Configure Telegram bot first' : 'Send to Telegram'}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
                    >
                      <Send className="w-3.5 h-3.5 text-sky-400" />
                      <span>Telegram Alert</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select a Location on Map ({filteredJobs.length} listed)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click any pin on the map or select a vacancy below to center and view details:
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1">
                {filteredJobs.map((j) => (
                  <div
                    key={j.id}
                    onClick={() => handleSelectJobCard(j)}
                    className="p-3 bg-slate-800/40 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-emerald-400">
                        {j.country} • {j.category}
                      </span>
                      <span className="text-[10px] text-slate-500">{j.season}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition truncate">
                      {j.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {j.company} — {j.location}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
