// Geographic coordinates mapping for European seasonal job hubs and fallback centroids

export interface Coordinates {
  lat: number;
  lng: number;
}

const KNOWN_EUROPEAN_LOCATIONS: Record<string, Coordinates> = {
  // Alpine & Ski Resorts (France, Austria, Switzerland, Italy)
  "val d'isère": { lat: 45.4480, lng: 6.9802 },
  "val d’isère": { lat: 45.4480, lng: 6.9802 },
  "tignes": { lat: 45.4697, lng: 6.9075 },
  "chamonix": { lat: 45.9237, lng: 6.8694 },
  "chamonix-mont-blanc": { lat: 45.9237, lng: 6.8694 },
  "val thorens": { lat: 45.2976, lng: 6.5800 },
  "courchevel": { lat: 45.4150, lng: 6.6342 },
  "méribel": { lat: 45.3967, lng: 6.5658 },
  "meribel": { lat: 45.3967, lng: 6.5658 },
  "les deux alpes": { lat: 45.0089, lng: 6.1219 },
  "alpe d'huez": { lat: 45.0928, lng: 6.0694 },
  "morzine": { lat: 46.1792, lng: 6.7089 },
  "avoriaz": { lat: 46.1925, lng: 6.7725 },
  "st. anton": { lat: 47.1296, lng: 10.2682 },
  "st. anton am arlberg": { lat: 47.1296, lng: 10.2682 },
  "kitzbühel": { lat: 47.4464, lng: 12.3922 },
  "kitzbuhel": { lat: 47.4464, lng: 12.3922 },
  "innsbruck": { lat: 47.2692, lng: 11.4041 },
  "sölden": { lat: 46.9655, lng: 11.0076 },
  "soelden": { lat: 46.9655, lng: 11.0076 },
  "mayrhofen": { lat: 47.1683, lng: 11.8633 },
  "zell am see": { lat: 47.3236, lng: 12.7969 },
  "zermatt": { lat: 45.9765, lng: 7.7491 },
  "verbier": { lat: 46.0961, lng: 7.2286 },
  "st. moritz": { lat: 46.4908, lng: 9.8355 },
  "davos": { lat: 46.8027, lng: 9.8360 },
  "interlaken": { lat: 46.6863, lng: 7.8632 },
  "cortina d'ampezzo": { lat: 46.5405, lng: 12.1357 },
  "cortina": { lat: 46.5405, lng: 12.1357 },
  "val gardena": { lat: 46.5564, lng: 11.7247 },
  "cervinia": { lat: 45.9348, lng: 7.6297 },
  "livigno": { lat: 46.5386, lng: 10.1358 },

  // Mediterranean & Coastal Hubs (Spain, Greece, Italy, Portugal)
  "ibiza": { lat: 38.9067, lng: 1.4206 },
  "formentera": { lat: 38.7055, lng: 1.4344 },
  "mallorca": { lat: 39.6953, lng: 3.0176 },
  "palma": { lat: 39.5696, lng: 2.6502 },
  "menorca": { lat: 39.9496, lng: 4.1105 },
  "costa brava": { lat: 41.9794, lng: 3.0296 },
  "girona": { lat: 41.9794, lng: 2.8214 },
  "barcelona": { lat: 41.3851, lng: 2.1734 },
  "costa del sol": { lat: 36.5444, lng: -4.6247 },
  "marbella": { lat: 36.5101, lng: -4.8824 },
  "andalusia": { lat: 37.5443, lng: -4.7278 },
  "tenerife": { lat: 28.2916, lng: -16.6291 },
  "lefkada": { lat: 38.6293, lng: 20.6067 },
  "vassiliki": { lat: 38.6293, lng: 20.6067 },
  "crete": { lat: 35.2401, lng: 24.8093 },
  "chania": { lat: 35.5138, lng: 24.0180 },
  "heraklion": { lat: 35.3387, lng: 25.1442 },
  "santorini": { lat: 36.3932, lng: 25.4615 },
  "rhodes": { lat: 36.4349, lng: 28.2175 },
  "mykonos": { lat: 37.4467, lng: 25.3289 },
  "corfu": { lat: 39.6243, lng: 19.9217 },
  "zakynthos": { lat: 37.7870, lng: 20.8999 },
  "algarve": { lat: 37.0179, lng: -7.9304 },
  "faro": { lat: 37.0194, lng: -7.9304 },
  "lagos": { lat: 37.1028, lng: -8.6730 },
  "ericeira": { lat: 38.9634, lng: -9.4168 },
  "peniche": { lat: 39.3558, lng: -9.3811 },
  "amalfi": { lat: 40.6340, lng: 14.6027 },
  "positano": { lat: 40.6281, lng: 14.4850 },
  "capri": { lat: 40.5507, lng: 14.2426 },
  "sardinia": { lat: 40.1209, lng: 9.0129 },
  "sicily": { lat: 37.5990, lng: 14.0154 },
  "tuscany": { lat: 43.7711, lng: 11.2486 },
  "siena": { lat: 43.3188, lng: 11.3308 },
  "florence": { lat: 43.7696, lng: 11.2558 },

  // Agricultural & Nordic Harvesting Hubs
  "hardanger": { lat: 60.3800, lng: 6.2500 },
  "hardanger fjord": { lat: 60.3800, lng: 6.2500 },
  "lofoten": { lat: 68.2285, lng: 14.5683 },
  "tromsø": { lat: 69.6492, lng: 18.9553 },
  "tromso": { lat: 69.6492, lng: 18.9553 },
  "bergen": { lat: 60.3913, lng: 5.3221 },
  "westland": { lat: 51.9961, lng: 4.2183 },
  "zeeland": { lat: 51.4940, lng: 3.8497 },
  "bordeaux": { lat: 44.8378, lng: -0.5792 },
  "champagne": { lat: 49.0346, lng: 3.9550 },
  "reims": { lat: 49.2583, lng: 4.0317 },
  "alsace": { lat: 48.3182, lng: 7.4416 },
  "colmar": { lat: 48.0794, lng: 7.3585 },
  "provence": { lat: 43.9352, lng: 5.0673 },
  "bavaria": { lat: 48.7904, lng: 11.4979 },
  "black forest": { lat: 48.1793, lng: 8.2198 },
  "schwarzwald": { lat: 48.1793, lng: 8.2198 },
};

