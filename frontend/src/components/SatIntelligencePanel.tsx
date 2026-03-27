import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Satellite, Activity, Hash, AlertTriangle, Globe2, BookOpen } from 'lucide-react';

interface SatPanelProps {
  sat: any;
  onClose: () => void;
}

const SatIntelligencePanel: React.FC<SatPanelProps> = ({ sat, onClose }) => {
  const [anomalyScore] = useState(() => Math.floor(Math.random() * 100));
  const [tab, setTab] = useState<'intel' | 'orbit'>('intel');

  if (!sat) return null;

  const getAnomalyColor = (score: number) => {
    if (score > 70) return 'text-red-400';
    if (score > 40) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  return (
    <AnimatePresence>
      <motion.div
        key="sat-panel"
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute top-0 right-0 h-full w-80 bg-[#0d0d14] border-l border-indigo-900/50 z-20 flex flex-col shadow-2xl shadow-indigo-900/30"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-indigo-900/40 bg-indigo-950/30 flex-shrink-0">
          <div className="flex items-center gap-2 text-indigo-400">
            <Satellite size={16} />
            <span className="font-mono text-xs uppercase tracking-widest font-bold">Signal Intercept</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-indigo-900/40 text-gray-400 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Sat Name */}
        <div className="px-4 pt-4 pb-3 border-b border-indigo-900/30 flex-shrink-0">
          <div className="text-xs font-mono text-indigo-500 uppercase tracking-widest mb-1">Object</div>
          <h2 className="text-lg font-bold text-white break-words leading-tight">{sat.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Active</span>
            <span className="ml-auto text-xs font-mono text-gray-500">NORAD #{sat.id}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-indigo-900/40 flex-shrink-0">
          {(['intel', 'orbit'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${
                tab === t
                  ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-950/30'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto terminal-scroll p-4 space-y-3">
          {tab === 'intel' ? (
            <>
              {/* Anomaly Score */}
              <div className="bg-black/40 border border-indigo-900/50 rounded p-3">
                <div className="text-xs font-mono text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle size={12} /> Anomaly Score
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${anomalyScore}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full rounded-full ${anomalyScore > 70 ? 'bg-red-500' : anomalyScore > 40 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                    />
                  </div>
                  <span className={`text-base font-bold font-mono ${getAnomalyColor(anomalyScore)}`}>
                    {anomalyScore}
                  </span>
                </div>
                {anomalyScore > 70 && (
                  <p className="text-red-400 text-xs mt-2 font-mono">⚠ High deviation from expected orbital path detected</p>
                )}
              </div>

              {/* Quick fields */}
              {[
                { label: 'NORAD ID', value: sat.id, icon: <Hash size={12} /> },
                { label: 'Designator', value: sat.designator || 'N/A', icon: <BookOpen size={12}/> },
                { label: 'Status', value: 'OPERATIONAL', icon: <Activity size={12}/> },
              ].map((field) => (
                <div key={field.label} className="flex items-center justify-between bg-black/40 border border-indigo-900/30 rounded px-3 py-2">
                  <span className="text-xs font-mono text-gray-500 flex items-center gap-1.5">{field.icon}{field.label}</span>
                  <span className="text-xs font-mono text-indigo-200 font-bold">{field.value}</span>
                </div>
              ))}
            </>
          ) : (
            <>
              {[
                { label: 'Orbit Type', value: 'LEO' },
                { label: 'Inclination', value: `${(Math.random() * 90).toFixed(2)}°` },
                { label: 'Altitude', value: `${(400 + Math.random() * 1000).toFixed(0)} km` },
                { label: 'Velocity', value: `${(7.5 + Math.random() * 1.5).toFixed(2)} km/s` },
                { label: 'Period', value: `${(90 + Math.random() * 30).toFixed(1)} min` },
              ].map((field) => (
                <div key={field.label} className="flex items-center justify-between bg-black/40 border border-indigo-900/30 rounded px-3 py-2">
                  <span className="text-xs font-mono text-gray-500">{field.label}</span>
                  <span className="text-xs font-mono text-cyan-300 font-bold">{field.value}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer action */}
        <div className="p-4 border-t border-indigo-900/40 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 rounded text-xs font-mono font-bold uppercase tracking-widest bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 transition-colors"
          >
            <Globe2 size={12} className="inline mr-2" />
            Close Intel Feed
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SatIntelligencePanel;
