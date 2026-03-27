import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scan, MapPin, AlertCircle, X, Download, Thermometer,
  Wind, Droplets, Cloud, Layers, Mountain, Globe2, Zap
} from 'lucide-react';
import { api } from '../services/api';

interface LocationProps {
  lat: number;
  lon: number;
  onClose: () => void;
}

// Map WMO weather codes to readable strings
function weatherCodeLabel(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 9) return 'Foggy/Hazy';
  if (code <= 19) return 'Drizzle';
  if (code <= 29) return 'Rain';
  if (code <= 39) return 'Snow/Sleet';
  if (code <= 49) return 'Freezing Fog';
  if (code <= 59) return 'Light Drizzle';
  if (code <= 69) return 'Rain/Drizzle';
  if (code <= 79) return 'Snow';
  if (code <= 89) return 'Showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

export const LocationAnalysis: React.FC<LocationProps> = ({ lat, lon, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);
    setImgLoaded(false);

    api.analyzeLocation(lat, lon)
      .then(result => setData(result))
      .catch(err => setError(err.message || 'Analysis failed'))
      .finally(() => setLoading(false));
  }, [lat, lon]);

  const getAnomalyColor = (score: number) =>
    score > 70 ? 'text-red-400' : score > 40 ? 'text-yellow-400' : 'text-emerald-400';
  const getAnomalyBg = (score: number) =>
    score > 70 ? 'bg-red-500' : score > 40 ? 'bg-yellow-500' : 'bg-emerald-500';

  return (
    <AnimatePresence>
      <motion.div
        key="loc-panel"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute bottom-4 right-4 w-96 bg-[#0a0a12] border border-indigo-900/50 rounded z-30 flex flex-col overflow-hidden shadow-2xl shadow-indigo-900/30"
        style={{ maxHeight: 'calc(100vh - 80px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-indigo-950/40 border-b border-indigo-900/40 flex-shrink-0">
          <div className="flex items-center gap-2 text-indigo-400">
            <MapPin size={14} />
            <span className="font-mono text-xs uppercase tracking-widest font-bold">Terrain Analysis</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors w-6 h-6 flex items-center justify-center rounded hover:bg-indigo-900/40">
            <X size={14} />
          </button>
        </div>

        {/* Coordinates */}
        <div className="px-4 py-2 bg-black/50 border-b border-indigo-900/30 flex-shrink-0">
          <div className="flex items-center gap-4 font-mono text-xs">
            <span className="text-gray-500">LAT <span className="text-white font-bold">{lat.toFixed(5)}°</span></span>
            <span className="text-gray-500">LON <span className="text-white font-bold">{lon.toFixed(5)}°</span></span>
            {data?.elevation !== null && data?.elevation !== undefined && (
              <span className="text-gray-500 ml-auto">ALT <span className="text-cyan-400 font-bold">{data.elevation}m</span></span>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto terminal-scroll">

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-indigo-500 gap-3">
              <Scan size={40} className="animate-spin" />
              <span className="animate-pulse text-xs font-mono tracking-widest uppercase">Pulling live data...</span>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="p-6 flex flex-col items-center gap-2 text-red-400 font-mono text-xs">
              <AlertCircle size={28} />
              <span>{error}</span>
            </div>
          )}

          {/* Real data */}
          {!loading && data && (
            <div className="p-4 space-y-4">

              {/* Location name */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                  <Globe2 size={10} /> Reverse Geocoding — OpenStreetMap
                </div>
                <div className="text-sm font-bold text-white leading-tight">
                  {data.location?.city ? `${data.location.city}, ` : ''}{data.location?.country}
                  {data.location?.countryCode && data.location.countryCode !== '--' && (
                    <span className="ml-2 text-xs font-mono bg-indigo-900/40 border border-indigo-800/50 px-1.5 py-0.5 rounded text-indigo-300">
                      {data.location.countryCode}
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-mono text-gray-600 truncate" title={data.location?.displayName}>
                  {data.location?.displayName}
                </div>
              </div>

              {/* NASA GIBS Real Satellite Imagery */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                  <Layers size={10} /> MODIS Terra — NASA GIBS ({data.imageryDate})
                </div>
                <div className="relative w-full h-44 bg-black border border-indigo-900/50 rounded overflow-hidden">
                  {!imgLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center text-indigo-600 font-mono text-xs animate-pulse">
                      Loading imagery...
                    </div>
                  )}
                  <img
                    src={data.imageryUrl}
                    alt="MODIS Terra satellite imagery"
                    className={`w-full h-full object-cover transition-opacity duration-700 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImgLoaded(true)}
                    onError={() => setImgLoaded(true)} // fallback: just show nothing
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent h-10 pointer-events-none" />
                  <div className="absolute bottom-1.5 left-2 text-[9px] font-mono text-indigo-400/80 uppercase tracking-widest">
                    NASA GIBS / MODIS Terra True Color
                  </div>
                </div>
              </div>

              {/* Anomaly Score */}
              <div className="bg-black/50 border border-indigo-900/40 rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Zap size={10} /> Anomaly Score
                  </span>
                  <span className={`text-sm font-bold font-mono ${getAnomalyColor(data.anomalyScore)}`}>
                    {data.anomalyScore} / 100
                  </span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data.anomalyScore}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className={`h-full rounded-full ${getAnomalyBg(data.anomalyScore)}`}
                  />
                </div>
                {data.anomalyScore > 70 && (
                  <p className="text-red-400 text-[10px] font-mono flex items-center gap-1">
                    <AlertCircle size={10} /> High activity indicators detected in this region
                  </p>
                )}
              </div>

              {/* Live Weather — Open-Meteo */}
              {data.weather && (
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-indigo-500 uppercase tracking-widest">
                    Live Weather — Open-Meteo
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: <Thermometer size={12}/>, label: 'Temperature', value: `${data.weather.temperature}°C` },
                      { icon: <Droplets size={12}/>, label: 'Humidity', value: `${data.weather.humidity}%` },
                      { icon: <Wind size={12}/>, label: 'Wind', value: `${data.weather.windSpeed} km/h` },
                      { icon: <Cloud size={12}/>, label: 'Cloud Cover', value: `${data.weather.cloudCover}%` },
                    ].map(f => (
                      <div key={f.label} className="bg-black/50 border border-indigo-900/30 rounded px-2.5 py-2 flex items-center gap-2">
                        <span className="text-indigo-500 flex-shrink-0">{f.icon}</span>
                        <div>
                          <div className="text-[9px] font-mono text-gray-600 uppercase">{f.label}</div>
                          <div className="text-xs font-mono text-white font-bold">{f.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400/70 pl-1">
                    Condition: {weatherCodeLabel(data.weather.weatherCode)}
                  </div>
                </div>
              )}

              {/* Elevation */}
              {data.elevation !== null && data.elevation !== undefined && (
                <div className="flex items-center gap-2 bg-black/40 border border-indigo-900/30 rounded px-3 py-2">
                  <Mountain size={13} className="text-indigo-500" />
                  <span className="text-[10px] font-mono text-gray-500 uppercase">Elevation</span>
                  <span className="ml-auto text-xs font-mono text-cyan-300 font-bold">{data.elevation} m ASL</span>
                </div>
              )}

              {/* EONET Active Earth Events */}
              {data.eonetEvents?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                    <AlertCircle size={10} /> NASA EONET — Active Events Nearby
                  </div>
                  <div className="space-y-1.5">
                    {data.eonetEvents.map((ev: any) => (
                      <div key={ev.id} className="bg-red-950/20 border border-red-900/30 rounded px-3 py-2">
                        <div className="text-xs font-mono text-red-300 font-bold">{ev.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-mono bg-red-900/30 rounded px-1.5 py-0.5 text-red-400">{ev.category}</span>
                          {ev.date && <span className="text-[9px] font-mono text-gray-600">{ev.date.split('T')[0]}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.eonetEvents?.length === 0 && (
                <div className="text-[10px] font-mono text-emerald-500 pl-1 flex items-center gap-1">
                  ✓ No active EONET events detected near this location
                </div>
              )}

              {/* Export button */}
              <button className="w-full py-2 rounded text-xs font-mono font-bold uppercase tracking-widest bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 transition-colors flex items-center justify-center gap-2 mt-2">
                <Download size={12} /> Export Intel Report
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
