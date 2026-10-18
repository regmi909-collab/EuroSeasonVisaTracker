import { useState } from 'react';
import {
  Compass,
  Play,
  Globe,
  Filter,
  Terminal,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
  Send,
  SlidersHorizontal,
} from 'lucide-react';
import { ScrapingTarget, ScrapeAgentLog } from '../types';

interface AgentRunnerProps {
  onRunAgent: (options: {
    urls: string[];
    query: string;
    country: string;
    category: string;
  }) => Promise<void>;
  isRunning: boolean;
  logs: ScrapeAgentLog[];
  hasGoogleSheet: boolean;
  hasTelegram: boolean;
}

const DEFAULT_TARGETS: ScrapingTarget[] = [
  {
    id: 't-1',
    name: 'Anywork Anywhere Europe',
    url: 'https://www.anyworkanywhere.com/jobs-in-europe/',
    category: 'Chalet, Ski & Summer Resorts',
    country: 'All Europe (France, Austria, Spain, Greece)',
    enabled: true,
    description: 'Premier portal for ski chalets, summer beach clubs, and youth hostels.',
    status: 'idle',
  },
  {
    id: 't-2',
    name: 'PickingJobs Europe',
    url: 'https://www.pickingjobs.com/europe/',
    category: 'Agriculture & Harvest',
    country: 'Spain, France, Italy, Norway, Netherlands',
    enabled: true,
    description: 'Dedicated directory for fruit picking, grape harvest (vendemmia), and organic farms.',
    status: 'idle',
  },
  {
    id: 't-3',
    name: 'SeasonWorkers Europe',
    url: 'https://www.seasonworkers.com/summerjobs/europe.aspx',
    category: 'Hospitality & Sports Camps',
    country: 'France, Greece, Italy, Portugal',
    enabled: true,
    description: 'Ski season reps, watersports, campsite leaders, and holiday parks.',
    status: 'idle',
  },
  {
    id: 't-4',
    name: 'EURES Seasonal Mobility',
    url: 'https://ec.europa.eu/eures/seasonal-jobs/',
    category: 'Cross-Border EU Contracts',
    country: 'European Economic Area',
    enabled: false,
    description: 'Official EU employment mobility network with certified employer verification.',
    status: 'idle',
  },
];

const EUROPEAN_COUNTRIES = [
  'All Europe',
  'France',
  'Austria',
  'Italy',
  'Spain',
  'Switzerland',
  'Norway',
  'Greece',
  'Netherlands',
  'Germany',
  'Portugal',
];

const JOB_CATEGORIES = [
  'All Categories',
  'Hospitality & Chalet',
  'Agriculture & Harvesting',
  'Ski & Snow',
  'Summer Camp & Childcare',
  'Tourism & Watersports',
];

