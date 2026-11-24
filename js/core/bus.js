// Bus de eventos mínimo: las funciones se comunican por aquí sin conocerse entre sí.
const handlers = new Map();

export const bus = {
  on(evt, fn) {
    if (!handlers.has(evt)) handlers.set(evt, new Set());
    handlers.get(evt).add(fn);
    return () => handlers.get(evt)?.delete(fn);
  },
  emit(evt, data) {
    for (const fn of [...(handlers.get(evt) || [])]) {
      try {
        fn(data);
      } catch (e) {
        console.error('[bus]', evt, e);
      }
    }
  },
};
