// Posición del usuario: GPS real o simulada (para probar la navegación sin moverse).
// Publica 'position:update' con { lon, lat, accuracy, heading, speed, time, simulated }.
import { icons } from '../ui/icons.js';
import { circlePolygon } from '../lib/geo.js';
import { h } from '../ui/ui.js';

export default {
  id: 'locate',
  init(ctx) {
    const { map, bus, store, ui, t } = ctx;
    let watchId = null;
    let simulating = false;
    let marker = null;
    let wantCenter = false;

    ctx.addGeoJSON('user-accuracy');
    ctx.ready.then(() => {
      map.addLayer({
        id: 'user-accuracy-fill',
        type: 'fill',
        source: 'user-accuracy',
        paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.12 },
      });
    });

    function publish(pos) {
      store.set('position', pos);
      const lngLat = [pos.lon, pos.lat];
      if (!marker) {
        marker = new maplibregl.Marker({ element: h('div', { class: 'user-dot' }) })
          .setLngLat(lngLat)
          .addTo(map);
      } else {
        marker.setLngLat(lngLat);
      }
      ctx.setGeoJSON('user-accuracy', {
        type: 'FeatureCollection',
        features: pos.accuracy > 15 ? [circlePolygon(lngLat, pos.accuracy)] : [],
      });
      if (wantCenter && store.get('view') !== 'nav') {
        wantCenter = false;
        map.flyTo({ center: lngLat, zoom: Math.max(map.getZoom(), 15.5) });
      }
      bus.emit('position:update', pos);
    }

    function onGeo(p) {
      if (simulating) return;
      publish({
        lon: p.coords.longitude,
        lat: p.coords.latitude,
        accuracy: p.coords.accuracy,
        heading: Number.isFinite(p.coords.heading) ? p.coords.heading : null,
        speed: Number.isFinite(p.coords.speed) ? p.coords.speed : null,
        time: p.timestamp,
        simulated: false,
      });
    }

    function onGeoError(err) {
      const denied = err.code === 1;
      ctx.toast(t(denied ? 'locate.denied' : 'locate.unavailable'), 4500);
      if (denied) stop();
      bus.emit('position:error', err);
    }

    function start() {
      if (watchId != null) return;
      if (!navigator.geolocation) return onGeoError({ code: 2 });
      watchId = navigator.geolocation.watchPosition(onGeo, onGeoError, {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 20000,
      });
    }

    function stop() {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }

    // API para otras funciones (navegación, simulación...)
    ctx.services.position = {
      start,
      stop,
      setSimulation(on) {
        simulating = on;
      },
      pushSimulated(pos) {
        publish({ ...pos, time: Date.now(), simulated: true });
      },
    };

    ui.fab('locate', icons.locate, t('locate.button'), () => {
      const pos = store.get('position');
      if (pos && !pos.simulated) {
        map.flyTo({ center: [pos.lon, pos.lat], zoom: Math.max(map.getZoom(), 15.5) });
      } else {
        wantCenter = true;
        ctx.toast(t('locate.waiting'), 2000);
      }
      start();
    });
  },
};
