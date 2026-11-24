// Estado compartido + preferencias persistentes.
import { bus } from './bus.js';

const state = {
  view: 'explore', // explore | place | route | nav
  position: null,
  place: null,
  route: null,
};

const PREFS_KEY = 'rutalibre.prefs';

function readPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
  } catch {
    return {};
  }
}

export const store = {
  get: (k) => state[k],
  set(k, v) {
    state[k] = v;
    bus.emit('state:' + k, v);
  },
  pref(k, fallback) {
    const p = readPrefs();
    return k in p ? p[k] : fallback;
  },
  setPref(k, v) {
    try {
      const p = readPrefs();
      p[k] = v;
      localStorage.setItem(PREFS_KEY, JSON.stringify(p));
    } catch {
      /* almacenamiento no disponible */
    }
  },
};
