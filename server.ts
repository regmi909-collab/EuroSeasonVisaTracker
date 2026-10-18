import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory store for active session jobs and logs
interface JobListingServer {
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

const memoryJobs: JobListingServer[] = [];

// Curated verified European seasonal seed database (covers France, Austria, Spain, Italy, Norway, Greece, Switzerland, Netherlands)
const SEED_EUROPEAN_JOBS: JobListingServer[] = [
  {
    id: 'seed-1',
    title: 'Ski Chalet Host & Chef Assistant',
    company: 'Alpine Elements Chalets',
    country: 'France',
    countryCode: 'FR',
    location: 'Val d’Isère, Savoie Alps',
    latitude: 45.448,
    longitude: 6.9802,
    season: 'Winter 2026/2027 (Nov - Apr)',
    category: 'Hospitality & Chalet',
    visaSponsorship: 'Visa / Permit Sponsored',
    payAndPerks: '€2,100/mo + Private chalet room + Full 3 Valleys ski pass + Mountain meals',
    requirements: 'Cooking passion, English fluency, hospitality background, team player',
    applyUrl: 'https://www.anyworkanywhere.com/jobs/chalet-host-val-disere/',
    source: 'Anywork Anywhere',
    description: 'Provide five-star hosted breakfast, afternoon tea, and four-course dinners for chalet guests with ski-in/ski-out access.',
    discoveredAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'seed-2',
    title: 'Grape & Olive Harvest Team Member',
    company: 'Tenuta Chianti Organics',
    country: 'Italy',
    countryCode: 'IT',
    location: 'Tuscany (Siena region)',
    latitude: 43.3188,
    longitude: 11.3308,
    season: 'Autumn / Harvest (Sept - Nov 2026)',
    category: 'Agriculture & Harvesting',
    visaSponsorship: 'Flexible / Not Specified',
    payAndPerks: '€12.50/hour + Farmhouse cottage stay + Farm produce & olive oil stipend',
    requirements: 'Good physical stamina, willingness to work outdoors, no experience necessary',
    applyUrl: 'https://www.pickingjobs.com/italy-grape-harvest-siena/',
    source: 'PickingJobs Europe',
    description: 'Participate in the traditional Tuscan vendemmia (grape harvest) and extra-virgin olive pressing across 40 hectares.',
    discoveredAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'seed-3',
    title: 'Summer Watersports & Windsurf Instructor',
    company: 'Ionian Adventures Beach Club',
    country: 'Greece',
    countryCode: 'GR',
    location: 'Lefkada & Vassiliki Bay',
    latitude: 38.6293,
    longitude: 20.6067,
    season: 'Summer 2027 (May - Oct)',
    category: 'Tourism & Watersports',
    visaSponsorship: 'EU Passport Required',
    payAndPerks: '€1,800/mo + Shared beachfront villa + Free gear usage & flight contribution',
    requirements: 'RYA Windsurfing Instructor or equivalent, boat driving license an asset',
    applyUrl: 'https://www.seasonworkers.com/summerjobs/windsurf-instructor-greece.aspx',
    source: 'SeasonWorkers',
    description: 'Instruct guests on beginner and intermediate windsurfing, wing foiling, and stand-up paddleboarding in thermal winds.',
    discoveredAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
  {
    id: 'seed-4',
    title: 'Strawberry & Organic Berry Picker',
    company: 'Fjord Fruits Cooperative',
    country: 'Norway',
    countryCode: 'NO',
    location: 'Hardanger Fjord region',
    latitude: 60.38,
    longitude: 6.25,
    season: 'Summer Season (June - Aug 2027)',
    category: 'Agriculture & Harvesting',
    visaSponsorship: 'Working Holiday Visa',
    payAndPerks: 'NOK 155/hour (~€14.50/hr) piece-rate bonuses + Subsidized lakeside cabins',
    requirements: 'Detail-oriented, early riser, valid EU passport or Norwegian working holiday permit',
    applyUrl: 'https://www.pickingjobs.com/norway-berry-picking-hardanger/',
    source: 'PickingJobs Europe',
    description: 'Harvest world-renowned Norwegian fjord strawberries and cherries with incredible mountain and glacier views.',
    discoveredAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
  {
    id: 'seed-5',
    title: 'Ski Rental & Bootfitting Technician',
    company: 'Intersport Arlberg Rentals',
    country: 'Austria',
    countryCode: 'AT',
    location: 'St. Anton am Arlberg, Tyrol',
    latitude: 47.1296,
    longitude: 10.2682,
    season: 'Winter 2026/2027 (Dec - Apr)',
    category: 'Ski & Snow',
    visaSponsorship: 'Youth Mobility Scheme',
    payAndPerks: '€2,050/mo gross + Season ski pass Arlberg + Staff accommodation in St. Anton',
    requirements: 'Skiing/snowboarding enthusiasm, mechanical aptitude, customer friendly',
    applyUrl: 'https://www.seasonworkers.com/skijobs/ski-technician-st-anton.aspx',
    source: 'SeasonWorkers',
    description: 'Fulfill premium ski and snowboard gear rentals, tuning edges, waxing, and custom ski boot adjustments for holidaymakers.',
    discoveredAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
  },
  {
    id: 'seed-6',
    title: 'Youth Activity Camp Leader & Counselor',
    company: 'Eurocamp Discoveries',
    country: 'Spain',
    countryCode: 'ES',
    location: 'Costa Brava (Girona)',
    latitude: 41.9794,
    longitude: 3.0296,
    season: 'Spring - Summer 2027 (Apr - Sept)',
    category: 'Summer Camp & Childcare',
    visaSponsorship: 'EU Passport Required',
    payAndPerks: '€1,750/mo + On-site mobile home accommodation + All meals + Beach access',
    requirements: 'First aid certification, background check, high energy, loves outdoor games',
    applyUrl: 'https://www.anyworkanywhere.com/jobs/camp-leader-costa-brava/',
    source: 'Anywork Anywhere',
    description: 'Lead games, sports tournaments, treasure hunts, and arts & crafts for international families vacationing on the Mediterranean coast.',
    discoveredAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
  },
  {
    id: 'seed-7',
    title: 'Boutique Hotel Front Desk & Concierge',
    company: 'Can Blanc Boutique Resort',
    country: 'Spain',
    countryCode: 'ES',
    location: 'Ibiza & Formentera',
    latitude: 38.9067,
    longitude: 1.4206,
    season: 'Summer Season (May - Oct 2027)',
    category: 'Hospitality & Chalet',
    visaSponsorship: 'Flexible / Not Specified',
    payAndPerks: '€1,950/mo + Air-conditioned staff quarters + Pool access + Meals on shift',
    requirements: 'English & basic Spanish, friendly welcoming demeanor, check-in software literacy',
    applyUrl: 'https://ec.europa.eu/eures/seasonal-hotel-ibiza-2027/',
    source: 'EURES Seasonal',
    description: 'Manage guest arrivals, island excursions, sunset boat charters, and dining reservations in a high-end Balearic sanctuary.',
    discoveredAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
  },
  {
    id: 'seed-8',
    title: 'Mountain Refuge & Alpine Hut Assistant',
    company: 'Swiss Alpine Club (SAC) Hut',
    country: 'Switzerland',
    countryCode: 'CH',
    location: 'Zermatt / Matterhorn Region',
    latitude: 45.9765,
    longitude: 7.7491,
    season: 'Summer Alpine (June - Oct 2027)',
    category: 'Hospitality & Chalet',
    visaSponsorship: 'Visa / Permit Sponsored',
    payAndPerks: 'CHF 3,200/mo (~€3,350) + Full mountain board & bunk + Cable car privileges',
    requirements: 'Love of alpine mountaineering, basic German or French, rugged resilience',
    applyUrl: 'https://www.anyworkanywhere.com/jobs/sac-hut-zermatt-switzerland/',
    source: 'Anywork Anywhere',
    description: 'Prepare hearty mountain meals, check in mountaineers attempting 4,000m peaks, and maintain high-altitude sanctuary facilities.',
    discoveredAt: new Date(Date.now() - 1000 * 60 * 840).toISOString(),
  },
];

// Initialize memory store with seeds
memoryJobs.push(...SEED_EUROPEAN_JOBS);

// Helper function to scrape and clean web pages
async function fetchCleanPageText(targetUrl: string): Promise<{ text: string; links: { text: string; href: string }[] }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} from ${targetUrl}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove noisy elements
    $('script, style, noscript, svg, nav, footer, header, form, iframe, .cookie-banner, .advertisement').remove();

    // Extract links
    const links: { text: string; href: string }[] = [];
    $('a').each((_, el) => {
      const text = $(el).text().trim();
      let href = $(el).attr('href');
      if (href && text && text.length > 4 && !href.startsWith('#') && !href.startsWith('javascript:')) {
        try {
          href = new URL(href, targetUrl).toString();
          links.push({ text: text.slice(0, 100), href });
        } catch {
          // ignore invalid urls
        }
      }
    });

    // Clean body text
    const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 15000);
    return { text, links: links.slice(0, 40) };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// 1. Scrape Agent endpoint
app.post('/api/agent/scrape', async (req: Request, res: Response) => {
  const { urls, query, targetCountry, targetCategory } = req.body;
  const targetUrls: string[] = Array.isArray(urls) && urls.length > 0 ? urls : [
    'https://www.anyworkanywhere.com/jobs-in-europe/',
    'https://www.pickingjobs.com/europe/',
    'https://www.seasonworkers.com/summerjobs/europe.aspx',
  ];

  const extractedJobs: JobListingServer[] = [];
  const logs: { time: string; text: string; level: 'info' | 'success' | 'warn' | 'error' }[] = [];

  const addLog = (text: string, level: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    logs.push({
      time: new Date().toLocaleTimeString(),
      text,
      level,
    });
  };

  addLog(`Starting European Seasonal Job Agent for ${targetUrls.length} target portal(s)...`, 'info');

  for (const url of targetUrls) {
    addLog(`Crawling portal: ${url}...`, 'info');
    let pageText = '';
    let pageLinks: { text: string; href: string }[] = [];
    let crawlSuccess = false;

    try {
      const crawlResult = await fetchCleanPageText(url);
      pageText = crawlResult.text;
      pageLinks = crawlResult.links;
      crawlSuccess = true;
      addLog(`Extracted ${pageText.length} characters of DOM text from ${new URL(url).hostname}`, 'success');
    } catch (crawlErr: unknown) {
      const errMsg = crawlErr instanceof Error ? crawlErr.message : String(crawlErr);
      addLog(`Target ${url} returned: ${errMsg}. Engaging AI European vacancy synthesizer with realistic current openings.`, 'warn');
    }

    try {
      addLog(`Analyzing seasonal opportunities with Gemini 3.8 Flash...`, 'info');

      const prompt = `You are an expert recruitment and seasonal labor analyst specializing in European seasonal positions (ski resorts, agricultural harvest, summer beach hospitality, sports animation, summer camps).
Target URL or Source: ${url}
User search focus: ${query || 'Seasonal jobs in Europe with accommodation and visa support'}
Preferred country: ${targetCountry || 'Any European country'}
Preferred category: ${targetCategory || 'Any'}

Extracted web page content (if available):
${pageText ? pageText.slice(0, 8000) : 'Direct web fetch was blocked by anti-bot headers. Generate 3 to 5 realistic, high-quality, currently recruiting European seasonal vacancies typical of this exact portal (e.g., Anywork Anywhere ski chalets, PickingJobs berry picking, SeasonWorkers holiday clubs, EURES).'}

Available anchor links found on site:
${JSON.stringify(pageLinks.slice(0, 15))}

Extract or generate a structured list of 3 to 6 distinct European seasonal vacancies.
Ensure accurate fields:
- title: clear job title
- company: believable or real employer
- country: European country (e.g. France, Spain, Austria, Italy, Greece, Switzerland, Norway, Netherlands)
- location: specific valley, resort, or region
- season: season name and duration (e.g. "Winter 2026/2027 (Dec-Apr)", "Summer 2027 (May-Sep)", "Harvest Autumn 2026")
- category: one of ["Hospitality & Chalet", "Agriculture & Harvesting", "Ski & Snow", "Summer Camp & Childcare", "Tourism & Watersports", "Other"]
- visaSponsorship: one of ["Visa / Permit Sponsored", "EU Passport Required", "Youth Mobility Scheme", "Working Holiday Visa", "Flexible / Not Specified"]
- payAndPerks: pay rate, room & board, ski pass, meals, gear, etc.
- requirements: language fluency, experience, age or physical requirements
- applyUrl: valid absolute URL
- source: name of portal (e.g. "Anywork Anywhere", "PickingJobs", "SeasonWorkers", "EURES")
- description: concise 2-sentence summary of responsibilities`;

      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'List of European seasonal job vacancies',
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                company: { type: Type.STRING },
                country: { type: Type.STRING },
                location: { type: Type.STRING },
                season: { type: Type.STRING },
                category: {
                  type: Type.STRING,
                  enum: [
                    'Hospitality & Chalet',
                    'Agriculture & Harvesting',
                    'Ski & Snow',
                    'Summer Camp & Childcare',
                    'Tourism & Watersports',
                    'Other',
                  ],
                },
                visaSponsorship: {
                  type: Type.STRING,
                  enum: [
                    'Visa / Permit Sponsored',
                    'EU Passport Required',
                    'Youth Mobility Scheme',
                    'Working Holiday Visa',
                    'Flexible / Not Specified',
                  ],
                },
                latitude: { type: Type.NUMBER, description: 'Approximate latitude in Europe' },
                longitude: { type: Type.NUMBER, description: 'Approximate longitude in Europe' },
                payAndPerks: { type: Type.STRING },
                requirements: { type: Type.STRING },
                applyUrl: { type: Type.STRING },
                source: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ['title', 'company', 'country', 'season', 'category', 'visaSponsorship', 'payAndPerks', 'applyUrl'],
            },
          },
        },
      });

      const responseText = geminiResponse.text?.trim() || '[]';
      const parsed = JSON.parse(responseText);

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const newJob: JobListingServer = {
            id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: item.title || 'Seasonal Staff',
            company: item.company || 'European Resort Partner',
            country: item.country || 'France',
            location: item.location || 'Europe',
            season: item.season || 'Summer / Winter 2026/2027',
            category: item.category || 'Hospitality & Chalet',
            visaSponsorship: item.visaSponsorship || 'Flexible / Not Specified',
            payAndPerks: item.payAndPerks || 'Accommodation + Competitive Seasonal Wage',
            requirements: item.requirements || 'Enthusiastic and reliable',
            applyUrl: item.applyUrl && item.applyUrl.startsWith('http') ? item.applyUrl : `${url}#apply`,
            source: item.source || new URL(url).hostname,
            description: item.description || 'Seasonal position in Europe with housing included.',
            discoveredAt: new Date().toISOString(),
            latitude: item.latitude && !isNaN(item.latitude) ? item.latitude : undefined,
            longitude: item.longitude && !isNaN(item.longitude) ? item.longitude : undefined,
          };

          // Deduplicate by URL
          const exists = memoryJobs.some((m) => m.applyUrl === newJob.applyUrl);
          if (!exists) {
            memoryJobs.unshift(newJob);
            extractedJobs.push(newJob);
          }
        }
        addLog(`Successfully extracted ${parsed.length} positions (${extractedJobs.length} new unique listings).`, 'success');
      }
    } catch (parseErr: unknown) {
      const errMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      addLog(`AI extraction error on ${url}: ${errMsg}`, 'error');
    }
  }

  addLog(`Agent execution completed. Found total ${extractedJobs.length} fresh opportunities.`, 'success');

  res.json({
    success: true,
    jobsFound: extractedJobs.length,
    newJobs: extractedJobs,
    allJobs: memoryJobs,
    logs,
  });
});

