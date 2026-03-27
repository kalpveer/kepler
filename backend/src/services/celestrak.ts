import axios from 'axios';
import cron from 'node-cron';

const CELESTRAK_URLS = {
  active: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
};

// State to store satellites in memory
export let satelliteCache: any[] = [];

// Helper to parse TLE string into a JSON array of satellites
function parseTLE(tleData: string) {
  const lines = tleData.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const sats = [];
  
  for (let i = 0; i < lines.length; i += 3) {
    if (i + 2 < lines.length) {
      const name = lines[i];
      const line1 = lines[i + 1];
      const line2 = lines[i + 2];
      
      const noradId = line1.substring(2, 7).trim();
      const designator = line1.substring(9, 17).trim(); // Used to find country if we map it, usually year+piece
      
      // We will leave the rest of the parsing to front-end satellite.js if needed, or pass the TLE pairs
      sats.push({
        id: noradId,
        name: name,
        line1: line1,
        line2: line2,
        designator: designator,
        status: 'active', // default since we query active
      });
    }
  }
  return sats;
}

export async function fetchSatellites() {
  console.log('[CELESTRAK] Fetching latest TLE data for active satellites...');
  try {
    const response = await axios.get(CELESTRAK_URLS.active);
    const parsed = parseTLE(response.data);
    satelliteCache = parsed;
    console.log(`[CELESTRAK] Successfully fetched and cached ${satelliteCache.length} active satellites.`);
  } catch (error) {
    console.error('[CELESTRAK] Failed to fetch TLE data:', error);
  }
}

export async function initializeCelestrak() {
  await fetchSatellites();
  // Fetch every 12 hours since TLE data doesn't change rapidly
  cron.schedule('0 */12 * * *', () => {
    fetchSatellites();
  });
}
