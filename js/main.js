// Punto de entrada: crea el mapa, el contexto compartido y arranca cada función.
import { config } from './core/config.js';
import { bus } from './core/bus.js';
import { store } from './core/store.js';
import { providers } from './core/providers.js';
import { t, setLanguage } from './core/i18n.js';
import { createUI } from './ui/ui.js';
import { registerProviders } from './providers/index.js';
import { features } from './features/index.js';

setLanguage(config.language);
registerProviders(providers);
const ui = createUI();

for (const kind of ['geocoding', 'routing']) {
  const id = config.providers[kind];
  providers.use(kind, providers.create(kind, id, { baseUrl: config.endpoints[id], language: config.language }));
}

const map = new maplibregl.Map({
  container: 'map',
  style: config.map.style,
  center: config.map.center,
  zoom: config.map.zoom,
  maxZoom: config.map.maxZoom,
  attributionControl: false,
  dragRotate: true,
});
map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

const ready = new Promise((resolve) => map.once('load', resolve));

// Contexto que reciben todas las funciones
const ctx = {
  config, bus, store, providers, ui, map, t, ready,
  services: {}, // APIs que unas funciones ofrecen a otras (p. ej. services.position)
  toast: ui.toast,
  setView(view) {
    store.set('view', view);
    document.body.dataset.view = view;
    ui.showPanel(['place', 'route', 'nav'].includes(view) ? view : null);
    bus.emit('view:change', view);
  },
  addGeoJSON(id, data = { type: 'FeatureCollection', features: [] }) {
    return ready.then(() => { if (!map.getSource(id)) map.addSource(id, { type: 'geojson', data }); });
  },
  setGeoJSON(id, data) {
    return ready.then(() => map.getSource(id)?.setData(data));
  },
};

for (const feature of features) {
  try {
    feature.init(ctx);
  } catch (e) {
    console.error(`[feature:${feature.id}]`, e);
  }
}
ctx.setView('explore');

map.on('error', (e) => console.warn('[map]', e?.error?.message || e));

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

window.rutalibre = ctx; // útil para depurar desde la consola
