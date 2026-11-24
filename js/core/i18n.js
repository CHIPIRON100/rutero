// Textos de la interfaz. Para añadir un idioma: crear js/i18n/<idioma>.js y registrarlo aquí.
import es from '../i18n/es.js';

const dictionaries = { es };
let current = 'es';

export function setLanguage(lang) {
  if (dictionaries[lang]) current = lang;
}

export function t(key, vars) {
  let s = dictionaries[current]?.[key] ?? dictionaries.es[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}
