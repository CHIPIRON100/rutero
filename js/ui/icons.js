// Iconos SVG estáticos (trazo, heredan el color del texto).
const wrap = (d) =>
  `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const icons = {
  locate: wrap('<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7.5"/>'),
  compass: wrap('<path d="M12 3l4 9h-8z" fill="currentColor"/><path d="M12 21l-4-9h8z" opacity=".45"/>'),
  menu: wrap('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  close: wrap('<path d="M6 6l12 12M18 6L6 18"/>'),
  swap: wrap('<path d="M8 4v14M8 18l-3-3M8 18l3-3M16 20V6M16 6l-3 3M16 6l3 3"/>'),
  recenter: wrap('<path d="M12 3l7 17-7-4-7 4z" fill="currentColor"/>'),
  voiceOn: wrap('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9c1.3 1.7 1.3 4.3 0 6M18.5 6.5c2.7 3.3 2.7 7.7 0 11"/>'),
  voiceOff: wrap('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>'),
};
