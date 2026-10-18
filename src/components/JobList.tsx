import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  FileSpreadsheet,
  Send,
  Download,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Sparkles,
  Map,
} from 'lucide-react';
import { JobListing } from '../types';
import { JobCard } from './JobCard';

interface JobListProps {
  jobs: JobListing[];
  onSyncAllToSheet: (jobsToSync: JobListing[]) => void;
  onSendDigestToTelegram: (jobsToSend: JobListing[]) => void;
  onSyncSingleToSheet: (job: JobListing) => void;
  onSendSingleToTelegram: (job: JobListing) => void;
  onSendSingleToWhatsApp: (job: JobListing) => void;
  isSheetsConnected: boolean;
  isTelegramConnected: boolean;
  onSwitchToMap?: () => void;
}

export function JobList({
  jobs,
  onSyncAllToSheet,
  onSendDigestToTelegram,
  onSyncSingleToSheet,
  onSendSingleToTelegram,
  onSendSingleToWhatsApp,
  isSheetsConnected,
  isTelegramConnected,
  onSwitchToMap,
}: JobListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [visaFilter, setVisaFilter] = useState('All');
  const [syncFilter, setSyncFilter] = useState<'All' | 'Synced' | 'Unsynced'>('All');

  // Compute available countries for the filter dropdown
  const countries = useMemo(() => {
    const list = Array.from(new Set(jobs.map((j) => j.country))).sort();
    return ['All', ...list];
  }, [jobs]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchSearch =
        searchTerm === '' ||
        j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.payAndPerks.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.requirements.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCountry = countryFilter === 'All' || j.country === countryFilter;
      const matchCategory = categoryFilter === 'All' || j.category === categoryFilter;
      const matchVisa = visaFilter === 'All' || j.visaSponsorship === visaFilter;

      let matchSync = true;
      if (syncFilter === 'Synced') matchSync = !!j.syncedToSheets;
      if (syncFilter === 'Unsynced') matchSync = !j.syncedToSheets;

      return matchSearch && matchCountry && matchCategory && matchVisa && matchSync;
    });
  }, [jobs, searchTerm, countryFilter, categoryFilter, visaFilter, syncFilter]);

  const unsyncedCount = filteredJobs.filter((j) => !j.syncedToSheets).length;

  const exportCSV = () => {
    if (filteredJobs.length === 0) return;
    const headers = ['Title', 'Company', 'Country', 'Location', 'Season', 'Category', 'Visa', 'Pay & Perks', 'URL', 'Source'];
    const rows = filteredJobs.map((j) => [
      `"${j.title.replace(/"/g, '""')}"`,
      `"${j.company.replace(/"/g, '""')}"`,
      `"${j.country.replace(/"/g, '""')}"`,
      `"${j.location.replace(/"/g, '""')}"`,
      `"${j.season.replace(/"/g, '""')}"`,
      `"${j.category.replace(/"/g, '""')}"`,
      `"${j.visaSponsorship.replace(/"/g, '""')}"`,
      `"${j.payAndPerks.replace(/"/g, '""')}"`,
      `"${j.applyUrl.replace(/"/g, '""')}"`,
      `"${j.source.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `european_seasonal_jobs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredJobs, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `european_seasonal_jobs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by role, resort, ski town, farm, or perks (e.g. 'chalet', 'Chamonix', 'ski pass')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {onSwitchToMap && (
              <button
                onClick={onSwitchToMap}
                title="View positions on European interactive map"
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-500/30 transition shadow-sm"
              >
                <Map className="w-3.5 h-3.5" />
                <span>Map View</span>
              </button>
            )}

            <button
              onClick={() => onSyncAllToSheet(filteredJobs.filter((j) => !j.syncedToSheets))}
              disabled={unsyncedCount === 0 || !isSheetsConnected}
              title={
                !isSheetsConnected
                  ? 'Connect Google Sheets first in Sheets tab'
                  : unsyncedCount === 0
                  ? 'All filtered listings already synced'
                  : 'Sync all new listings to Google Sheet'
              }
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold rounded-xl transition shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Sync New to Sheet ({unsyncedCount})</span>
            </button>

            <button
              onClick={() => onSendDigestToTelegram(filteredJobs)}
              disabled={filteredJobs.length === 0 || !isTelegramConnected}
              title={!isTelegramConnected ? 'Configure Telegram in Alerts tab' : 'Send digest to Telegram'}
              className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold rounded-xl transition shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram Digest</span>
            </button>

            <button
              onClick={exportCSV}
              disabled={filteredJobs.length === 0}
              title="Download as CSV spreadsheet"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Country</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Categories</option>
              <option value="Hospitality & Chalet">Hospitality & Chalet</option>
              <option value="Agriculture & Harvesting">Agriculture & Harvesting</option>
              <option value="Ski & Snow">Ski & Snow</option>
              <option value="Summer Camp & Childcare">Summer Camp & Childcare</option>
              <option value="Tourism & Watersports">Tourism & Watersports</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Visa Eligibility</label>
            <select
              value={visaFilter}
              onChange={(e) => setVisaFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Visa Types</option>
              <option value="Visa / Permit Sponsored">Visa / Permit Sponsored</option>
              <option value="EU Passport Required">EU Passport Required</option>
              <option value="Youth Mobility Scheme">Youth Mobility Scheme</option>
              <option value="Working Holiday Visa">Working Holiday Visa</option>
              <option value="Flexible / Not Specified">Flexible / Not Specified</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Sync Status</label>
            <select
              value={syncFilter}
              onChange={(e) => setSyncFilter(e.target.value as 'All' | 'Synced' | 'Unsynced')}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Jobs</option>
              <option value="Synced">Synced to Sheets</option>
              <option value="Unsynced">Pending Sync</option>
            </select>
          </div>
        </div>

        {/* Counter Summary */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>
            Showing <strong className="text-white">{filteredJobs.length}</strong> of{' '}
            <strong className="text-white">{jobs.length}</strong> discovered seasonal listings
          </span>
          {unsyncedCount > 0 && (
            <span className="text-amber-400 font-medium">
              {unsyncedCount} listing(s) pending Google Sheets sync
            </span>
          )}
        </div>
      </div>

      {/* Grid of Job Cards */}
      {filteredJobs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No seasonal positions match your filters</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Try adjusting your keyword, country, or visa filters, or run the European Scraper Agent to discover fresh listings.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onSyncToSheet={onSyncSingleToSheet}
              onSendTelegram={onSendSingleToTelegram}
              onSendWhatsApp={onSendSingleToWhatsApp}
              isSheetsConnected={isSheetsConnected}
              isTelegramConnected={isTelegramConnected}
            />
          ))}
        </div>
      )}
    </div>
  );
}
