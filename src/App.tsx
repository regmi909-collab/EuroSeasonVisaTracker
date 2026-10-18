import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/auth';
import {
  createSeasonalJobsSpreadsheet,
  getSpreadsheetDetails,
  appendJobsToSheet,
  extractSpreadsheetId,
} from './services/googleSheets';
import {
  JobListing,
  TelegramConfig,
  WhatsAppConfig,
  GoogleSheetsConfig,
  ScrapeAgentLog,
  AgentScheduleConfig,
} from './types';
import { Navbar } from './components/Navbar';
import { AgentRunner } from './components/AgentRunner';
import { JobList } from './components/JobList';
import { GoogleSheetsSync } from './components/GoogleSheetsSync';
import { TelegramWhatsAppAlerts } from './components/TelegramWhatsAppAlerts';
import { AutomatedSchedule } from './components/AutomatedSchedule';
import { SyncConfirmModal } from './components/SyncConfirmModal';
import { JobMap } from './components/JobMap';

export default function App() {
  const [activeTab, setActiveTab] = useState<'scraper' | 'jobs' | 'map' | 'sheets' | 'alerts' | 'automation'>('scraper');

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Core Jobs & Agent state
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [logs, setLogs] = useState<ScrapeAgentLog[]>([]);

  // Google Sheets state
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() => {
    const saved = localStorage.getItem('euroseason_sheets_config');
    return saved
      ? JSON.parse(saved)
      : {
          spreadsheetId: null,
          spreadsheetUrl: null,
          sheetTitle: 'European Seasonal Jobs Tracker 2026',
          tabName: 'Seasonal Jobs',
          lastSyncedAt: null,
          totalSyncedRows: 0,
        };
  });

  // Telegram state
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(() => {
    const saved = localStorage.getItem('euroseason_tg_config');
    return saved
      ? JSON.parse(saved)
      : {
          botToken: '',
          chatId: '',
          autoSendNew: false,
          sendAsDigest: false,
          connected: false,
        };
  });
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);

  // WhatsApp state
  const [whatsAppConfig, setWhatsAppConfig] = useState<WhatsAppConfig>(() => {
    const saved = localStorage.getItem('euroseason_wa_config');
    return saved
      ? JSON.parse(saved)
      : {
          mode: 'click_to_chat',
          connected: true,
        };
  });

  // Schedule config
  const [scheduleConfig, setScheduleConfig] = useState<AgentScheduleConfig>(() => {
    const saved = localStorage.getItem('euroseason_schedule_config');
    return saved
      ? JSON.parse(saved)
      : {
          enabled: false,
          intervalMinutes: 60,
          autoSyncToSheets: true,
          autoSendTelegram: false,
          autoSendWhatsApp: false,
        };
  });

  // Sync confirmation modal state (MANDATORY per Workspace guidelines for data mutation)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [jobsPendingSync, setJobsPendingSync] = useState<JobListing[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Persist configurations
  useEffect(() => {
    localStorage.setItem('euroseason_sheets_config', JSON.stringify(sheetsConfig));
  }, [sheetsConfig]);

  useEffect(() => {
    localStorage.setItem('euroseason_tg_config', JSON.stringify(telegramConfig));
  }, [telegramConfig]);

  useEffect(() => {
    localStorage.setItem('euroseason_wa_config', JSON.stringify(whatsAppConfig));
  }, [whatsAppConfig]);

  useEffect(() => {
    localStorage.setItem('euroseason_schedule_config', JSON.stringify(scheduleConfig));
  }, [scheduleConfig]);

  // Toast auto-clear
  useEffect(() => {
    if (feedbackToast) {
      const timer = setTimeout(() => setFeedbackToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackToast]);

  // Fetch initial seed jobs from server
  useEffect(() => {
    fetch('/api/jobs')
      .then((res) => res.json())
      .then((data) => {
        if (data.jobs && Array.isArray(data.jobs)) {
          setJobs(data.jobs);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch server jobs:', err);
      });
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const addLog = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const newLog: ScrapeAgentLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    };
    setLogs((prev) => [newLog, ...prev]);
  }, []);

  // Google Sign-In Handler
  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setFeedbackToast({
          type: 'success',
          message: `Connected Google Account: ${res.user.displayName || res.user.email}. Ready for Sheets sync!`,
        });
        addLog(`Google Account authenticated with Google Sheets permissions.`, 'success');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedbackToast({ type: 'error', message: `Sign-in failed: ${msg}` });
      addLog(`Google Sign-in failed: ${msg}`, 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setFeedbackToast({ type: 'info', message: 'Signed out of Google.' });
    addLog('Signed out of Google account.', 'info');
  };

  // Run Scraper Agent Handler
  const handleRunAgent = async (options: {
    urls: string[];
    query: string;
    country: string;
    category: string;
  }) => {
    setIsAgentRunning(true);
    addLog(`Initiating European seasonal job scraper for ${options.urls.length} portal(s)...`, 'info');

    try {
      const res = await fetch('/api/agent/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: options.urls,
          query: options.query,
          targetCountry: options.country,
          targetCategory: options.category,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Agent scrape failed');
      }

      if (data.allJobs && Array.isArray(data.allJobs)) {
        setJobs(data.allJobs);
      }

      if (data.logs && Array.isArray(data.logs)) {
        data.logs.forEach((l: { time: string; text: string; level: 'info' | 'success' | 'warn' | 'error' }) => {
          addLog(l.text, l.level === 'warn' ? 'warning' : l.level);
        });
      }

      setFeedbackToast({
        type: 'success',
        message: `Agent scrape finished! Found ${data.jobsFound} new listings (${data.allJobs?.length} total).`,
      });

      // Auto-dispatch to Telegram if enabled
      if (telegramConfig.connected && telegramConfig.autoSendNew && data.newJobs?.length > 0) {
        handleDispatchTelegram({ asDigest: telegramConfig.sendAsDigest, jobs: data.newJobs });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog(`Agent execution failed: ${msg}`, 'error');
      setFeedbackToast({ type: 'error', message: `Scraper error: ${msg}` });
    } finally {
      setIsAgentRunning(false);
    }
  };

  // Create New Google Sheet
  const handleCreateNewSheet = async () => {
    const token = await getAccessToken();
    if (!token) {
      await handleSignIn();
      return;
    }

    addLog('Creating new European Seasonal Jobs spreadsheet in Google Drive...', 'info');
    const result = await createSeasonalJobsSpreadsheet(token, `European Seasonal Jobs ${new Date().getFullYear()}`);

    setSheetsConfig((prev) => ({
      ...prev,
      spreadsheetId: result.spreadsheetId,
      spreadsheetUrl: result.spreadsheetUrl,
      sheetTitle: result.title,
      tabName: result.tabName,
      lastSyncedAt: new Date().toISOString(),
    }));

    addLog(`Created Google Sheet: "${result.title}" (ID: ${result.spreadsheetId})`, 'success');
    setFeedbackToast({
      type: 'success',
      message: `Created "${result.title}" in your Google Drive!`,
    });
  };

  // Connect Existing Google Sheet
  const handleConnectExistingSheet = async (idOrUrl: string) => {
    const cleanId = extractSpreadsheetId(idOrUrl);
    if (!cleanId) throw new Error('Invalid Google Sheet URL or ID.');

    const token = await getAccessToken();
    if (!token) {
      await handleSignIn();
      return;
    }

    addLog(`Verifying access to spreadsheet ID: ${cleanId}...`, 'info');
    const details = await getSpreadsheetDetails(token, cleanId);

    setSheetsConfig((prev) => ({
      ...prev,
      spreadsheetId: cleanId,
      spreadsheetUrl: details.spreadsheetUrl,
      sheetTitle: details.title,
      tabName: details.sheets[0] || 'Seasonal Jobs',
    }));

    addLog(`Successfully linked spreadsheet "${details.title}" with tab "${details.sheets[0]}"`, 'success');
    setFeedbackToast({
      type: 'success',
      message: `Connected to "${details.title}"!`,
    });
  };

  // Request Sync (Opens mandatory confirmation modal)
  const handleRequestSync = (jobsToSync: JobListing[]) => {
    if (jobsToSync.length === 0) return;

    if (!sheetsConfig.spreadsheetId) {
      setActiveTab('sheets');
      setFeedbackToast({
        type: 'info',
        message: 'Please link or create a Google Sheet first in the Sheets Sync tab.',
      });
      return;
    }

    setJobsPendingSync(jobsToSync);
    setIsConfirmModalOpen(true);
  };

  // Confirm Sync execution (Executes appending after explicit user approval)
  const handleConfirmSync = async () => {
    if (!sheetsConfig.spreadsheetId) return;

    const token = await getAccessToken();
    if (!token) {
      setIsConfirmModalOpen(false);
      await handleSignIn();
      return;
    }

    setIsSyncing(true);
    addLog(`Appending ${jobsPendingSync.length} seasonal jobs to Google Sheet "${sheetsConfig.sheetTitle}"...`, 'info');

    try {
      const result = await appendJobsToSheet(
        token,
        sheetsConfig.spreadsheetId,
        sheetsConfig.tabName,
        jobsPendingSync
      );

      // Mark jobs as synced
      const syncedUrls = new Set(jobsPendingSync.map((j) => j.applyUrl));
      setJobs((prev) =>
        prev.map((j) => (syncedUrls.has(j.applyUrl) ? { ...j, syncedToSheets: true } : j))
      );

      setSheetsConfig((prev) => ({
        ...prev,
        lastSyncedAt: new Date().toISOString(),
        totalSyncedRows: prev.totalSyncedRows + result.addedCount,
      }));

      addLog(
        `Google Sheets sync complete: Appended ${result.addedCount} new rows (${result.skippedDuplicates} duplicates avoided).`,
        'success'
      );
      setFeedbackToast({
        type: 'success',
        message: `Appended ${result.addedCount} jobs to Google Sheet! (${result.skippedDuplicates} duplicates skipped)`,
      });
      setIsConfirmModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog(`Failed to append rows to Google Sheet: ${msg}`, 'error');
      setFeedbackToast({ type: 'error', message: `Sheets sync failed: ${msg}` });
    } finally {
      setIsSyncing(false);
    }
  };

  // Dispatch Telegram Alerts
  const handleDispatchTelegram = async (options: { asDigest: boolean; jobs?: JobListing[] }) => {
    if (!telegramConfig.botToken || !telegramConfig.chatId) {
      setActiveTab('alerts');
      setFeedbackToast({
        type: 'info',
        message: 'Please configure your Telegram Bot Token & Chat ID in the Alerts tab.',
      });
      return;
    }

    setIsSendingTelegram(true);
    const targetJobs = options.jobs || jobs.filter((j) => !j.telegramSent).slice(0, 5);
    addLog(`Dispatching ${targetJobs.length} job alert(s) to Telegram chat ${telegramConfig.chatId}...`, 'info');

    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: telegramConfig.botToken.trim(),
          chatId: telegramConfig.chatId.trim(),
          jobs: targetJobs,
          asDigest: options.asDigest,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch Telegram alerts');
      }

      // Mark as sent
      const sentUrls = new Set(targetJobs.map((j) => j.applyUrl));
      setJobs((prev) =>
        prev.map((j) => (sentUrls.has(j.applyUrl) ? { ...j, telegramSent: true } : j))
      );

      addLog(`Telegram dispatch successful! Sent ${data.sentCount} listing(s).`, 'success');
      setFeedbackToast({
        type: 'success',
        message: `Dispatched ${data.sentCount} seasonal job alert(s) to Telegram!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog(`Telegram dispatch error: ${msg}`, 'error');
      setFeedbackToast({ type: 'error', message: `Telegram error: ${msg}` });
    } finally {
      setIsSendingTelegram(false);
    }
  };

  const syncedJobsCount = jobs.filter((j) => j.syncedToSheets).length;
  const telegramSentCount = jobs.filter((j) => j.telegramSent).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isLoggingIn={isLoggingIn}
        totalJobs={jobs.length}
        syncedJobsCount={syncedJobsCount}
        telegramSentCount={telegramSentCount}
        isAgentRunning={isAgentRunning}
      />

      {/* Floating Feedback Toast */}
      {feedbackToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-in slide-in-from-bottom duration-300">
          <div
            className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md text-xs font-medium flex items-center justify-between gap-3 ${
              feedbackToast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : feedbackToast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-slate-900/90 border-slate-700 text-slate-200'
            }`}
          >
            <span>{feedbackToast.message}</span>
            <button
              onClick={() => setFeedbackToast(null)}
              className="text-slate-400 hover:text-white shrink-0 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'scraper' && (
          <AgentRunner
            onRunAgent={handleRunAgent}
            isRunning={isAgentRunning}
            logs={logs}
            hasGoogleSheet={!!sheetsConfig.spreadsheetId}
            hasTelegram={telegramConfig.connected}
          />
        )}

        {activeTab === 'jobs' && (
          <JobList
            jobs={jobs}
            onSyncAllToSheet={handleRequestSync}
            onSendDigestToTelegram={(target) =>
              handleDispatchTelegram({ asDigest: true, jobs: target })
            }
            onSyncSingleToSheet={(job) => handleRequestSync([job])}
            onSendSingleToTelegram={(job) =>
              handleDispatchTelegram({ asDigest: false, jobs: [job] })
            }
            onSendSingleToWhatsApp={() => {
              setFeedbackToast({
                type: 'info',
                message: 'WhatsApp click-to-chat triggered. Message opened in browser/app.',
              });
            }}
            isSheetsConnected={!!sheetsConfig.spreadsheetId}
            isTelegramConnected={telegramConfig.connected}
            onSwitchToMap={() => setActiveTab('map')}
          />
        )}

        {activeTab === 'map' && (
          <JobMap
            jobs={jobs}
            onSyncToSheet={(job) => handleRequestSync([job])}
            onSendTelegram={(job) =>
              handleDispatchTelegram({ asDigest: false, jobs: [job] })
            }
            isSheetsConnected={!!sheetsConfig.spreadsheetId}
            isTelegramConnected={telegramConfig.connected}
          />
        )}

        {activeTab === 'sheets' && (
          <GoogleSheetsSync
            user={user}
            config={sheetsConfig}
            jobs={jobs}
            onSignIn={handleSignIn}
            isLoggingIn={isLoggingIn}
            onCreateNewSheet={handleCreateNewSheet}
            onConnectExistingSheet={handleConnectExistingSheet}
            onRequestSync={handleRequestSync}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'alerts' && (
          <TelegramWhatsAppAlerts
            telegramConfig={telegramConfig}
            setTelegramConfig={setTelegramConfig}
            whatsAppConfig={whatsAppConfig}
            setWhatsAppConfig={setWhatsAppConfig}
            jobs={jobs}
            onDispatchTelegram={handleDispatchTelegram}
            isSendingTelegram={isSendingTelegram}
          />
        )}

        {activeTab === 'automation' && (
          <AutomatedSchedule
            scheduleConfig={scheduleConfig}
            setScheduleConfig={setScheduleConfig}
            logs={logs}
            onClearLogs={() => setLogs([])}
            onTriggerNow={() =>
              handleRunAgent({
                urls: [
                  'https://www.anyworkanywhere.com/jobs-in-europe/',
                  'https://www.pickingjobs.com/europe/',
                  'https://www.seasonworkers.com/summerjobs/europe.aspx',
                ],
                query: 'Seasonal jobs Europe with accommodation',
                country: '',
                category: '',
              })
            }
            isAgentRunning={isAgentRunning}
            hasGoogleSheet={!!sheetsConfig.spreadsheetId}
            hasTelegram={telegramConfig.connected}
          />
        )}
      </main>

      {/* Mandatory User Confirmation Modal for Google Sheets Mutation */}
      <SyncConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmSync}
        isSyncing={isSyncing}
        jobsToSync={jobsPendingSync}
        sheetTitle={sheetsConfig.sheetTitle}
        spreadsheetId={sheetsConfig.spreadsheetId || ''}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>
          EuroSeason Job Agent • Autonomous Scraping • Google Sheets API • Telegram & WhatsApp Dispatch
        </p>
      </footer>
    </div>
  );
}
