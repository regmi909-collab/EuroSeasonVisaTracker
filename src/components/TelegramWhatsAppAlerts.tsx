import { useState } from 'react';
import {
  Send,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Phone,
  Sliders,
  Check,
} from 'lucide-react';
import { TelegramConfig, WhatsAppConfig, JobListing } from '../types';

interface TelegramWhatsAppAlertsProps {
  telegramConfig: TelegramConfig;
  setTelegramConfig: React.Dispatch<React.SetStateAction<TelegramConfig>>;
  whatsAppConfig: WhatsAppConfig;
  setWhatsAppConfig: React.Dispatch<React.SetStateAction<WhatsAppConfig>>;
  jobs: JobListing[];
  onDispatchTelegram: (options: { asDigest: boolean; jobs?: JobListing[] }) => Promise<void>;
  isSendingTelegram: boolean;
}

export function TelegramWhatsAppAlerts({
  telegramConfig,
  setTelegramConfig,
  whatsAppConfig,
  setWhatsAppConfig,
  jobs,
  onDispatchTelegram,
  isSendingTelegram,
}: TelegramWhatsAppAlertsProps) {
  const [showToken, setShowToken] = useState(false);
  const [isTestingTg, setIsTestingTg] = useState(false);
  const [tgTestResult, setTgTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [whatsAppPhone, setWhatsAppPhone] = useState(whatsAppConfig.phoneNumber || '');
  const [callMeBotKey, setCallMeBotKey] = useState(whatsAppConfig.apiKey || '');
  const [copiedSample, setCopiedSample] = useState(false);

  // Test Telegram Bot API
  const handleTestTelegram = async () => {
    if (!telegramConfig.botToken || !telegramConfig.chatId) {
      setTgTestResult({
        success: false,
        message: 'Please fill in both Bot Token and Chat ID before testing.',
      });
      return;
    }

    setIsTestingTg(true);
    setTgTestResult(null);

    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: telegramConfig.botToken.trim(),
          chatId: telegramConfig.chatId.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Connection failed');
      }

      setTelegramConfig((prev) => ({
        ...prev,
        connected: true,
        botUsername: data.botUsername,
      }));

      setTgTestResult({
        success: true,
        message: `Success! Connected to @${data.botUsername || data.botName}. Test notification sent to chat.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTgTestResult({
        success: false,
        message: msg,
      });
    } finally {
      setIsTestingTg(false);
    }
  };

  // WhatsApp click-to-chat preview for top job
  const previewJob = jobs[0] || {
    title: 'Ski Chalet Host & Cook',
    company: 'Alpine Elements',
    country: 'France',
    location: "Val d'Isère",
    season: 'Winter 2026/2027',
    visaSponsorship: 'Visa Sponsored & UK/EU Eligible',
    payAndPerks: '€2,100/mo + Private Room + Ski Pass',
    applyUrl: 'https://example.com/apply',
  };

  const sampleWhatsAppText =
    `🇪🇺 *European Seasonal Job Alert*\n\n` +
    `💼 *${previewJob.title}*\n` +
    `🏢 *Company:* ${previewJob.company}\n` +
    `📍 *Location:* ${previewJob.country} (${previewJob.location})\n` +
    `📅 *Season:* ${previewJob.season}\n` +
    `💶 *Perks:* ${previewJob.payAndPerks}\n` +
    `🛂 *Visa:* ${previewJob.visaSponsorship}\n\n` +
    `🔗 Apply: ${previewJob.applyUrl}`;

  const copySampleText = () => {
    navigator.clipboard.writeText(sampleWhatsAppText);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Telegram Configuration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-2xl border border-sky-500/20">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Telegram Bot Alerts</h3>
                {telegramConfig.connected ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                    <CheckCircle2 className="w-3 h-3" /> Connected (@{telegramConfig.botUsername || 'bot'})
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Not Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Receive instant formatted cards for newly discovered seasonal vacancies directly in your Telegram chat or channel.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDispatchTelegram({ asDigest: false })}
              disabled={!telegramConfig.botToken || !telegramConfig.chatId || isSendingTelegram || jobs.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/20 transition"
            >
              {isSendingTelegram ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Dispatching...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send Top 5 to Telegram
                </>
              )}
            </button>
          </div>
        </div>

        {/* Telegram Credentials Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Telegram Bot Token</span>
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:text-sky-300 text-[11px] flex items-center gap-1 font-normal"
              >
                Get via @BotFather <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                value={telegramConfig.botToken}
                onChange={(e) =>
                  setTelegramConfig((prev) => ({ ...prev, botToken: e.target.value, connected: false }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono pr-10 focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Telegram Chat ID / Channel ID</span>
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:text-sky-300 text-[11px] flex items-center gap-1 font-normal"
              >
                Find via @userinfobot <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </label>
            <input
              type="text"
              placeholder="e.g. 987654321 or -1001234567890"
              value={telegramConfig.chatId}
              onChange={(e) =>
                setTelegramConfig((prev) => ({ ...prev, chatId: e.target.value, connected: false }))
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Telegram Test Button & Result */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <button
              onClick={handleTestTelegram}
              disabled={isTestingTg || !telegramConfig.botToken || !telegramConfig.chatId}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              {isTestingTg ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Verifying Bot Connection...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                  Test Telegram Ping
                </>
              )}
            </button>
            <span className="text-[11px] text-slate-400">
              Sends an immediate verification ping message to your chat.
            </span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={telegramConfig.autoSendNew}
              onChange={(e) =>
                setTelegramConfig((prev) => ({ ...prev, autoSendNew: e.target.checked }))
              }
              className="w-4 h-4 text-sky-600 bg-slate-800 border-slate-700 rounded focus:ring-sky-500"
            />
            <span>Auto-alert new discoveries during scrapes</span>
          </label>
        </div>

        {tgTestResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              tgTestResult.success
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            {tgTestResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span>{tgTestResult.message}</span>
          </div>
        )}

        {/* Telegram Quick Setup Walkthrough */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/60 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <HelpCircle className="w-4 h-4 text-sky-400" />
            <span>30-Second Telegram Bot Setup</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed">
            <li>
              Open Telegram and search for <strong className="text-slate-300">@BotFather</strong>. Send <code className="text-sky-300">/newbot</code> and follow the prompts to name your bot. Copy the generated API Token.
            </li>
            <li>
              Start a chat with your new bot and press <strong className="text-slate-300">/start</strong> (or add it to your channel as an administrator).
            </li>
            <li>
              Open <strong className="text-slate-300">@userinfobot</strong> to see your numeric <code className="text-sky-300">Id</code>, paste it into Chat ID above, and click &quot;Test Telegram Ping&quot;.
            </li>
          </ol>
        </div>
      </div>

      {/* WhatsApp Configuration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">WhatsApp Seasonal Alerts</h3>
            <p className="text-xs text-slate-400">
              One-click instant dispatch to contacts or groups, plus optional CallMeBot and Twilio webhook integration.
            </p>
          </div>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setWhatsAppConfig((prev) => ({ ...prev, mode: 'click_to_chat' }))}
            className={`p-3 rounded-xl border text-left transition ${
              whatsAppConfig.mode === 'click_to_chat'
                ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
            }`}
          >
            <div className="text-xs font-bold text-white mb-0.5">Instant Click-to-Chat</div>
            <div className="text-[11px] text-slate-400">Zero setup. Opens WhatsApp Web/App prefilled with job cards.</div>
          </button>

          <button
            onClick={() => setWhatsAppConfig((prev) => ({ ...prev, mode: 'callmebot' }))}
            className={`p-3 rounded-xl border text-left transition ${
              whatsAppConfig.mode === 'callmebot'
                ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
            }`}
          >
            <div className="text-xs font-bold text-white mb-0.5">CallMeBot Free API</div>
            <div className="text-[11px] text-slate-400">Free personal WhatsApp alerts without Business API fees.</div>
          </button>

          <button
            onClick={() => setWhatsAppConfig((prev) => ({ ...prev, mode: 'twilio' }))}
            className={`p-3 rounded-xl border text-left transition ${
              whatsAppConfig.mode === 'twilio'
                ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
            }`}
          >
            <div className="text-xs font-bold text-white mb-0.5">Twilio WhatsApp</div>
            <div className="text-[11px] text-slate-400">Full webhook automation via official Meta/Twilio credentials.</div>
          </button>
        </div>

        {/* WhatsApp Preview & One-Click Trigger */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Live WhatsApp Message Template</span>
              <button
                onClick={copySampleText}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
              >
                {copiedSample ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSample ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-teal-300 whitespace-pre-wrap leading-relaxed shadow-inner">
              {sampleWhatsAppText}
            </div>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(sampleWhatsAppText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/20 transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Open in WhatsApp Web / App</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>

          {/* Configuration form for CallMeBot / Twilio */}
          <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
            {whatsAppConfig.mode === 'callmebot' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-white">CallMeBot Configuration</div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Phone Number (with Country Code)</label>
                  <input
                    type="text"
                    placeholder="+33612345678"
                    value={whatsAppPhone}
                    onChange={(e) => setWhatsAppPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">CallMeBot API Key</label>
                  <input
                    type="password"
                    placeholder="API Key from CallMeBot"
                    value={callMeBotKey}
                    onChange={(e) => setCallMeBotKey(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <button
                  onClick={() =>
                    setWhatsAppConfig((prev) => ({
                      ...prev,
                      phoneNumber: whatsAppPhone,
                      apiKey: callMeBotKey,
                      connected: true,
                    }))
                  }
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-600 transition"
                >
                  Save CallMeBot Settings
                </button>
              </div>
            )}

            {whatsAppConfig.mode === 'twilio' && (
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-white">Twilio WhatsApp Configuration</div>
                <input
                  type="text"
                  placeholder="Twilio Account SID (AC...)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                />
                <input
                  type="password"
                  placeholder="Twilio Auth Token"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                />
                <input
                  type="text"
                  placeholder="From: whatsapp:+14155238886"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                />
                <input
                  type="text"
                  placeholder="To: whatsapp:+YOURNUMBER"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                />
                <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-600 transition">
                  Save Twilio Credentials
                </button>
              </div>
            )}

            {whatsAppConfig.mode === 'click_to_chat' && (
              <div className="space-y-2 text-xs text-slate-300">
                <div className="font-bold text-white">Instant WhatsApp Sharing Enabled</div>
                <p className="text-slate-400 leading-relaxed">
                  No API key or external approval required! You can click any job&apos;s WhatsApp icon or the button on the left to immediately send rich markdown job cards to yourself, your friends, or seasonal worker group chats.
                </p>
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Direct Web & Mobile WhatsApp links active
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
