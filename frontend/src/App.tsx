import React, { useEffect, useState } from 'react';
import GlobeView from './components/GlobeView';
import SatIntelligencePanel from './components/SatIntelligencePanel';
import { TerminalPanel } from './components/TerminalPanel';
import { LocationAnalysis } from './components/LocationAnalysis';
import { Sidebar } from './components/Sidebar';
import { Preloader } from './components/Preloader';
import { api } from './services/api';
import { Pause, Play, MapPin } from 'lucide-react';

const App: React.FC = () => {
  const [satellites, setSatellites] = useState<any[]>([]);
  const [selectedSat, setSelectedSat] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isRotating, setIsRotating] = useState(false); // OFF by default for usability
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const startTime = Date.now();
      try {
        const data = await api.getSatellites(2000);
        setSatellites(data.data);
      } catch (err) {
        console.error('Failed to load satellites:', err);
      } finally {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 2600 - elapsed);
        setTimeout(() => {
          setLoading(false);
        }, remaining);
      }
    }
    loadData();
  }, []);

  const handleSatSelect = (sat: any) => {
    setSelectedSat(sat);
    setSelectedLocation(null); // close location panel
  };

  const handleMapClick = (lat: number, lon: number) => {
    setSelectedLocation({ lat, lon });
    setSelectedSat(null); // close sat panel
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
      <Preloader loading={loading} />


      {/* Left Sidebar */}
      <Sidebar satellites={satellites} onSelectSat={handleSatSelect} />

      {/* Globe — occupies the area to the right of sidebar */}
      <div className="absolute inset-0" style={{ left: '288px' }}>
        <GlobeView
          satellites={satellites}
          onSatelliteClick={handleSatSelect}
          onMapClick={handleMapClick}
          isRotating={isRotating}
        />
      </div>

      {/* Top status bar (sits on top of globe, right of sidebar) */}
      <div
        className="absolute top-4 flex items-center gap-3 z-30"
        style={{ left: 'calc(288px + 16px)', right: '16px' }}
      >
        {/* Left info pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-black/70 border border-indigo-900/60 rounded px-3 py-1.5 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Live</span>
          </div>
          <div className="bg-black/70 border border-indigo-900/60 rounded px-3 py-1.5 backdrop-blur-sm">
            <span className="text-xs font-mono text-gray-400">
              <span className="text-indigo-300 font-bold">{loading ? '...' : satellites.length.toLocaleString()}</span>
              <span className="ml-1 text-gray-600">objects tracked</span>
            </span>
          </div>
          {/* Orbit legend */}
          <div className="flex items-center gap-3 bg-black/70 border border-indigo-900/40 rounded px-3 py-1.5 backdrop-blur-sm">
            {[
              { color: 'bg-[#818cf8]', label: 'LEO' },
              { color: 'bg-[#06b6d4]', label: 'MEO' },
              { color: 'bg-[#f59e0b]', label: 'GEO' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${color}`}></span>
                <span className="text-[10px] font-mono text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Click-to-analyze hint */}
          <div className="flex items-center gap-2 bg-black/70 border border-indigo-900/40 rounded px-3 py-1.5 backdrop-blur-sm text-gray-500">
            <MapPin size={12} />
            <span className="text-[11px] font-mono">Click globe to analyze location</span>
          </div>

          {/* Rotation toggle */}
          <button
            onClick={() => setIsRotating(r => !r)}
            title={isRotating ? 'Pause rotation' : 'Enable rotation'}
            className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-mono uppercase tracking-wider transition-colors backdrop-blur-sm ${
              isRotating
                ? 'bg-indigo-600/30 border-indigo-500/60 text-indigo-300 hover:bg-indigo-600/50'
                : 'bg-black/70 border-indigo-900/50 text-gray-400 hover:text-gray-200 hover:border-indigo-700/50'
            }`}
          >
            {isRotating ? <Pause size={13} /> : <Play size={13} />}
            {isRotating ? 'Pause' : 'Auto-rotate'}
          </button>
        </div>
      </div>

      {/* Satellite Intel Panel (right drawer) */}
      {selectedSat && (
        <SatIntelligencePanel sat={selectedSat} onClose={() => setSelectedSat(null)} />
      )}

      {/* Location Analysis (bottom-right popup) */}
      {selectedLocation && !selectedSat && (
        <LocationAnalysis
          lat={selectedLocation.lat}
          lon={selectedLocation.lon}
          onClose={() => setSelectedLocation(null)}
        />
      )}

      {/* Terminal */}
      <TerminalPanel />

      {/* Subtle vignette */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.7)] z-10" />
    </div>
  );
};

export default App;
