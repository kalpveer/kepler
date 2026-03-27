import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import { initializeCelestrak } from './services/celestrak';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'OrbitalOSINT API is running' });
});

app.listen(PORT, async () => {
  console.log(`[SERVER] Running on http://localhost:${PORT}`);
  await initializeCelestrak();
});