export function AgentRunner({
  onRunAgent,
  isRunning,
  logs,
  hasGoogleSheet,
  hasTelegram,
}: AgentRunnerProps) {
  const [targets, setTargets] = useState<ScrapingTarget[]>(DEFAULT_TARGETS);
  const [customUrl, setCustomUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All Europe');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('Seasonal jobs with accommodation provided');
  const [showAddModal, setShowAddModal] = useState(false);

  const toggleTarget = (id: string) => {
    setTargets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const removeTarget = (id: string) => {
    setTargets((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddCustomTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    let validUrl = customUrl.trim();
    if (!validUrl.startsWith('http')) {
      validUrl = `https://${validUrl}`;
    }

    const newTarget: ScrapingTarget = {
      id: `custom-${Date.now()}`,
      name: customName.trim() || new URL(validUrl).hostname,
      url: validUrl,
      category: selectedCategory === 'All Categories' ? 'General Seasonal' : selectedCategory,
      country: selectedCountry,
      enabled: true,
      description: 'Custom portal added by user',
      status: 'idle',
    };

    setTargets((prev) => [...prev, newTarget]);
    setCustomUrl('');
    setCustomName('');
    setShowAddModal(false);
  };

  const handleLaunch = () => {
    const enabledUrls = targets.filter((t) => t.enabled).map((t) => t.url);
    if (enabledUrls.length === 0) {
      alert('Please select or enable at least one target URL to scrape.');
      return;
    }

    onRunAgent({
      urls: enabledUrls,
      query: searchQuery,
      country: selectedCountry === 'All Europe' ? '' : selectedCountry,
      category: selectedCategory === 'All Categories' ? '' : selectedCategory,
    });
  };

  const enabledCount = targets.filter((t) => t.enabled).length;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            Autonomous Web Scraping & AI Structuring Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Scrape European Seasonal Jobs & Auto-Sync
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Crawls top European portals (chalets, fruit picking, watersports, youth camps), analyzes raw HTML with{' '}
            <strong className="text-emerald-300">Gemini 3.8 Flash</strong> to extract visa sponsorship, salary & room board perks,
            then automatically syncs records to <strong className="text-emerald-300">Google Sheets</strong> and dispatches alerts to{' '}
            <strong className="text-sky-300">Telegram</strong> or <strong className="text-teal-300">WhatsApp</strong>.
          </p>
        </div>

        {/* Integration Status Badges */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Pipelines:</span>
          </div>
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
              hasGoogleSheet
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Google Sheets: {hasGoogleSheet ? 'Active' : 'Not Connected'}</span>
          </div>
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
              hasTelegram
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegram Bot: {hasTelegram ? 'Ready' : 'Configure in Alerts'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <span>WhatsApp: Click-to-Chat / Twilio Ready</span>
          </div>
        </div>
      </div>

      {/* Control Panel: Parameters & Search Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            Agent Parameters & Search Directives
          </div>
          <span className="text-xs text-slate-400">
            {enabledCount} of {targets.length} Target Portals Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Specific Keyword / Focus
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Ski chalet host, olive harvest, windsurf"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Target Country Focus
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {EUROPEAN_COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Job Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {JOB_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Trigger Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            The agent will fetch live HTML, remove noise, parse vacancies with Gemini, and queue new jobs for dispatch.
          </p>
          <button
            onClick={handleLaunch}
            disabled={isRunning || enabledCount === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Agent Crawling Portals...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Agent Scrape ({enabledCount} Portals)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Target Portals Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            Configured European Job Sources
          </h2>
          <button
            onClick={() => setShowAddModal(!showAddModal)}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Custom Portal
          </button>
        </div>

        {showAddModal && (
          <form
            onSubmit={handleAddCustomTarget}
            className="p-4 bg-slate-900 border border-emerald-500/40 rounded-xl space-y-3 animate-in fade-in"
          >
            <h3 className="text-xs font-bold text-white">Add Target Seasonal Portal URL</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Portal Name (e.g. Alps Season Jobs)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="url"
                required
                placeholder="Full URL (e.g. https://example.com/jobs)"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition"
              >
                Add Target
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {targets.map((target) => (
            <div
              key={target.id}
              className={`p-4 rounded-xl border transition ${
                target.enabled
                  ? 'bg-slate-900/90 border-slate-700 hover:border-slate-600'
                  : 'bg-slate-900/40 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={target.enabled}
                    onChange={() => toggleTarget(target.id)}
                    className="mt-1 w-4 h-4 text-emerald-600 bg-slate-800 border-slate-700 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      {target.name}
                      {target.enabled && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </h3>
                    <p className="text-[11px] font-mono text-emerald-400/80 truncate max-w-[280px]">
                      {target.url}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">{target.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                        {target.category}
                      </span>
                      <span className="text-[10px] text-slate-400">{target.country}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeTarget(target.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 transition"
                  title="Remove target"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Agent Terminal Log */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-mono font-semibold">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Agent Execution Telemetry & Crawl Terminal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] text-slate-400 font-mono">
              {isRunning ? 'AGENT BUSY' : 'READY'}
            </span>
          </div>
        </div>

        <div className="p-4 font-mono text-xs max-h-56 overflow-y-auto space-y-1.5 text-slate-300 select-text">
          {logs.length === 0 ? (
            <div className="text-slate-500 italic py-4 text-center">
              Agent ready. Click &quot;Run Agent Scrape&quot; to begin scraping European seasonal job sites.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-500 shrink-0 text-[11px]">[{log.timestamp}]</span>
                {log.type === 'success' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />}
                {log.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />}
                {log.type === 'warning' && <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />}
                {log.type === 'info' && <span className="text-sky-400 shrink-0">ℹ</span>}
                <span
                  className={
                    log.type === 'success'
                      ? 'text-emerald-300'
                      : log.type === 'error'
                      ? 'text-rose-300'
                      : log.type === 'warning'
                      ? 'text-amber-300'
                      : 'text-slate-300'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
