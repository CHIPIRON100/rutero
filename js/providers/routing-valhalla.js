// Rutas con Valhalla (MIT, datos de OpenStreetMap).
// Contrato de un proveedor de rutas:
//   route({ from, to, mode, signal }) -> Route
//   mode: 'auto' | 'bike' | 'foot'
// Route = { distance (m), duration (s), coords: [[lon, lat]...],
//           steps: [{ text, verbalPre, distance, duration, type, street, index }] }
// `index` es la posición en `coords` donde empieza cada paso.
import { decodePolyline } from '../lib/polyline.js';

const COSTING = { auto: 'auto', bike: 'bicycle', foot: 'pedestrian' };
const LOCALES = { es: 'es-ES', en: 'en-US' };

export class RouteError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code; // 'NO_PATH' | 'FAILED'
  }
}

export function createValhalla({ baseUrl, language = 'es' }) {
  return {
    id: 'valhalla',
    modes: ['auto', 'bike', 'foot'],
    async route({ from, to, mode = 'auto', signal }) {
      const request = {
        locations: [
          { lat: from.lat, lon: from.lon, type: 'break' },
          { lat: to.lat, lon: to.lon, type: 'break' },
        ],
        costing: COSTING[mode] || 'auto',
        directions_options: { language: LOCALES[language] || 'es-ES', units: 'kilometers' },
      };
      // GET con ?json= es una petición "simple" del navegador (sin preflight CORS).
      const u = new URL('/route', baseUrl);
      u.searchParams.set('json', JSON.stringify(request));

      let res;
      try {
        res = await fetch(u, { signal });
      } catch (e) {
        if (e.name === 'AbortError') throw e;
        throw new RouteError('Sin conexión con el servidor de rutas', 'FAILED');
      }
      let data = null;
      try {
        data = await res.json();
      } catch {
        /* respuesta no JSON */
      }
      if (!res.ok || !data?.trip) {
        const code = data?.error_code;
        // 442/443/171: no se encontró ruta ni punto cercano a la red viaria
        const noPath = [442, 443, 171, 170].includes(code);
        throw new RouteError(data?.error || `HTTP ${res.status}`, noPath ? 'NO_PATH' : 'FAILED');
      }
      return parseTrip(data.trip);
    },
  };
}

export function parseTrip(trip) {
  let coords = [];
  const steps = [];
  for (const leg of trip.legs) {
    const shape = decodePolyline(leg.shape, 6);
    const offset = coords.length ? coords.length - 1 : 0;
    coords = coords.concat(coords.length ? shape.slice(1) : shape);
    for (const m of leg.maneuvers || []) {
      steps.push({
        text: m.instruction,
        verbalPre: m.verbal_pre_transition_instruction,
        distance: (m.length || 0) * 1000,
        duration: m.time || 0,
        type: m.type,
        street: (m.street_names || [])[0],
        index: offset + (m.begin_shape_index || 0),
      });
    }
  }
  return {
    distance: (trip.summary?.length || 0) * 1000,
    duration: trip.summary?.time || 0,
    coords,
    steps,
    provider: 'valhalla',
  };
}
