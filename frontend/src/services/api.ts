import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
  getSatellites: async (limit = 2000) => {
    const res = await axios.get(`${API_BASE}/satellites?limit=${limit}`);
    return res.data;
  },
  analyzeLocation: async (lat: number, lon: number) => {
    const res = await axios.post(`${API_BASE}/analyze-location`, { lat, lon });
    return res.data;
  },
  getGlobalEvents: async () => {
    const res = await axios.get(`${API_BASE}/events`);
    return res.data;
  },
};
