// Barra de búsqueda con autocompletado. Publica 'place:select'.
import { h } from '../ui/ui.js';
import { icons } from '../ui/icons.js';

export default {
  id: 'search',
  init(ctx) {
    const { map, bus, ui, providers, t } = ctx;
    let timer = null;
    let abort = null;
    let results = [];

    const menuBtn = h('button', { class: 'icon-btn', 'aria-label': t('menu.open'), onClick: () => bus.emit('menu:open') });
    menuBtn.innerHTML = icons.menu;
    const clearBtn = h('button', { class: 'icon-btn hidden', 'aria-label': t('search.clear'), onClick: () => { input.value = ''; hideList(); sync(); input.focus(); } });
    clearBtn.innerHTML = icons.close;
    const input = h('input', {
      type: 'search',
      placeholder: t('search.placeholder'),
      autocomplete: 'off',
      enterkeyhint: 'search',
    });
    const list = h('ul', { class: 'results', hidden: true });
    ui.top.append(h('div', { class: 'searchbar' }, menuBtn, input, clearBtn), list);

    const sync = () => clearBtn.classList.toggle('hidden', !input.value);
    const hideList = () => { list.hidden = true; list.replaceChildren(); };

    function pick(place) {
      input.value = place.name;
      input.blur();
      sync();
      hideList();
      bus.emit('place:select', { place });
    }

    function render(items, message) {
      list.replaceChildren();
      if (message) list.append(h('li', { class: 'result-msg' }, message));
      for (const p of items) {
        list.append(
          h('li', { class: 'result', tabindex: '0', onClick: () => pick(p) },
            h('strong', {}, p.name),
            p.address ? h('span', { class: 'muted' }, p.address) : null),
        );
      }
      list.hidden = false;
    }

    async function run(q) {
      abort?.abort();
      abort = new AbortController();
      const c = map.getCenter();
      try {
        results = await providers.get('geocoding').search(q, { near: [c.lng, c.lat], signal: abort.signal });
        render(results, results.length ? null : t('search.empty'));
      } catch (e) {
        if (e.name !== 'AbortError') render([], t('search.error'));
      }
    }

    input.addEventListener('input', () => {
      sync();
      clearTimeout(timer);
      const q = input.value.trim();
      if (q.length < 3) { abort?.abort(); return hideList(); }
      timer = setTimeout(() => run(q), 400); // respeta el uso razonable del servicio público
    });
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      clearTimeout(timer);
      if (results.length && !list.hidden) pick(results[0]);
      else if (input.value.trim().length >= 3) run(input.value.trim());
    });
    map.on('dragstart', hideList);
  },
};
