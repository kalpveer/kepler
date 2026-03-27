import React, { useState } from 'react';
import { Search, Filter, ChevronDown, Satellite } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';

interface SidebarProps {
  satellites: any[];
  onSelectSat: (sat: any) => void;
}

const ORBIT_TYPES = ['All', 'LEO', 'MEO', 'GEO'];

export const Sidebar: React.FC<SidebarProps> = ({ satellites, onSelectSat }) => {
  const [search, setSearch] = useState('');
  const [orbitFilter, setOrbitFilter] = useState('All');
  const [showFilter, setShowFilter] = useState(false);

  const filtered = satellites
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 80); // Show top 80 in the list

  return (
    <div className="absolute top-0 left-0 h-full w-72 bg-[#0d0d14] border-r border-indigo-900/50 z-20 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 border-b border-indigo-900/40 flex-shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full border border-indigo-500/50 flex items-center justify-center bg-indigo-900/30 flex-shrink-0 text-indigo-400">
            <Logo className="w-5 h-5" />
          </div>
          <div>
            <div className="text-white font-bold tracking-wider text-base leading-tight">Kepler</div>
            <div className="text-indigo-500 font-mono text-[9px] uppercase tracking-widest">Classified Recon Network</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-indigo-500" />
          <input
            type="text"
            placeholder="Search satellite..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-black/50 border border-indigo-900/60 rounded text-xs text-gray-200 font-mono pl-8 pr-3 py-2 outline-none placeholder-gray-600 focus:border-indigo-500/70 transition-colors"
          />
        </div>

        {/* Orbit filter */}
        <div className="mt-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="w-full flex items-center justify-between text-xs font-mono text-gray-400 hover:text-indigo-300 py-1.5 px-2 rounded hover:bg-indigo-900/20 transition-colors"
          >
            <span className="flex items-center gap-1.5"><Filter size={12} /> Filter: {orbitFilter}</span>
            <ChevronDown size={12} className={`transition-transform ${showFilter ? 'rotate-180' : ''}`} />
          </button>
          {showFilter && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {ORBIT_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => { setOrbitFilter(type); setShowFilter(false); }}
                  className={`text-xs font-mono px-2 py-1 rounded border transition-colors ${
                    orbitFilter === type
                      ? 'bg-indigo-600/40 border-indigo-500 text-indigo-200'
                      : 'border-indigo-900/40 text-gray-500 hover:text-gray-300 hover:border-indigo-700/50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Count */}
      <div className="px-4 py-2 border-b border-indigo-900/30 flex-shrink-0 flex items-center justify-between">
        <span className="text-xs font-mono text-gray-500">Objects tracked</span>
        <span className="text-xs font-mono text-indigo-400 font-bold">{satellites.length.toLocaleString()}</span>
      </div>

      {/* Satellite List */}
      <div className="flex-1 overflow-y-auto terminal-scroll">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-600 text-xs font-mono">
            No results found
          </div>
        ) : (
          filtered.map((sat, i) => (
            <motion.button
              key={sat.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.01 }}
              onClick={() => onSelectSat(sat)}
              className="w-full flex items-start gap-3 px-4 py-3 border-b border-indigo-900/20 hover:bg-indigo-900/20 transition-colors text-left group"
            >
              <Satellite size={14} className="text-indigo-600 group-hover:text-indigo-400 transition-colors mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-mono text-gray-200 group-hover:text-white truncate transition-colors">
                  {sat.name}
                </div>
                <div className="text-[10px] font-mono text-gray-600 mt-0.5">#{sat.id}</div>
              </div>
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500/70 mt-1.5 flex-shrink-0"></div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
};
