// Navegación giro a giro: sigue tu posición sobre la ruta, avisa de cada maniobra
// (pantalla y voz), detecta si te sales del trayecto y recalcula.
import { h } from '../ui/ui.js';
import { icons } from '../ui/icons.js';
import { fmtDist, fmtDur, fmtClock, spokenDist } from '../lib/format.js';
import { projectOnRoute, pointAlong, bearing } from '../lib/geo.js';
import { prepareRoute, computeProgress } from '../lib/progress.js';
import { arrowFor, isArrival } from '../lib/maneuver.js';

const SIM_SPEED = { auto: 22, bike: 7, foot: 3 }; // m/s en la simulación
// Distancias a las que se anuncia cada maniobra, [aviso lejano, aviso cercano]
const VOICE_AT = { auto: [500, 120], bike: [150, 40], foot: [100, 30] };

export default {
  id: 'navigation',
  init(ctx) {
    const { map, bus, store, ui, providers, services, config, t } = ctx;
    const panel = ui.panel('nav');
    const banner = ui.banner;
    let st = null;

    const recenterBtn = ui.fab('recenter', icons.recenter, t('nav.recenter'), () => {
      if (st) { st.follow = true; recenterBtn.classList.add('hidden'); applyCamera(store.get('position')); }
    });
    recenterBtn.classList.add('hidden');
    let voiceBtn;

    // ---------- Interfaz ----------
    function buildPanel() {
      voiceBtn = h('button', { class: 'icon-btn', onClick: toggleVoice });
      setVoiceIcon();
      st.els = {
        time: h('span', { class: 'big' }, '—'),
        info: h('span', { class: 'muted' }, ''),
      };
      panel.replaceChildren(
        h('div', { class: 'nav-bar' },
          h('div', {}, st.els.time, h('div', {}, st.els.info),
            st.simulate ? h('div', { class: 'tag' }, t('nav.simulating')) : null),
          voiceBtn,
          h('button', { class: 'btn btn-danger', onClick: exit }, t('nav.exit'))),
      );
      st.els.arrow = h('div', { class: 'arrow' }, '↑');
      st.els.dist = h('div', { class: 'dist' }, '');
      st.els.text = h('div', { class: 'text' }, '');
      banner.replaceChildren(st.els.arrow, h('div', { class: 'info' }, st.els.dist, st.els.text));
      banner.hidden = false;
    }

    function setVoiceIcon() {
      voiceBtn.innerHTML = st.voice ? icons.voiceOn : icons.voiceOff;
      voiceBtn.setAttribute('aria-label', t(st.voice ? 'nav.voiceOn' : 'nav.voiceOff'));
    }

    function toggleVoice() {
      st.voice = !st.voice;
      store.setPref('voice', st.voice);
      if (!st.voice) speechSynthesis?.cancel();
      setVoiceIcon();
      ctx.toast(t(st.voice ? 'nav.voiceOn' : 'nav.voiceOff'), 1500);
    }

    function speak(text) {
      if (!st?.voice || !('speechSynthesis' in window) || !text) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'es-ES';
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }

    // ---------- Cámara ----------
    function applyCamera(pos) {
      if (!st?.follow || !pos) return;
      const mode = st.route.mode;
      const fast = (pos.speed ?? 0) > 18;
      map.easeTo({
        center: [pos.lon, pos.lat],
        bearing: st.bearing ?? map.getBearing(),
        pitch: mode === 'auto' ? 55 : 30,
        zoom: mode === 'auto' ? (fast ? 15.8 : 17) : 17.5,
        padding: { top: Math.round(window.innerHeight * 0.3), bottom: 0, left: 0, right: 0 },
        duration: 900,
        easing: (x) => x,
      });
    }

    map.on('dragstart', (e) => {
      if (st && e.originalEvent) { st.follow = false; recenterBtn.classList.remove('hidden'); }
    });

    // ---------- Ciclo de vida ----------
    async function start({ simulate }) {
      const route = store.get('route');
      if (!route) return;
      if (!simulate && !store.get('position')) {
        ctx.toast(t('nav.needLocation'), 3500);
        services.position.start();
        return;
      }
      st = {
        route,
        prep: prepareRoute(route),
        simulate,
        follow: true,
        voice: store.pref('voice', true),
        announced: new Set(),
        idx: 0,
        offCount: 0,
        lastReroute: 0,
        rerouting: false,
        bearing: null,
        timer: null,
        wake: null,
      };
      buildPanel();
      ctx.setView('nav');
      recenterBtn.classList.add('hidden');
      requestWake();
      if (simulate) startSimulation(); else services.position.start();
      onPosition(store.get('position'));
    }

    function exit() {
      if (!st) return;
      clearInterval(st.timer);
      services.position.setSimulation(false);
      st.wake?.release?.().catch(() => {});
      if ('speechSynthesis' in window) speechSynthesis.cancel();
      st = null;
      banner.hidden = true;
      recenterBtn.classList.add('hidden');
      map.easeTo({ pitch: 0, bearing: 0, padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 600 });
      ctx.setView(store.get('route') ? 'route' : 'explore');
      bus.emit('nav:exit');
    }

    async function requestWake() {
      try { st.wake = await navigator.wakeLock?.request('screen'); } catch { /* no disponible */ }
    }
    document.addEventListener('visibilitychange', () => {
      if (st && document.visibilityState === 'visible') requestWake();
    });

    function startSimulation() {
      services.position.setSimulation(true);
      const { coords, cum, total } = st.prep;
      const speed = SIM_SPEED[st.route.mode] || 15;
      let d = 0;
      const tick = () => {
        const p = pointAlong(coords, cum, d);
        services.position.pushSimulated({ lon: p.lon, lat: p.lat, accuracy: 5, heading: p.bearing, speed });
        if (d >= total) clearInterval(st.timer);
        d = Math.min(total, d + speed);
      };
      tick();
      st.timer = setInterval(tick, 1000);
    }

    // ---------- Seguimiento ----------
    function onPosition(pos) {
      if (!st || !pos || pos.simulated !== st.simulate) return;
      const { coords, cum } = st.prep;
      const limit = Math.max(config.nav.offRouteMeters, (pos.accuracy || 0) * 1.5);
      const pt = [pos.lon, pos.lat];
      let proj = projectOnRoute(pt, coords, cum, st.idx - 30, st.idx + 600);
      if (proj.dist > limit) proj = projectOnRoute(pt, coords, cum); // búsqueda completa
      st.idx = proj.index;

      st.offCount = proj.dist > limit ? st.offCount + 1 : 0;
      if (st.offCount >= 3 && !st.rerouting && Date.now() - st.lastReroute > config.nav.rerouteMinIntervalMs) {
        reroute(pos);
      }

      const seg = coords[proj.index + 1] || coords[proj.index];
      st.bearing = proj.dist <= limit ? bearing(coords[proj.index], seg) : (pos.heading ?? st.bearing);

      const prog = computeProgress(st.prep, proj.along);
      updateUI(prog);
      announce(prog);
      applyCamera(pos);

      if (prog.remainingDist < config.nav.arrivalMeters) arrive();
    }

    function updateUI(prog) {
      const step = st.route.steps[prog.next];
      const arriving = isArrival(step.type);
      st.els.arrow.textContent = arrowFor(step.type);
      st.els.dist.textContent = arriving && prog.distToNext < 15 ? t('nav.arrivedSpoken').replace('.', '') : fmtDist(prog.distToNext);
      st.els.text.textContent = step.text;
      st.els.time.textContent = fmtDur(prog.remainingTime);
      st.els.info.textContent = `${fmtDist(prog.remainingDist)} · ${fmtClock(Date.now() + prog.remainingTime * 1000)}`;
    }

    function announce(prog) {
      const step = st.route.steps[prog.next];
      if (prog.next === 0) return;
      const [far, near] = VOICE_AT[st.route.mode] || VOICE_AT.auto;
      const lower = step.text.charAt(0).toLowerCase() + step.text.slice(1);
      const levels = [
        { at: far, key: `${prog.next}:far`, text: () => `${t('nav.inDistance', { distance: spokenDist(prog.distToNext) })}, ${lower}` },
        { at: near, key: `${prog.next}:near`, text: () => step.verbalPre || step.text },
      ];
      for (let i = levels.length - 1; i >= 0; i--) {
        const lv = levels[i];
        if (prog.distToNext <= lv.at && !st.announced.has(lv.key)) {
          // Si ya estamos en la zona cercana, se omite el aviso lejano
          for (let j = 0; j <= i; j++) st.announced.add(levels[j].key);
          speak(lv.text());
          break;
        }
      }
    }

    async function reroute(pos) {
      st.rerouting = true;
      st.lastReroute = Date.now();
      ctx.toast(t('nav.rerouting'), 2500);
      const mine = st;
      try {
        const r = await providers.get('routing').route({ from: pos, to: mine.route.to, mode: mine.route.mode });
        if (st !== mine) return;
        const route = { ...r, from: { lat: pos.lat, lon: pos.lon }, to: mine.route.to, mode: mine.route.mode };
        store.set('route', route);
        st.route = route;
        st.prep = prepareRoute(route);
        st.idx = 0;
        st.offCount = 0;
        st.announced.clear();
        bus.emit('route:replaced', route);
      } catch {
        if (st === mine) ctx.toast(t('nav.rerouteFailed'), 3000);
      } finally {
        if (st === mine) st.rerouting = false;
      }
    }

    let arriving = false;
    function arrive() {
      if (arriving || !st) return;
      arriving = true;
      speak(t('nav.arrivedSpoken'));
      ctx.toast(t('nav.arrived'), 3500);
      setTimeout(() => { arriving = false; exit(); }, 2500);
    }

    bus.on('nav:start', start);
    bus.on('position:update', onPosition);
  },
};
