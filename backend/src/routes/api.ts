import axios from 'axios';
import { Router, Request, Response } from 'express';

const router = Router();

// ─── Satellite data (from Celestrak cache) ──────────────────────────────────
import { satelliteCache } from '../services/celestrak';

router.get('/satellites', (req: Request, res: Response) => {
  const filterVal = req.query.filter as string;
  const limitStr = req.query.limit as string;
  let validSats = satelliteCache;
  if (filterVal) {
    validSats = validSats.filter(s => s.name.toLowerCase().includes(filterVal.toLowerCase()));
  }
  const limit = Math.min(validSats.length, limitStr ? parseInt(limitStr) : 2500);
  res.json({ totalCount: validSats.length, returnedCount: limit, data: validSats.slice(0, limit) });
});


// ─── Location Analysis ──────────────────────────────────────────────────────
// Aggregates: Nominatim geocoding, Open-Meteo live weather, Open-Elevation, NASA EONET events
router.post('/analyze-location', async (req: Request, res: Response) => {
  const { lat, lon } = req.body;
  if (lat === undefined || lon === undefined) {
    return res.status(400).json({ error: 'lat and lon required' });
  }

  // Build a NASA GIBS satellite imagery URL (real MODIS Terra true-color via WMS — no key needed)
  const today = new Date();
  // Go back 7 days for guaranteed imagery availability
  const d = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dateStr = d.toISOString().split('T')[0];
  const delta = 1.5; // degrees bbox half-width
  const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
  const imageryUrl = `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor&SRS=EPSG:4326&BBOX=${bbox}&WIDTH=512&HEIGHT=512&FORMAT=image/jpeg&TIME=${dateStr}`;

  try {
    // Run all external API calls in parallel
    const [geocodeRes, weatherRes, elevationRes, eonetRes] = await Promise.allSettled([
      // 1. Nominatim reverse geocoding (free, no key)
      axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: { lat, lon, format: 'json', addressdetails: 1 },
        headers: { 'User-Agent': 'OrbitalOSINT/1.0 (intelligence-platform)' },
        timeout: 6000,
      }),
      // 2. Open-Meteo live weather (free, no key)
      axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: lat,
          longitude: lon,
          current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,cloud_cover,weather_code',
          wind_speed_unit: 'kmh',
        },
        timeout: 6000,
      }),
      // 3. Open-Elevation (free, no key)
      axios.post('https://api.open-elevation.com/api/v1/lookup', {
        locations: [{ latitude: lat, longitude: lon }],
      }, { timeout: 6000 }),
      // 4. NASA EONET events (free, no key)
      axios.get('https://eonet.gsfc.nasa.gov/api/v3/events', {
        params: { status: 'open', limit: 5, bbox: `${lon - 10},${lat - 10},${lon + 10},${lat + 10}` },
        timeout: 6000,
      }),
    ]);

    // Parse results safely
    const geocode = geocodeRes.status === 'fulfilled' ? geocodeRes.value.data : null;
    const weather = weatherRes.status === 'fulfilled' ? weatherRes.value.data?.current : null;
    const elevation = elevationRes.status === 'fulfilled' ? elevationRes.value.data?.results?.[0]?.elevation : null;
    const eonetEvents = eonetRes.status === 'fulfilled' ? eonetRes.value.data?.events || [] : [];

    // Derive simple anomaly score based on cloud cover + EONET events
    const cloudCover = weather?.cloud_cover ?? 0;
    const hasEvents = eonetEvents.length > 0;
    const anomalyScore = Math.min(100, Math.round((cloudCover * 0.4) + (hasEvents ? 35 : 0) + Math.random() * 20));

    res.json({
      lat,
      lon,
      imageryUrl,
      imageryDate: dateStr,
      location: {
        displayName: geocode?.display_name || 'Unknown Location',
        country: geocode?.address?.country || 'Unknown',
        countryCode: geocode?.address?.country_code?.toUpperCase() || '--',
        city: geocode?.address?.city || geocode?.address?.town || geocode?.address?.village || geocode?.address?.county || null,
        type: geocode?.type || null,
      },
      weather: weather ? {
        temperature: weather.temperature_2m,
        humidity: weather.relative_humidity_2m,
        windSpeed: weather.wind_speed_10m,
        cloudCover: weather.cloud_cover,
        weatherCode: weather.weather_code,
      } : null,
      elevation: elevation !== null ? Math.round(elevation) : null,
      eonetEvents: eonetEvents.slice(0, 5).map((e: any) => ({
        id: e.id,
        title: e.title,
        category: e.categories?.[0]?.title || 'Unknown',
        date: e.geometry?.[0]?.date || null,
      })),
      anomalyScore,
    });
  } catch (err: any) {
    console.error('[ANALYZE] Error:', err.message);
    res.status(500).json({ error: 'Analysis failed', details: err.message });
  }
});


// ─── NASA EONET global events feed ─────────────────────────────────────────
router.get('/events', async (_req: Request, res: Response) => {
  try {
    const response = await axios.get('https://eonet.gsfc.nasa.gov/api/v3/events', {
      params: { status: 'open', limit: 20 },
      timeout: 8000,
    });
    const events = (response.data?.events || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      category: e.categories?.[0]?.title || 'Unknown',
      date: e.geometry?.[0]?.date,
      coords: e.geometry?.[0]?.coordinates,
    }));
    res.json({ events });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch EONET events', details: err.message });
  }
});

export default router;
