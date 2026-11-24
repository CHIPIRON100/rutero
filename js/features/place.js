// Lugar seleccionado (desde la búsqueda o con pulsación larga en el mapa).
import { h } from '../ui/ui.js';

export default {
  id: 'place',
  init(ctx) {
    const { map, bus, store, ui, providers, t } = ctx;
    const panel = ui.panel('place');
    let marker = null;
    let current = null;

    function clearMarker() {
      marker?.remove();
      marker = null;
    }

    function render() {
      const p = current;
      panel.replaceChildren(
        h('div', { class: 'place-head' },
          h('div', {},
            h('h2', {}, p.name),
            p.address ? h('p', { class: 'muted' }, p.address) : null,
            h('p', { class: 'muted small' }, `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`)),
          h('button', { class: 'icon-btn', 'aria-label': t('place.close'), onClick: close }, '✕')),
        h('div', { class: 'actions' },
          h('button', { class: 'btn btn-primary', onClick: () => bus.emit('route:to', p) }, t('place.route')),
          h('button', { class: 'btn', onClick: () => bus.emit('route:from', p) }, t('place.origin'))),
      );
    }

    function close() {
      clearMarker();
      current = null;
      store.set('place', null);
      ctx.setView(store.get('route') ? 'route' : 'explore');
    }

    bus.on('place:select', ({ place, fly = true }) => {
      if (store.get('view') === 'nav') return;
      current = place;
      store.set('place', place);
      if (!marker) marker = new maplibregl.Marker({ color: '#d93025' }).setLngLat([place.lon, place.lat]).addTo(map);
      else marker.setLngLat([place.lon, place.lat]);
      if (fly) {
        map.flyTo({ center: [place.lon, place.lat], zoom: Math.max(map.getZoom(), 15), padding: { bottom: 160 } });
      }
      render();
      ctx.setView('place');
    });

    // Al pedir una ruta, el marcador lo dibuja la función de rutas.
    bus.on('route:to', clearMarker);
    bus.on('route:from', clearMarker);

    // Pulsación larga: ratón (clic derecho) o ~0,65 s con el dedo quieto.
    let timer = null;
    let startPt = null;
    let lastLong = 0;
    const cancel = () => { clearTimeout(timer); timer = null; };

    async function onLong(lngLat) {
      const now = Date.now();
      if (now - lastLong < 1000 || store.get('view') === 'nav') return;
      lastLong = now;
      navigator.vibrate?.(30);
      const place = { id: '', name: t('place.point'), address: '', lat: lngLat.lat, lon: lngLat.lng };
      bus.emit('place:select', { place, fly: false });
      try {
        const found = await providers.get('geocoding').reverse(place);
        if (found && store.get('place') === place) {
          bus.emit('place:select', { place: found, fly: false });
        }
      } catch {
        /* sin dirección: se mantiene el punto con coordenadas */
      }
    }

    map.on('touchstart', (e) => {
      if (e.originalEvent.touches?.length !== 1) return cancel();
      startPt = e.point;
      timer = setTimeout(() => onLong(e.lngLat), 650);
    });
    map.on('touchmove', (e) => {
      if (startPt && e.point.dist(startPt) > 10) cancel();
    });
    for (const ev of ['touchend', 'touchcancel', 'dragstart', 'zoomstart', 'rotatestart', 'pitchstart']) {
      map.on(ev, cancel);
    }
    map.on('contextmenu', (e) => onLong(e.lngLat));
  },
};
