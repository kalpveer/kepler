import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { getSatPosition } from '../utils/tleHelpers';

interface GlobeViewProps {
  satellites: any[];
  onSatelliteClick: (sat: any) => void;
  onMapClick: (lat: number, lon: number) => void;
  isRotating: boolean;
}

function orbitType(alt: number): 'LEO' | 'MEO' | 'GEO' {
  if (alt > 0.5) return 'GEO';
  if (alt > 0.08) return 'MEO';
  return 'LEO';
}

const ORBIT_COLOR: Record<string, number> = {
  LEO: 0x818cf8,
  MEO: 0x06b6d4,
  GEO: 0xf59e0b,
};

// Display shells — keeps objects visually at distinct orbital rings without spikes
const DISPLAY_ALT: Record<string, number> = {
  LEO: 0.04,
  MEO: 0.12,
  GEO: 0.22,
};

const GlobeView: React.FC<GlobeViewProps> = ({ satellites, onSatelliteClick, onMapClick, isRotating }) => {
  const globeEl = useRef<any>();
  const [tick, setTick] = useState(0);
  const lastTick = useRef(0);
  const animRef = useRef<number>();

  // Tick every 5 s for position updates
  useEffect(() => {
    const loop = (ts: number) => {
      animRef.current = requestAnimationFrame(loop);
      if (ts - lastTick.current > 5000) {
        lastTick.current = ts;
        setTick(t => t + 1);
      }
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  useEffect(() => {
    if (!globeEl.current) return;
    const ctrl = globeEl.current.controls();
    ctrl.autoRotate = isRotating;
    ctrl.autoRotateSpeed = 0.4;
  }, [isRotating]);

  useEffect(() => {
    if (!globeEl.current) return;
    const ctrl = globeEl.current.controls();
    ctrl.autoRotate = false;
    ctrl.enableZoom = true;
    ctrl.zoomSpeed = 0.8;
    ctrl.minDistance = 110;
    ctrl.maxDistance = 900;
    globeEl.current.pointOfView({ altitude: 2.5 });
  }, []);

  const satData = useMemo(() => {
    const now = new Date();
    const pts: any[] = [];
    for (const sat of satellites) {
      const pos = getSatPosition(sat.line1, sat.line2, now);
      if (pos) {
        const orbit = orbitType(pos.alt);
        pts.push({
          ...sat,
          lat: pos.lat,
          lng: pos.lng,
          alt: DISPLAY_ALT[orbit],   // ← fixed shell altitude, no spikes
          realAlt: pos.alt,
          orbit,
        });
      }
    }
    return pts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satellites, tick]);

  // Shared geometries and materials — one per orbit type
  const geo = useMemo(() => new THREE.SphereGeometry(0.55, 6, 6), []);
  const mats = useMemo(() => ({
    LEO: new THREE.MeshBasicMaterial({ color: ORBIT_COLOR.LEO }),
    MEO: new THREE.MeshBasicMaterial({ color: ORBIT_COLOR.MEO }),
    GEO: new THREE.MeshBasicMaterial({ color: ORBIT_COLOR.GEO }),
  }), []);

  const buildObject = useCallback((d: any) => {
    const mesh = new THREE.Mesh(geo, mats[d.orbit as 'LEO' | 'MEO' | 'GEO']);
    return mesh;
  }, [geo, mats]);

  return (
    <div className="absolute inset-0">
      <Globe
        ref={globeEl}
        width={window.innerWidth}
        height={window.innerHeight}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor="rgba(79,70,229,0.45)"
        atmosphereAltitude={0.15}
        // ── objectsData: each sat is a Three.js sphere mesh ──────────────
        objectsData={satData}
        objectLat="lat"
        objectLng="lng"
        objectAltitude="alt"
        objectThreeObject={buildObject}
        objectLabel={(d: any) =>
          `<div style="background:rgba(5,5,20,0.93);border:1px solid rgba(99,102,241,0.55);` +
          `padding:6px 10px;border-radius:4px;font:11px 'JetBrains Mono',monospace;` +
          `color:#c7d2fe;max-width:220px;pointer-events:none;white-space:nowrap">` +
          `<b style="color:#a5b4fc">${d.name}</b><br/>` +
          `NORAD&nbsp;${d.id}&nbsp;&nbsp;<span style="color:${ORBIT_COLOR[d.orbit].toString(16).padStart(6,'0').replace(/^/, '#')}">${d.orbit}</span><br/>` +
          `ALT&nbsp;${(d.realAlt * 6371).toFixed(0)}&nbsp;km` +
          `</div>`
        }
        onObjectClick={(d: any) => onSatelliteClick(d)}
        onGlobeClick={({ lat, lng }: { lat: number; lng: number }) => onMapClick(lat, lng)}
      />
    </div>
  );
};

export default GlobeView;
