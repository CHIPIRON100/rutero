// Pantalla "Acerca de": versión, fuentes de datos y licencias (atribución obligatoria de OSM).
import { h } from '../ui/ui.js';

export default {
  id: 'about',
  init(ctx) {
    const { bus, ui, t, config } = ctx;
    const close = () => {
      ui.overlay.hidden = true;
      ui.overlay.replaceChildren();
    };

    bus.on('menu:open', () => {
      const link = (href, text) => h('a', { href, target: '_blank', rel: 'noopener' }, text);
      ui.overlay.replaceChildren(
        h(
          'div',
          { class: 'card' },
          h('h2', {}, t('about.title')),
          h('p', { class: 'muted' }, t('about.version', { version: config.version })),
          h('p', {}, t('about.intro')),
          h('h3', {}, t('about.sources')),
          h(
            'ul',
            { class: 'sources' },
            h('li', {}, 'Mapa: ', link('https://www.openstreetmap.org/copyright', '© OpenStreetMap contributors'), ' (ODbL) · ', link('https://openfreemap.org', 'OpenFreeMap'), ' · ', link('https://maplibre.org', 'MapLibre GL JS'), ' (BSD-3)'),
            h('li', {}, 'Rutas: ', link('https://github.com/valhalla/valhalla', 'Valhalla'), ' (MIT)'),
            h('li', {}, 'Búsqueda: ', link('https://photon.komoot.io', 'Photon'), ' (Apache-2.0)'),
          ),
          h('button', { class: 'btn btn-primary', onClick: close }, t('about.close')),
        ),
      );
      ui.overlay.hidden = false;
    });
    ui.overlay.addEventListener('click', (e) => {
      if (e.target === ui.overlay) close();
    });
  },
};
