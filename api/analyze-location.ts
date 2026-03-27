import axios from 'axios';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
