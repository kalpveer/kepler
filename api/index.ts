import axios from 'axios';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── TLE Parser ─────────────────────────────────────────────────────────────
function parseTLE(tleData: string) {
  const lines = tleData.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const sats = [];
  for (let i = 0; i < lines.length; i += 3) {
    if (i + 2 < lines.length) {
      const name = lines[i];
      const line1 = lines[i + 1];
      const line2 = lines[i + 2];
      const noradId = line1.substring(2, 7).trim();
      const designator = line1.substring(9, 17).trim();
      sats.push({ id: noradId, name, line1, line2, designator, status: 'active' });
    }
  }
  return sats;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.url || '';
  const path = url.replace(/^\/api/, '');

  // ── GET /api/satellites ──────────────────────────────────────────────────
  if (req.method === 'GET' && path.startsWith('/satellites')) {
    try {
      const response = await axios.get(
        'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
        { 
          timeout: 10000,
          headers: { 'User-Agent': 'Kepler/1.0 (intelligence-platform)' }
        }
      );
      let sats = parseTLE(response.data);
      const filter = req.query?.filter as string;
      const limit = Math.min(sats.length, parseInt((req.query?.limit as string) || '2500'));
      if (filter) sats = sats.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()));
      return res.json({ totalCount: sats.length, returnedCount: limit, data: sats.slice(0, limit) });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch satellites', details: err.message });
    }
  }

  // ── POST /api/analyze-location ───────────────────────────────────────────
  if (req.method === 'POST' && path.startsWith('/analyze-location')) {
    const { lat, lon } = req.body || {};
    if (lat === undefined || lon === undefined) return res.status(400).json({ error: 'lat and lon required' });

    const today = new Date();
    const d = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const delta = 1.5;
    const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
    const imageryUrl = `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor&SRS=EPSG:4326&BBOX=${bbox}&WIDTH=512&HEIGHT=512&FORMAT=image/jpeg&TIME=${dateStr}`;

    try {
      const [geocodeRes, weatherRes, elevationRes, eonetRes] = await Promise.allSettled([
        axios.get('https://nominatim.openstreetmap.org/reverse', {
          params: { lat, lon, format: 'json', addressdetails: 1 },
          headers: { 'User-Agent': 'Kepler/1.0 (intelligence-platform)' },
          timeout: 6000,
        }),
        axios.get('https://api.open-meteo.com/v1/forecast', {
          params: { latitude: lat, longitude: lon, current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,cloud_cover,weather_code', wind_speed_unit: 'kmh' },
          timeout: 6000,
        }),
        axios.post('https://api.open-elevation.com/api/v1/lookup', { locations: [{ latitude: lat, longitude: lon }] }, { timeout: 6000 }),
        axios.get('https://eonet.gsfc.nasa.gov/api/v3/events', {
          params: { status: 'open', limit: 5, bbox: `${lon - 10},${lat - 10},${lon + 10},${lat + 10}` },
          timeout: 6000,
        }),
      ]);

      const geocode = geocodeRes.status === 'fulfilled' ? geocodeRes.value.data : null;
      const weather = weatherRes.status === 'fulfilled' ? weatherRes.value.data?.current : null;
      const elevation = elevationRes.status === 'fulfilled' ? elevationRes.value.data?.results?.[0]?.elevation : null;
      const eonetEvents = eonetRes.status === 'fulfilled' ? eonetRes.value.data?.events || [] : [];
      const cloudCover = weather?.cloud_cover ?? 0;
      const anomalyScore = Math.min(100, Math.round((cloudCover * 0.4) + (eonetEvents.length > 0 ? 35 : 0) + Math.random() * 20));

      return res.json({
        lat, lon, imageryUrl, imageryDate: dateStr,
        location: {
          displayName: geocode?.display_name || 'Unknown Location',
          country: geocode?.address?.country || 'Unknown',
          countryCode: geocode?.address?.country_code?.toUpperCase() || '--',
          city: geocode?.address?.city || geocode?.address?.town || geocode?.address?.village || geocode?.address?.county || null,
          type: geocode?.type || null,
        },
        weather: weather ? { temperature: weather.temperature_2m, humidity: weather.relative_humidity_2m, windSpeed: weather.wind_speed_10m, cloudCover: weather.cloud_cover, weatherCode: weather.weather_code } : null,
        elevation: elevation !== null ? Math.round(elevation) : null,
        eonetEvents: eonetEvents.slice(0, 5).map((e: any) => ({ id: e.id, title: e.title, category: e.categories?.[0]?.title || 'Unknown', date: e.geometry?.[0]?.date || null })),
        anomalyScore,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Analysis failed', details: err.message });
    }
  }

  // ── GET /api/events ──────────────────────────────────────────────────────
  if (req.method === 'GET' && path.startsWith('/events')) {
    try {
      const response = await axios.get('https://eonet.gsfc.nasa.gov/api/v3/events', { params: { status: 'open', limit: 20 }, timeout: 8000 });
      const events = (response.data?.events || []).map((e: any) => ({
        id: e.id, title: e.title,
        category: e.categories?.[0]?.title || 'Unknown',
        date: e.geometry?.[0]?.date,
        coords: e.geometry?.[0]?.coordinates,
      }));
      return res.json({ events });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch EONET events', details: err.message });
    }
  }

  // ── GET /health ──────────────────────────────────────────────────────────
  if (path === '/health' || path === '') {
    return res.json({ status: 'ok', message: 'Kepler API is running' });
  }

  return res.status(404).json({ error: 'Not found' });
}
