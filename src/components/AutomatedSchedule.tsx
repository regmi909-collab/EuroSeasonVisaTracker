import { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  RefreshCw,
  FileSpreadsheet,
  Send,
  CheckCircle2,
  AlertCircle,
  Activity,
  Trash2,
} from 'lucide-react';
import { AgentScheduleConfig, ScrapeAgentLog } from '../types';

interface AutomatedScheduleProps {
  scheduleConfig: AgentScheduleConfig;
  setScheduleConfig: React.Dispatch<React.SetStateAction<AgentScheduleConfig>>;
  logs: ScrapeAgentLog[];
  onClearLogs: () => void;
  onTriggerNow: () => void;
  isAgentRunning: boolean;
  hasGoogleSheet: boolean;
  hasTelegram: boolean;
}

export function AutomatedSchedule({
  scheduleConfig,
  setScheduleConfig,
  logs,
  onClearLogs,
  onTriggerNow,
  isAgentRunning,
  hasGoogleSheet,
  hasTelegram,
}: AutomatedScheduleProps) {
  const [secondsUntilNext, setSecondsUntilNext] = useState<number>(scheduleConfig.intervalMinutes * 60);

  useEffect(() => {
    if (!scheduleConfig.enabled) return;

    const timer = setInterval(() => {
      setSecondsUntilNext((prev) => {
        if (prev <= 1) {
          onTriggerNow();
          return scheduleConfig.intervalMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [scheduleConfig.enabled, scheduleConfig.intervalMinutes, onTriggerNow]);

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Scheduler Configuration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Autonomous Agent Automation & Schedules</h3>
                {scheduleConfig.enabled ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active Schedule
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Paused
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Keep your European seasonal job sheet and Telegram channel perpetually updated without manual clicking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setScheduleConfig((prev) => ({ ...prev, enabled: !prev.enabled }))
              }
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
                scheduleConfig.enabled
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {scheduleConfig.enabled ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause Schedule
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Enable Autonomous Schedule
                </>
              )}
            </button>
          </div>
        </div>

        {/* Schedule Interval & Countdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/60">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Crawl Frequency
            </label>
            <select
              value={scheduleConfig.intervalMinutes}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setScheduleConfig((prev) => ({ ...prev, intervalMinutes: val }));
                setSecondsUntilNext(val * 60);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value={15}>Every 15 minutes (High frequency)</option>
              <option value={30}>Every 30 minutes</option>
              <option value={60}>Every 1 hour (Recommended)</option>
              <option value={360}>Every 6 hours</option>
              <option value={720}>Every 12 hours</option>
              <option value={1440}>Every 24 hours (Daily digest)</option>
            </select>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400">Next Scheduled Run:</span>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {scheduleConfig.enabled ? formatCountdown(secondsUntilNext) : 'Schedule Paused'}
            </div>
            <span className="text-[10px] text-slate-500">Autonomous crawl timer</span>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400">Immediate Action:</span>
            <button
              onClick={onTriggerNow}
              disabled={isAgentRunning}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 text-xs font-semibold transition disabled:opacity-50"
            >
              {isAgentRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Crawling Now...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Trigger Instant Crawl
                </>
              )}
            </button>
            <span className="text-[10px] text-slate-500">Runs crawl out of sequence</span>
          </div>
        </div>

        {/* Post-Crawl Pipeline Toggles */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <span className="text-xs font-bold text-slate-300">Autonomous Actions Upon Discovery</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/60 cursor-pointer text-xs text-slate-200">
              <input
                type="checkbox"
                checked={scheduleConfig.autoSyncToSheets}
                onChange={(e) =>
                  setScheduleConfig((prev) => ({ ...prev, autoSyncToSheets: e.target.checked }))
                }
                className="w-4 h-4 text-emerald-600 bg-slate-800 border-slate-700 rounded focus:ring-emerald-500"
              />
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Auto-sync to Google Sheet</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/60 cursor-pointer text-xs text-slate-200">
              <input
                type="checkbox"
                checked={scheduleConfig.autoSendTelegram}
                onChange={(e) =>
                  setScheduleConfig((prev) => ({ ...prev, autoSendTelegram: e.target.checked }))
                }
                className="w-4 h-4 text-sky-600 bg-slate-800 border-slate-700 rounded focus:ring-sky-500"
              />
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-400" />
                <span>Auto-alert on Telegram</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/60 cursor-pointer text-xs text-slate-200">
              <input
                type="checkbox"
                checked={scheduleConfig.autoSendWhatsApp}
                onChange={(e) =>
                  setScheduleConfig((prev) => ({ ...prev, autoSendWhatsApp: e.target.checked }))
                }
                className="w-4 h-4 text-teal-600 bg-slate-800 border-slate-700 rounded focus:ring-teal-500"
              />
              <div className="flex items-center gap-2">
                <span>Auto-queue WhatsApp</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Agent Operations Audit History</span>
          </div>
          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear History
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-800/60 border-b border-slate-700/60">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Level</th>
                <th className="py-2.5 px-3">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500 italic">
                    No activity recorded yet. Run the scraper agent or enable a schedule.
                  </td>
                </tr>
              ) : (
                logs.slice(0, 20).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {log.type === 'success' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          SUCCESS
                        </span>
                      )}
                      {log.type === 'error' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          ERROR
                        </span>
                      )}
                      {log.type === 'warning' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          WARN
                        </span>
                      )}
                      {log.type === 'info' && (
                        <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                          INFO
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">{log.message}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
