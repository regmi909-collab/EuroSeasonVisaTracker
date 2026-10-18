import { JobListing } from '../types';

export interface SheetCreationResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  tabName: string;
}

export const HEADERS = [
  'Job Title',
  'Company / Employer',
  'Country',
  'Location / Region',
  'Season / Dates',
  'Category',
  'Visa Sponsorship',
  'Pay & Perks',
  'Requirements',
  'Application URL',
  'Source Portal',
  'Discovered Date',
];

export async function createSeasonalJobsSpreadsheet(
  accessToken: string,
  customTitle?: string
): Promise<SheetCreationResult> {
  const title = customTitle || `European Seasonal Jobs Tracker ${new Date().getFullYear()}`;
  const tabName = 'Seasonal Jobs';

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: tabName,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: HEADERS.map((h) => ({
                    userEnteredValue: { stringValue: h },
                    userEnteredFormat: {
                      backgroundColor: { red: 0.12, green: 0.16, blue: 0.23 }, // Dark slate
                      textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                      horizontalAlignment: 'CENTER',
                    },
                  })),
                },
              ],
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to create Google Sheet: ${res.statusText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
    tabName,
  };
}

export async function getSpreadsheetDetails(
  accessToken: string,
  spreadsheetId: string
): Promise<{ title: string; sheets: string[]; spreadsheetUrl: string }> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Cannot access spreadsheet: ${res.statusText}`);
  }

  const data = await res.json();
  const sheets = data.sheets?.map((s: { properties?: { title?: string } }) => s.properties?.title || 'Sheet1') || ['Sheet1'];

  return {
    title: data.properties?.title || 'Untitled Spreadsheet',
    sheets,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${cleanId}/edit`,
  };
}

export async function fetchExistingUrlsInSheet(
  accessToken: string,
  spreadsheetId: string,
  tabName: string
): Promise<Set<string>> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const range = encodeURIComponent(`'${tabName}'!J2:J`);

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${range}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      return new Set();
    }

    const data = await res.json();
    const urls = new Set<string>();
    if (data.values && Array.isArray(data.values)) {
      for (const row of data.values) {
        if (row[0] && typeof row[0] === 'string') {
          urls.add(row[0].trim());
        }
      }
    }
    return urls;
  } catch (err) {
    console.warn('Could not read existing URLs for deduplication:', err);
    return new Set();
  }
}

export async function appendJobsToSheet(
  accessToken: string,
  spreadsheetId: string,
  tabName: string,
  jobs: JobListing[]
): Promise<{ addedCount: number; skippedDuplicates: number }> {
  if (jobs.length === 0) {
    return { addedCount: 0, skippedDuplicates: 0 };
  }

  const cleanId = extractSpreadsheetId(spreadsheetId);
  const existingUrls = await fetchExistingUrlsInSheet(accessToken, cleanId, tabName);

  const jobsToAppend = jobs.filter((j) => !existingUrls.has(j.applyUrl.trim()));
  const skippedDuplicates = jobs.length - jobsToAppend.length;

  if (jobsToAppend.length === 0) {
    return { addedCount: 0, skippedDuplicates };
  }

  const rows = jobsToAppend.map((j) => [
    j.title,
    j.company,
    j.country,
    j.location,
    j.season,
    j.category,
    j.visaSponsorship,
    j.payAndPerks,
    j.requirements,
    j.applyUrl,
    j.source,
    j.discoveredAt ? j.discoveredAt.split('T')[0] : new Date().toISOString().split('T')[0],
  ]);

  const range = encodeURIComponent(`'${tabName}'!A:L`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `'${tabName}'!A:L`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to append rows to sheet: ${res.statusText}`);
  }

  return { addedCount: jobsToAppend.length, skippedDuplicates };
}

export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return input.trim();
}
