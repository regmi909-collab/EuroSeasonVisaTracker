import { useState } from 'react';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  ExternalLink,
  Plus,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Table,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { GoogleSheetsConfig, JobListing } from '../types';
import { HEADERS } from '../services/googleSheets';

interface GoogleSheetsSyncProps {
  user: User | null;
  config: GoogleSheetsConfig;
  jobs: JobListing[];
  onSignIn: () => void;
  isLoggingIn: boolean;
  onCreateNewSheet: () => Promise<void>;
  onConnectExistingSheet: (idOrUrl: string) => Promise<void>;
  onRequestSync: (jobsToSync: JobListing[]) => void;
  isSyncing: boolean;
}

export function GoogleSheetsSync({
  user,
  config,
  jobs,
  onSignIn,
  isLoggingIn,
  onCreateNewSheet,
  onConnectExistingSheet,
  onRequestSync,
  isSyncing,
}: GoogleSheetsSyncProps) {
  const [existingInput, setExistingInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const unsyncedJobs = jobs.filter((j) => !j.syncedToSheets);
  const syncedJobs = jobs.filter((j) => j.syncedToSheets);

  const handleCreate = async () => {
    setErrorMsg(null);
    setIsCreating(true);
    try {
      await onCreateNewSheet();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsCreating(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingInput.trim()) return;
    setErrorMsg(null);
    setIsVerifying(true);
    try {
      await onConnectExistingSheet(existingInput.trim());
      setExistingInput('');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview & Connection Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Google Sheets Synchronization Hub</h2>
                {config.spreadsheetId ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    No Sheet Linked
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Automatically export and maintain European seasonal job discoveries into your personal Google Sheets spreadsheet with deduplication by URL.
              </p>
            </div>
          </div>

          {/* User Sign-In Action */}
          {!user ? (
            <div className="shrink-0">
              <button
                onClick={onSignIn}
                disabled={isLoggingIn}
                className="flex items-center gap-2.5 px-4 py-2 bg-white text-slate-800 hover:bg-slate-100 font-semibold text-xs rounded-xl shadow-md transition disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Signed in as <strong>{user.email}</strong></span>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* If user not logged in */}
        {!user && (
          <div className="mt-5 p-4 bg-slate-800/50 rounded-xl border border-slate-700/60 text-xs text-slate-300 flex items-center justify-between">
            <span>Sign in with your Google account to grant permission to create and update your seasonal job tracking spreadsheet.</span>
            <button
              onClick={onSignIn}
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline shrink-0 ml-3"
            >
              Sign In Now
            </button>
          </div>
        )}
      </div>

      {/* Spreadsheet Actions: Create New or Connect Existing */}
      {user && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Create Dedicated Sheet */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-white mb-1">
                <Plus className="w-4 h-4 text-emerald-400" />
                Create New Seasonal Tracker Sheet
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Creates a new, beautifully formatted spreadsheet in your Google Drive with frozen headers, pre-configured columns (Title, Employer, Country, Visa, Perks, Apply URL), and ready for automated additions.
              </p>
            </div>

            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Creating Spreadsheet...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  Create European Seasonal Jobs Sheet
                </>
              )}
            </button>
          </div>

          {/* Card 2: Connect Existing Sheet */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-white mb-1">
                <LinkIcon className="w-4 h-4 text-sky-400" />
                Connect Existing Google Sheet
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Already have a spreadsheet? Paste its link or Spreadsheet ID below to append discovered jobs directly to it.
              </p>
            </div>

            <form onSubmit={handleConnect} className="space-y-2">
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/... or Sheet ID"
                value={existingInput}
                onChange={(e) => setExistingInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={isVerifying || !existingInput.trim()}
                className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <span>Link Existing Spreadsheet</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Connected Sheet Information & Sync Controls */}
      {config.spreadsheetId && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                Active Destination Spreadsheet
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">{config.sheetTitle}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Tab: <strong className="text-slate-300">{config.tabName}</strong> • ID: {config.spreadsheetId}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {config.spreadsheetUrl && (
                <a
                  href={config.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
                >
                  <span>Open in Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                </a>
              )}

              <button
                onClick={() => onRequestSync(unsyncedJobs)}
                disabled={unsyncedJobs.length === 0 || isSyncing}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Sync {unsyncedJobs.length} Unsynced Listings
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sync Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <span className="text-slate-400">Total in App:</span>
              <div className="text-lg font-bold text-white mt-0.5">{jobs.length} listings</div>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <span className="text-emerald-400">Synced to Sheet:</span>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">{syncedJobs.length} listings</div>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <span className="text-amber-400">Pending Sync:</span>
              <div className="text-lg font-bold text-amber-400 mt-0.5">{unsyncedJobs.length} listings</div>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <span className="text-slate-400">Last Synced:</span>
              <div className="text-xs font-semibold text-slate-300 mt-1">
                {config.lastSyncedAt ? new Date(config.lastSyncedAt).toLocaleTimeString() : 'Never'}
              </div>
            </div>
          </div>

          {/* Column Structure Reference */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Table className="w-4 h-4 text-emerald-400" />
              <span>Google Sheet Column Schema</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {HEADERS.map((h, i) => (
                <span
                  key={h}
                  className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-md text-[11px] font-mono"
                >
                  <strong className="text-emerald-400 mr-1">{String.fromCharCode(65 + i)}:</strong> {h}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
