// Botón de brújula: aparece cuando el mapa está girado o inclinado y lo reorienta al norte.
import { icons } from '../ui/icons.js';

export default {
  id: 'compass',
  init(ctx) {
    const { map, ui, t } = ctx;
    const btn = ui.fab('compass', icons.compass, t('compass.button'), () =>
      map.easeTo({ bearing: 0, pitch: 0, duration: 500 }),
    );
    btn.classList.add('hidden');
    const sync = () => {
      const rotated = Math.abs(map.getBearing()) > 0.5 || map.getPitch() > 0.5;
      btn.classList.toggle('hidden', !rotated);
      btn.firstElementChild.style.transform = `rotate(${-map.getBearing()}deg)`;
    };
    map.on('rotate', sync);
    map.on('pitch', sync);
  },
};
