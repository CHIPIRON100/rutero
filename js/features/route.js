// Cálculo y visualización de la ruta (origen, destino, modo, pasos).
import { h } from '../ui/ui.js';
import { icons } from '../ui/icons.js';
import { fmtDist, fmtDur, fmtClock } from '../lib/format.js';
import { arrowFor } from '../lib/maneuver.js';

export default {
  id: 'route',
  init(ctx) {
    const { map, bus, store, ui, providers, t } = ctx;
    const panel = ui.panel('route');
    const req = { from: null, to: null, mode: store.pref('mode', 'auto') }; // from null = mi ubicación
    let state = 'idle'; // idle | pick | loading | ready | error
    let errorKey = 'route.error';
    let showSteps = false;
    let abort = null;
    let result = null;
    const markers = { from: null, to: null };

    ctx.addGeoJSON('route');
    ctx.ready.then(() => {
      map.addLayer({
        id: 'route-casing', type: 'line', source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#ffffff', 'line-width': 10 },
      });
      map.addLayer({
        id: 'route-line', type: 'line', source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#2563eb', 'line-width': 6 },
      });
    });

    const placeName = (p) => p?.name || t('route.myLocation');

    function draw(fit = true) {
      const coords = result?.coords || [];
      ctx.setGeoJSON('route', {
        type: 'FeatureCollection',
        features: coords.length ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }] : [],
      });
      for (const k of ['from', 'to']) { markers[k]?.remove(); markers[k] = null; }
      if (req.to) markers.to = new maplibregl.Marker({ color: '#d93025' }).setLngLat([req.to.lon, req.to.lat]).addTo(map);
      if (req.from) markers.from = new maplibregl.Marker({ color: '#188038' }).setLngLat([req.from.lon, req.from.lat]).addTo(map);
      if (fit && coords.length && store.get('view') !== 'nav') {
        const b = coords.reduce((bb, c) => bb.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]));
        map.fitBounds(b, {
          padding: { top: 110, bottom: Math.min(window.innerHeight * 0.5, 340), left: 40, right: 40 },
          maxZoom: 17,
          duration: 700,
        });
      }
    }

    function render() {
      const modeChips = h('div', { class: 'chips' },
        ...['auto', 'bike', 'foot'].map((m) =>
          h('button', { class: 'chip' + (req.mode === m ? ' active' : ''), onClick: () => setMode(m) }, t(`mode.${m}`))));
      const swapBtn = h('button', { class: 'icon-btn', 'aria-label': t('route.swap'), onClick: swap });
      swapBtn.innerHTML = icons.swap;
      const closeBtn = h('button', { class: 'icon-btn', 'aria-label': t('route.close'), onClick: () => bus.emit('route:clear') });
      closeBtn.innerHTML = icons.close;

      const head = h('div', { class: 'route-head' }, modeChips, closeBtn);
      const ends = h('div', { class: 'route-ends' },
        h('div', {},
          h('div', {}, h('span', { class: 'muted' }, t('route.from') + ' '), h('strong', {}, placeName(req.from))),
          h('div', {}, h('span', { class: 'muted' }, t('route.to') + ' '), h('strong', {}, req.to ? placeName(req.to) : '…'))),
        swapBtn);

      let body;
      if (state === 'pick') {
        body = h('p', { class: 'muted' }, t('route.pickDestination'));
      } else if (state === 'loading') {
        body = h('p', { class: 'muted' }, t('route.loading'));
      } else if (state === 'error') {
        body = h('div', {}, h('p', { class: 'error' }, t(errorKey)),
          h('button', { class: 'btn', onClick: compute }, t('route.retry')));
      } else if (state === 'ready' && result) {
        const arrival = fmtClock(Date.now() + result.duration * 1000);
        body = h('div', {},
          h('div', { class: 'summary' },
            h('span', { class: 'big' }, fmtDur(result.duration)),
            h('span', { class: 'muted' }, ` · ${fmtDist(result.distance)} · ${t('route.arrival', { time: arrival })}`)),
          h('div', { class: 'actions' },
            h('button', { class: 'btn btn-primary', onClick: () => bus.emit('nav:start', { simulate: false }) }, t('route.start')),
            h('button', { class: 'btn', onClick: () => bus.emit('nav:start', { simulate: true }) }, t('route.simulate')),
            h('button', { class: 'btn', onClick: () => { showSteps = !showSteps; render(); } },
              t(showSteps ? 'route.hideSteps' : 'route.steps'))),
          showSteps ? h('ol', { class: 'steps' },
            ...result.steps.map((s) =>
              h('li', {},
                h('span', { class: 'arrow' }, arrowFor(s.type)),
                h('span', { class: 'txt' }, s.text),
                h('span', { class: 'muted dist' }, s.distance > 0 ? fmtDist(s.distance) : '')))) : null);
      }
      panel.replaceChildren(head, ends, body);
    }

    function setMode(m) {
      if (req.mode === m) return;
      req.mode = m;
      store.setPref('mode', m);
      if (req.to) compute(); else render();
    }

    function swap() {
      const pos = store.get('position');
      const myLoc = pos ? { name: t('route.myLocation'), lat: pos.lat, lon: pos.lon } : null;
      const from = req.from || myLoc;
      const to = req.to;
      if (!from || !to) return;
      req.from = to;
      req.to = from;
      compute();
    }

    function waitForPosition() {
      return new Promise((resolve, reject) => {
        const offU = bus.on('position:update', (p) => { done(); resolve(p); });
        const offE = bus.on('position:error', (e) => { done(); reject(e); });
        const to = setTimeout(() => { done(); reject(new Error('timeout')); }, 20000);
        function done() { offU(); offE(); clearTimeout(to); }
      });
    }

    async function compute() {
      abort?.abort();
      if (!req.to) { state = 'pick'; render(); return; }
      state = 'loading';
      render();
      const myAbort = new AbortController();
      abort = myAbort;
      try {
        let from = req.from;
        if (!from) {
          from = store.get('position');
          if (!from) {
            ctx.toast(t('locate.waiting'), 2500);
            ctx.services.position.start();
            from = await waitForPosition();
          }
        }
        if (myAbort.signal.aborted) return;
        const r = await providers.get('routing').route({ from, to: req.to, mode: req.mode, signal: myAbort.signal });
        if (myAbort.signal.aborted) return;
        result = r;
        store.set('route', { ...r, from: { lat: from.lat, lon: from.lon }, to: req.to, mode: req.mode });
        state = 'ready';
        draw(true);
        render();
      } catch (e) {
        if (e.name === 'AbortError' || myAbort.signal.aborted) return;
        errorKey = e.code === 'NO_PATH' ? 'route.noPath' : e.code === 'FAILED' ? 'route.error' : 'locate.unavailable';
        state = 'error';
        render();
      }
    }

    function clear() {
      abort?.abort();
      result = null;
      req.from = null;
      req.to = null;
      state = 'idle';
      showSteps = false;
      draw(false);
      store.set('route', null);
      ctx.setView('explore');
    }

    bus.on('route:to', (place) => { req.to = place; ctx.setView('route'); compute(); });
    bus.on('route:from', (place) => {
      req.from = place;
      ctx.setView('route');
      if (req.to) compute(); else { state = 'pick'; render(); }
    });
    bus.on('route:clear', clear);
    // La navegación recalculó la ruta (el usuario se salió del trayecto)
    bus.on('route:replaced', (route) => {
      result = route;
      draw(false);
      render();
    });
  },
};