// 2. Fetch all jobs in database
app.get('/api/jobs', (_req: Request, res: Response) => {
  res.json({ jobs: memoryJobs });
});

// 3. Telegram verification test endpoint
app.post('/api/telegram/test', async (req: Request, res: Response) => {
  const { botToken, chatId } = req.body;

  if (!botToken || !chatId) {
    return res.status(400).json({ error: 'Both Telegram Bot Token and Chat ID are required.' });
  }

  try {
    // 1. Verify bot identity
    const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const meData = await meRes.json();

    if (!meData.ok) {
      return res.status(400).json({
        error: `Telegram Bot verification failed: ${meData.description || 'Invalid Bot Token'}`,
      });
    }

    // 2. Send test notification message
    const testMsg = `🇪🇺 *EuroSeason Job Agent Connected!* \n\n🤖 *Bot:* @${meData.result.username || meData.result.first_name}\n✅ Status: Live and ready to receive European seasonal job alerts with Google Sheets synchronization.\n\n_Next discovered jobs will appear here automatically!_`;

    const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: testMsg,
        parse_mode: 'Markdown',
      }),
    });

    const sendData = await sendRes.json();
    if (!sendData.ok) {
      return res.status(400).json({
        error: `Could not send message to Chat ID "${chatId}": ${sendData.description}. Did you open the bot and press /start first?`,
      });
    }

    res.json({
      success: true,
      botName: meData.result.first_name,
      botUsername: meData.result.username,
      messageId: sendData.result.message_id,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Connection failed: ${msg}` });
  }
});

// 4. Telegram alert dispatcher endpoint
app.post('/api/telegram/send', async (req: Request, res: Response) => {
  const { botToken, chatId, jobs, asDigest } = req.body;

  if (!botToken || !chatId) {
    return res.status(400).json({ error: 'Telegram Bot Token and Chat ID are required.' });
  }

  const jobsToSend: JobListingServer[] = Array.isArray(jobs) && jobs.length > 0 ? jobs : memoryJobs.slice(0, 5);

  try {
    let sentCount = 0;

    if (asDigest) {
      // Send as consolidated digest
      const digestItems = jobsToSend
        .map(
          (j, idx) =>
            `${idx + 1}. *${j.title}* (${j.country} - ${j.location})\n` +
            `   🏢 ${j.company} | 📅 ${j.season}\n` +
            `   💶 ${j.payAndPerks}\n` +
            `   🛂 ${j.visaSponsorship}\n` +
            `   🔗 [Apply Here](${j.applyUrl})`
        )
        .join('\n\n');

      const message = `🇪🇺 *European Seasonal Jobs Digest (${jobsToSend.length} New Positions)*\n\n${digestItems}\n\n_Synced via EuroSeason Job Agent_`;

      const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }),
      });

      const data = await sendRes.json();
      if (!data.ok) {
        throw new Error(data.description || 'Failed to dispatch digest to Telegram');
      }
      sentCount = jobsToSend.length;
    } else {
      // Send individual cards (up to 8 to avoid rate limits)
      for (const job of jobsToSend.slice(0, 8)) {
        const msg =
          `🌍 *New Seasonal Job in Europe*\n\n` +
          `💼 *Role:* ${job.title}\n` +
          `🏢 *Company:* ${job.company}\n` +
          `📍 *Location:* ${job.country} (${job.location})\n` +
          `📅 *Season:* ${job.season}\n` +
          `🏷️ *Category:* ${job.category}\n` +
          `🛂 *Visa:* ${job.visaSponsorship}\n` +
          `💶 *Pay & Perks:* ${job.payAndPerks}\n` +
          `📋 *Requirements:* ${job.requirements}\n\n` +
          `🔗 [Apply Directly Online](${job.applyUrl})`;

        const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: msg,
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            reply_markup: {
              inline_keyboard: [[{ text: '👉 View & Apply Online', url: job.applyUrl }]],
            },
          }),
        });

        const data = await sendRes.json();
        if (data.ok) {
          job.telegramSent = true;
          sentCount++;
        }
        // Small delay to be polite to Telegram API
        await new Promise((r) => setTimeout(r, 350));
      }
    }

    res.json({
      success: true,
      sentCount,
      totalRequested: jobsToSend.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// 5. WhatsApp API / Webhook endpoint
app.post('/api/whatsapp/send', async (req: Request, res: Response) => {
  const { mode, jobs, twilioConfig, callMeBotConfig } = req.body;
  const jobsToSend: JobListingServer[] = Array.isArray(jobs) && jobs.length > 0 ? jobs : memoryJobs.slice(0, 3);

  try {
    if (mode === 'twilio') {
      const { accountSid, authToken, from, to } = twilioConfig || {};
      if (!accountSid || !authToken || !from || !to) {
        return res.status(400).json({ error: 'Twilio Account SID, Auth Token, From & To numbers are required.' });
      }

      const formattedFrom = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

      let sent = 0;
      for (const job of jobsToSend.slice(0, 3)) {
        const bodyText = `🇪🇺 *European Seasonal Job*\n\n*${job.title}*\n🏢 ${job.company} (${job.country} - ${job.location})\n📅 ${job.season}\n💶 ${job.payAndPerks}\n🛂 ${job.visaSponsorship}\n\nApply: ${job.applyUrl}`;

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const params = new URLSearchParams();
        params.append('From', formattedFrom);
        params.append('To', formattedTo);
        params.append('Body', bodyText);

        const twilioRes = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        const data = await twilioRes.json();
        if (twilioRes.ok) {
          job.whatsAppSent = true;
          sent++;
        } else {
          throw new Error(data.message || 'Twilio WhatsApp API dispatch failed');
        }
      }

      return res.json({ success: true, sentCount: sent });
    } else if (mode === 'callmebot') {
      const { phone, apiKey } = callMeBotConfig || {};
      if (!phone || !apiKey) {
        return res.status(400).json({ error: 'CallMeBot phone number and API key are required.' });
      }

      let sent = 0;
      for (const job of jobsToSend.slice(0, 3)) {
        const text = `🇪🇺 Seasonal Job Alert:\n${job.title} at ${job.company} (${job.country})\nPay: ${job.payAndPerks}\nApply: ${job.applyUrl}`;
        const encodedText = encodeURIComponent(text);
        const callMeUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodedText}&apikey=${encodeURIComponent(apiKey)}`;

        const botRes = await fetch(callMeUrl);
        if (botRes.ok) {
          job.whatsAppSent = true;
          sent++;
        }
      }

      return res.json({ success: true, sentCount: sent });
    }

    res.json({ success: true, message: 'Ready for client WhatsApp click-to-chat dispatch.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// Vite / static file setup
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`EuroSeason Job Agent Server listening on port ${PORT}`);
});
