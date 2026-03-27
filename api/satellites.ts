import axios from 'axios';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=43200, stale-while-revalidate=86400');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
