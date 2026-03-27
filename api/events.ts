import axios from 'axios';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
  if (req.method === 'OPTIONS') return res.status(200).end();

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
