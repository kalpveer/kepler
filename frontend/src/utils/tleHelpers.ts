import * as satellite from 'satellite.js';

export function getSatPosition(tleLine1: string, tleLine2: string, date: Date = new Date()) {
  try {
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
    const positionAndVelocity = satellite.propagate(satrec, date);
    
    // Check if position is available
    if (!positionAndVelocity.position || typeof positionAndVelocity.position === 'boolean') {
      return null;
    }
    
    // Get GMST
    const gmst = satellite.gstime(date);
    
    // Get Geodetic coordinates (longitude, latitude, height)
    const positionGd = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
    
    const longitude = satellite.degreesLong(positionGd.longitude);
    const latitude = satellite.degreesLat(positionGd.latitude);
    const height = positionGd.height; // config altitude, Earth radius is handled by Globe
    const altitude = height / 6371.0; // Normalized by Earth radius for globe.gl

    return { lat: latitude, lng: longitude, alt: altitude };
  } catch(e) {
    return null;
  }
}
