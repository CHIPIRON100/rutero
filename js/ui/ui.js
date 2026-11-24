// Helpers de interfaz. Todo el texto dinámico se inserta como texto (nunca como HTML),
// porque los nombres de lugares vienen de servicios externos.
export function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) {
    if (c == null || c === false) continue;
    e.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return e;
}

export function createUI() {
  const $ = (id) => document.getElementById(id);
  const sheet = $('sheet');
  const toastEl = $('toast');
  const panels = new Map();

  const updateSheetHeight = () => {
    const hgt = sheet.classList.contains('open') ? sheet.offsetHeight : 0;
    document.documentElement.style.setProperty('--sheet-h', `${hgt}px`);
  };
  new ResizeObserver(updateSheetHeight).observe(sheet);

  return {
    top: $('top'),
    fabs: $('fabs'),
    banner: $('banner'),
    overlay: $('overlay'),

    // Cada función crea su propio panel dentro de la hoja inferior.
    panel(id) {
      const el = h('div', { class: 'panel', 'data-panel': id });
      sheet.append(el);
      panels.set(id, el);
      return el;
    },
    showPanel(id) {
      for (const [k, el] of panels) el.classList.toggle('active', k === id);
      sheet.classList.toggle('open', panels.has(id));
      updateSheetHeight();
    },
    // Botón flotante a la derecha del mapa.
    fab(id, svg, title, onClick) {
      const b = h('button', { class: 'fab', id: `fab-${id}`, title, 'aria-label': title, onClick });
      b.innerHTML = svg; // SVG estático definido en el código, nunca datos externos
      this.fabs.append(b);
      return b;
    },
    toast(msg, ms = 3200) {
      toastEl.textContent = msg;
      toastEl.classList.add('show');
      clearTimeout(toastEl._t);
      toastEl._t = setTimeout(() => toastEl.classList.remove('show'), ms);
    },
  };
}
