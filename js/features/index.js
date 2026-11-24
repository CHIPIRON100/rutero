// Lista de funciones de la app. Cada una es un módulo con { id, init(ctx) }.
// Para añadir una función nueva (favoritos, mapas sin conexión, tráfico...):
//   1) crear js/features/<nombre>.js
//   2) importarla y añadirla a esta lista.
// El orden importa solo para la interfaz (qué se crea primero).
import search from './search.js';
import about from './about.js';
import compass from './compass.js';
import locate from './locate.js';
import place from './place.js';
import route from './route.js';
import navigation from './navigation.js';

export const features = [search, about, compass, locate, place, route, navigation];
