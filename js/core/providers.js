// Registro de proveedores intercambiables (geocodificación, rutas, ...).
// Un proveedor nuevo = un archivo en js/providers/ + una línea en js/providers/index.js.
const factories = {};
const active = {};

export const providers = {
  register(kind, id, factory) {
    (factories[kind] ??= {})[id] = factory;
  },
  create(kind, id, opts) {
    const f = factories[kind]?.[id];
    if (!f) throw new Error(`Proveedor desconocido: ${kind}/${id}`);
    return f(opts);
  },
  use(kind, instance) {
    active[kind] = instance;
  },
  get(kind) {
    const p = active[kind];
    if (!p) throw new Error(`Sin proveedor activo para: ${kind}`);
    return p;
  },
};
