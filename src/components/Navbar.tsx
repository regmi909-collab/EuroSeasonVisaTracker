import { User } from 'firebase/auth';
import { Compass, FileSpreadsheet, Send, Search, Clock, LogOut, CheckCircle2, Map } from 'lucide-react';

interface NavbarProps {
  activeTab: 'scraper' | 'jobs' | 'map' | 'sheets' | 'alerts' | 'automation';
  setActiveTab: (tab: 'scraper' | 'jobs' | 'map' | 'sheets' | 'alerts' | 'automation') => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isLoggingIn: boolean;
  totalJobs: number;
  syncedJobsCount: number;
  telegramSentCount: number;
  isAgentRunning: boolean;
}

export function Navbar({
  activeTab,
  setActiveTab,
  user,
  onSignIn,
  onSignOut,
  isLoggingIn,
  totalJobs,
  syncedJobsCount,
  telegramSentCount,
  isAgentRunning,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-sky-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">EuroSeason</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  AI AGENT
                </span>
                {isAgentRunning && (
                  <span className="flex items-center gap-1 text-[11px] text-amber-400 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Scraping Live
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                European Seasonal Jobs • Google Sheets • Telegram & WhatsApp
              </p>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs">
              <span className="text-slate-400">Found:</span>
              <span className="font-bold text-white">{totalJobs}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">Synced:</span>
              <span className="font-bold text-emerald-400">{syncedJobsCount}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-950/40 border border-sky-800/40 text-xs">
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-sky-300">Alerted:</span>
              <span className="font-bold text-sky-400">{telegramSentCount}</span>
            </div>
          </div>

          {/* User Profile / Google Sign-In */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700 rounded-full py-1 px-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-6 h-6 rounded-full border border-emerald-400/50"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
                    {user.displayName || 'Google User'}
                  </div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Sheets Ready
                  </div>
                </div>
                <button
                  onClick={onSignOut}
                  title="Sign out of Google"
                  className="p-1 text-slate-400 hover:text-rose-400 rounded-full hover:bg-slate-700 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                disabled={isLoggingIn}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-white text-slate-800 hover:bg-slate-100 font-medium text-xs rounded-xl shadow-sm transition disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto py-2 border-t border-slate-800/80 no-scrollbar text-xs">
          <button
            onClick={() => setActiveTab('scraper')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition shrink-0 ${
              activeTab === 'scraper'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Agent Scraper</span>
          </button>

          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition shrink-0 ${
              activeTab === 'jobs'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Discovered Jobs ({totalJobs})</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition shrink-0 ${
              activeTab === 'map'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>European Map View</span>
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition shrink-0 ${
              activeTab === 'sheets'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Google Sheets Sync</span>
            {syncedJobsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px]">
                {syncedJobsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition shrink-0 ${
              activeTab === 'alerts'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegram & WhatsApp Alerts</span>
          </button>

          <button
            onClick={() => setActiveTab('automation')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition shrink-0 ${
              activeTab === 'automation'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Scheduler & Logs</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