const COUNTRY_CENTROIDS: Record<string, Coordinates> = {
  france: { lat: 46.2276, lng: 2.2137 },
  austria: { lat: 47.5162, lng: 14.5501 },
  switzerland: { lat: 46.8182, lng: 8.2275 },
  italy: { lat: 41.8719, lng: 12.5674 },
  spain: { lat: 40.4637, lng: -3.7492 },
  greece: { lat: 39.0742, lng: 21.8243 },
  norway: { lat: 60.4720, lng: 8.4689 },
  netherlands: { lat: 52.1326, lng: 5.2913 },
  germany: { lat: 51.1657, lng: 10.4515 },
  portugal: { lat: 39.3999, lng: -8.2245 },
  croatia: { lat: 45.1000, lng: 15.2000 },
  sweden: { lat: 60.1282, lng: 18.6435 },
  denmark: { lat: 56.2639, lng: 9.5018 },
  finland: { lat: 61.9241, lng: 25.7482 },
  iceland: { lat: 64.9631, lng: -19.0208 },
  ireland: { lat: 53.1424, lng: -7.6921 },
  uk: { lat: 55.3781, lng: -3.4360 },
  "united kingdom": { lat: 55.3781, lng: -3.4360 },
};

/**
 * Returns deterministic latitude and longitude for a job based on its location and country.
 * Applies a slight deterministic offset so multiple jobs in the same town don't perfectly stack.
 */
export function resolveJobCoordinates(
  location: string,
  country: string,
  jobId: string,
  existingLat?: number,
  existingLng?: number
): Coordinates {
  if (
    typeof existingLat === 'number' &&
    !isNaN(existingLat) &&
    typeof existingLng === 'number' &&
    !isNaN(existingLng) &&
    existingLat !== 0
  ) {
    return { lat: existingLat, lng: existingLng };
  }

  const locLower = (location || '').toLowerCase();
  const countryLower = (country || '').toLowerCase().trim();

  // Try matching known town/resort
  let baseCoords: Coordinates | null = null;
  for (const [key, coords] of Object.entries(KNOWN_EUROPEAN_LOCATIONS)) {
    if (locLower.includes(key)) {
      baseCoords = coords;
      break;
    }
  }

  // Fallback to country centroid
  if (!baseCoords) {
    for (const [cKey, coords] of Object.entries(COUNTRY_CENTROIDS)) {
      if (countryLower.includes(cKey)) {
        baseCoords = coords;
        break;
      }
    }
  }

  // Fallback to central Europe (Alps region)
  if (!baseCoords) {
    baseCoords = { lat: 46.5, lng: 8.5 };
  }

  // Deterministic micro-jitter based on jobId string hash (within ~3km)
  let hash = 0;
  for (let i = 0; i < jobId.length; i++) {
    hash = (hash << 5) - hash + jobId.charCodeAt(i);
    hash |= 0;
  }
  const offsetLat = ((hash % 100) / 100) * 0.04 - 0.02;
  const offsetLng = (((hash >> 4) % 100) / 100) * 0.04 - 0.02;

  return {
    lat: Number((baseCoords.lat + offsetLat).toFixed(4)),
    lng: Number((baseCoords.lng + offsetLng).toFixed(4)),
  };
}
