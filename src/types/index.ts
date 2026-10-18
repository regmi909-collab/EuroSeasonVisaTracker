export interface JobListing {
  id: string;
  title: string;
  company: string;
  country: string;
  countryCode?: string;
  location: string;
  season: string;
  category: 'Hospitality & Chalet' | 'Agriculture & Harvesting' | 'Ski & Snow' | 'Summer Camp & Childcare' | 'Tourism & Watersports' | 'Other';
  visaSponsorship: 'Visa / Permit Sponsored' | 'EU Passport Required' | 'Youth Mobility Scheme' | 'Working Holiday Visa' | 'Flexible / Not Specified';
  payAndPerks: string;
  requirements: string;
  applyUrl: string;
  source: string;
  description: string;
  discoveredAt: string;
  latitude?: number;
  longitude?: number;
  syncedToSheets?: boolean;
  telegramSent?: boolean;
  whatsAppSent?: boolean;
}

export interface ScrapingTarget {
  id: string;
  name: string;
  url: string;
  category: string;
  country: string;
  enabled: boolean;
  description: string;
  status: 'idle' | 'scraping' | 'completed' | 'error';
  lastRun?: string;
  jobsFound?: number;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  autoSendNew: boolean;
  sendAsDigest: boolean;
  connected: boolean;
  botUsername?: string;
}

export interface WhatsAppConfig {
  mode: 'click_to_chat' | 'callmebot' | 'twilio';
  phoneNumber?: string;
  apiKey?: string; // For CallMeBot
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFromNumber?: string;
  twilioToNumber?: string;
  connected: boolean;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  sheetTitle: string;
  tabName: string;
  lastSyncedAt: string | null;
  totalSyncedRows: number;
}

export interface ScrapeAgentLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  source?: string;
  message: string;
}

export interface AgentScheduleConfig {
  enabled: boolean;
  intervalMinutes: number;
  lastRun?: string;
  nextRun?: string;
  autoSyncToSheets: boolean;
  autoSendTelegram: boolean;
  autoSendWhatsApp: boolean;
}
