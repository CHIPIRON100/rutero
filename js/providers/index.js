// Aquí se registran todos los proveedores disponibles.
// Para añadir otro (p. ej. GraphHopper o Nominatim): crear su archivo y registrarlo.
import { createPhoton } from './geocoding-photon.js';
import { createValhalla } from './routing-valhalla.js';

export function registerProviders(providers) {
  providers.register('geocoding', 'photon', createPhoton);
  providers.register('routing', 'valhalla', createValhalla);
}
