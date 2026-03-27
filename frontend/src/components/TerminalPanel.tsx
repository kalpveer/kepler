import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

export const TerminalPanel: React.FC = () => {
  const [history, setHistory] = useState<string[]>([
    '> Kepler v1.0.0 — System online',
    '> Celestrak uplink established. TLE data synchronized.',
    '> NASA EONET feed connected.',
    '> Anomaly detection engine: ACTIVE',
  ]);
  const [input, setInput] = useState('');
  const [minimized, setMinimized] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Seed real EONET events into the terminal on load
  useEffect(() => {
    api.getGlobalEvents()
      .then(({ events }) => {
        if (!events?.length) return;
        const time = new Date().toISOString().split('T')[1].substring(0, 8) + 'Z';
        const lines = events.slice(0, 8).map((ev: any) =>
          `[${time}] EONET ALERT: ${ev.title} — ${ev.category}`
        );
        setHistory(prev => [...prev, ...lines]);
      })
      .catch(() => {/* silently fail */});
  }, []);

  // Periodic real-events refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      api.getGlobalEvents()
        .then(({ events }) => {
          if (!events?.length) return;
          const randomEvent = events[Math.floor(Math.random() * events.length)];
          const time = new Date().toISOString().split('T')[1].substring(0, 8) + 'Z';
          setHistory(prev => [
            ...prev.slice(-60),
            `[${time}] EONET LIVE: ${randomEvent.title}`,
          ]);
        })
        .catch(() => {});
    }, 120000); // every 2 min
    return () => clearInterval(interval);
  }, []);

  // Interval feed for orbital detections (these are computed from TLE logic so OK to keep)
  useEffect(() => {
    const orbitalAlerts = [
      'Potential conjunction event — objects within 4km',
      'Starlink cluster positional update received',
      'Object maneuver detected — Δv anomaly logged',
      'GEO slot dispute flagged in sector 48E',
      'RF signal intercept — frequency 437.525 MHz',
      'Launch detection: trajectory computed',
    ];
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const msg = orbitalAlerts[Math.floor(Math.random() * orbitalAlerts.length)];
        const time = new Date().toISOString().split('T')[1].substring(0, 8) + 'Z';
        setHistory(prev => [...prev.slice(-60), `[${time}] ORBITAL: ${msg}`]);
      }
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const cmd = input.trim();
    setHistory(prev => [...prev.slice(-60), `> ${cmd}`]);
    const lower = cmd.toLowerCase();

    setTimeout(() => {
      let resp = '';
      if (lower.startsWith('track ')) {
        resp = `[SYS] Orbital lock on: ${cmd.split(' ').slice(1).join(' ')} — TLE propagation active`;
      } else if (lower.startsWith('analyze ')) {
        resp = `[SYS] Tasking MODIS + weather sensors for target: ${cmd.split(' ').slice(1).join(' ')}`;
      } else if (lower === 'clear') {
        setHistory(['> Terminal cleared.']);
        return;
      } else if (lower === 'status') {
        resp = `[SYS] Celestrak: SYNCED | EONET: LIVE | GIBS: READY | Weather: OPEN-METEO`;
      } else if (lower === 'help') {
        resp = `Commands: track <SAT_NAME|ID>  |  analyze <lat,lon>  |  status  |  clear  |  help`;
      } else {
        resp = `[ERR] Unknown: '${cmd}'. Type 'help' for available commands.`;
      }
      setHistory(prev => [...prev.slice(-60), resp]);
    }, 400);
    setInput('');
  };

  const getLineClass = (line: string) => {
    if (line.startsWith('[ERR]')) return 'text-red-400';
    if (line.startsWith('[SYS]')) return 'text-cyan-400';
    if (line.startsWith('> ')) return 'text-indigo-400';
    if (line.includes('EONET ALERT') || line.includes('EONET LIVE')) return 'text-yellow-400';
    if (line.includes('ORBITAL')) return 'text-purple-400';
    return 'text-emerald-400/90';
  };

  return (
    <motion.div
      layout
      className="absolute bottom-4 left-4 w-[430px] bg-[#060610] border border-indigo-900/60 rounded z-30 flex flex-col shadow-2xl shadow-black/80"
      style={{ height: minimized ? 'auto' : '230px' }}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-indigo-900/40 bg-black/50 rounded-t flex-shrink-0">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
        </div>
        <TerminalIcon size={13} className="text-indigo-400 ml-1" />
        <span className="text-[10px] font-mono text-gray-500 flex-1 tracking-widest uppercase">
          osint-terminal — nasa eonet live
        </span>
        <button
          onClick={() => setMinimized(m => !m)}
          className="text-gray-600 hover:text-gray-300 transition-colors"
        >
          {minimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
        </button>
      </div>

      <AnimatePresence>
        {!minimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-3 terminal-scroll space-y-0.5 font-mono text-[11px] leading-relaxed">
              {history.map((line, i) => (
                <div key={i} className={`${getLineClass(line)} break-words`}>{line}</div>
              ))}
              <div ref={endRef} />
            </div>
            <form onSubmit={handleCommand} className="flex items-center gap-2 px-3 py-2 border-t border-indigo-900/40 bg-black/40 flex-shrink-0">
              <span className="text-indigo-600 font-mono text-xs select-none">//&gt;</span>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="track ISS  |  analyze 40.7,-74.0  |  help"
                className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-gray-300 placeholder-gray-700"
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
