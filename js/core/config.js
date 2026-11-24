// Configuración central. Cambiar un servicio = cambiar una URL aquí
// (o sobrescribirla desde localStorage, ver docs/AUTOALOJADO.md).
const base = {
  appName: 'RutaLibre',
  version: '1.0.0',
  language: 'es',
  map: {
    // Teselas vectoriales gratuitas y de uso comercial permitido (datos de OpenStreetMap).
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [-3.7, 40.4],
    zoom: 5.5,
    maxZoom: 19,
  },
  // Proveedor activo para cada servicio. Se registran en js/providers/index.js
  providers: {
    geocoding: 'photon',
    routing: 'valhalla',
  },
  // URL base de cada proveedor. Los públicos son solo para pruebas (uso razonable);
  // para producción hay que apuntar a servidores propios (docs/AUTOALOJADO.md).
  endpoints: {
    photon: 'https://photon.komoot.io',
    valhalla: 'https://valhalla1.openstreetmap.de',
  },
  nav: {
    offRouteMeters: 50,
    rerouteMinIntervalMs: 8000,
    arrivalMeters: 25,
  },
};

function merge(target, src) {
  for (const k of Object.keys(src || {})) {
    const v = src[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) merge((target[k] ??= {}), v);
    else target[k] = v;
  }
  return target;
}

function localOverrides() {
  try {
    return JSON.parse(localStorage.getItem('rutalibre.config') || '{}');
  } catch {
    return {};
  }
}

export const config = merge(base, localOverrides());
