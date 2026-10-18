import { FileSpreadsheet, AlertTriangle, Check, X } from 'lucide-react';
import { JobListing } from '../types';

interface SyncConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSyncing: boolean;
  jobsToSync: JobListing[];
  sheetTitle: string;
  spreadsheetId: string;
}

export function SyncConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isSyncing,
  jobsToSync,
  sheetTitle,
  spreadsheetId,
}: SyncConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Confirm Google Sheets Sync</h3>
              <p className="text-xs text-slate-400">Append data to your personal Google Sheet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSyncing}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 text-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Target Spreadsheet:</span>
            <span className="font-semibold text-slate-200 truncate max-w-[220px]">{sheetTitle}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Spreadsheet ID:</span>
            <span className="font-mono text-slate-300 text-[11px] truncate max-w-[220px]">{spreadsheetId}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-700/40">
            <span>Vacancies to Append:</span>
            <span className="font-bold text-emerald-400 text-sm">{jobsToSync.length} listings</span>
          </div>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Listings preview:</p>
          {jobsToSync.slice(0, 5).map((job) => (
            <div
              key={job.id}
              className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-800 text-xs flex items-center justify-between gap-2"
            >
              <div className="truncate">
                <span className="font-semibold text-white">{job.title}</span>
                <span className="text-slate-400 ml-1.5">({job.company} • {job.country})</span>
              </div>
              <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full shrink-0">
                {job.season}
              </span>
            </div>
          ))}
          {jobsToSync.length > 5 && (
            <p className="text-[11px] text-center text-slate-500 pt-1">
              + {jobsToSync.length - 5} additional listings
            </p>
          )}
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-xs text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <p>
            This action will append new rows to your spreadsheet. Existing job URLs will be automatically deduplicated so no duplicates are created.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSyncing}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSyncing}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition shadow-lg shadow-emerald-600/30 disabled:opacity-50"
          >
            {isSyncing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Syncing with Google...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirm Sync ({jobsToSync.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
