import { useState } from 'react';
import {
  Building,
  MapPin,
  Calendar,
  ExternalLink,
  Send,
  FileSpreadsheet,
  Check,
  Copy,
  ShieldCheck,
  Tag,
  DollarSign,
  MessageSquare,
} from 'lucide-react';
import { JobListing } from '../types';

interface JobCardProps {
  job: JobListing;
  onSyncToSheet?: (job: JobListing) => void;
  onSendTelegram?: (job: JobListing) => void;
  onSendWhatsApp?: (job: JobListing) => void;
  isSheetsConnected: boolean;
  isTelegramConnected: boolean;
}

export function JobCard({
  job,
  onSyncToSheet,
  onSendTelegram,
  onSendWhatsApp,
  isSheetsConnected,
  isTelegramConnected,
}: JobCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `🇪🇺 Seasonal Job: ${job.title} at ${job.company}\n📍 ${job.country} (${job.location})\n📅 ${job.season}\n💶 ${job.payAndPerks}\n🛂 ${job.visaSponsorship}\n🔗 ${job.applyUrl}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Visa badge styling
  const getVisaBadge = (visa: string) => {
    if (visa.includes('Sponsored')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (visa.includes('Passport')) {
      return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    }
    if (visa.includes('Mobility') || visa.includes('Working Holiday')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
    return 'bg-slate-800 text-slate-400 border-slate-700';
  };

  // WhatsApp click-to-chat url
  const whatsAppMessage = encodeURIComponent(
    `🇪🇺 *European Seasonal Job Opportunity*\n\n` +
      `💼 *${job.title}*\n` +
      `🏢 *Company:* ${job.company}\n` +
      `📍 *Location:* ${job.country} - ${job.location}\n` +
      `📅 *Season:* ${job.season}\n` +
      `💶 *Pay & Perks:* ${job.payAndPerks}\n` +
      `🛂 *Visa:* ${job.visaSponsorship}\n\n` +
      `👉 *Apply Online:* ${job.applyUrl}`
  );
  const whatsAppUrl = `https://wa.me/?text=${whatsAppMessage}`;

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all duration-200 flex flex-col justify-between group">
      <div className="space-y-3.5">
        {/* Header: Title, Category, Status badges */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {job.category}
              </span>
              <span className="text-[10px] text-slate-500">via {job.source}</span>
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition leading-snug">
              {job.title}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium text-slate-300">{job.company}</span>
            </p>
          </div>

          {/* Sync indicator */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {job.syncedToSheets ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <FileSpreadsheet className="w-2.5 h-2.5" /> Synced
              </span>
            ) : (
              <span className="text-[10px] text-slate-500">Unsynced</span>
            )}
            {job.telegramSent && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                <Send className="w-2.5 h-2.5" /> Telegram
              </span>
            )}
          </div>
        </div>

        {/* Location & Season */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="flex items-center gap-1.5 text-slate-300 truncate">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">
              <strong>{job.country}</strong> • {job.location}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 truncate">
            <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">{job.season}</span>
          </div>
        </div>

        {/* Pay & Perks highlight */}
        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200 flex items-start gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-emerald-300">Perks:</span> {job.payAndPerks}
          </div>
        </div>

        {/* Visa Sponsorship & Description */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border font-medium ${getVisaBadge(
              job.visaSponsorship
            )}`}
          >
            <ShieldCheck className="w-3 h-3" />
            {job.visaSponsorship}
          </span>
        </div>

        {job.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {job.description}
          </p>
        )}
      </div>

      {/* Action Bar */}
      <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-sm"
        >
          <span>Apply Online</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        <div className="flex items-center gap-1.5">
          {/* WhatsApp Share Link */}
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Share via WhatsApp"
            className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 transition"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </a>

          {/* Telegram Dispatch */}
          {onSendTelegram && (
            <button
              onClick={() => onSendTelegram(job)}
              title={isTelegramConnected ? 'Send alert to Telegram' : 'Configure Telegram bot first'}
              className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Sync to Sheet */}
          {onSyncToSheet && (
            <button
              onClick={() => onSyncToSheet(job)}
              title={isSheetsConnected ? 'Sync to Google Sheet' : 'Connect Google Sheet first'}
              className={`p-1.5 rounded-lg border transition ${
                job.syncedToSheets
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Copy details */}
          <button
            onClick={handleCopy}
            title="Copy job summary"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
