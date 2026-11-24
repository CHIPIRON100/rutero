// Lógica pura del progreso sobre una ruta (sin DOM, fácil de probar).
import { cumulative } from './geo.js';

export function prepareRoute(route) {
  const cum = cumulative(route.coords);
  const last = cum.length - 1;
  const stepStart = route.steps.map((s) => cum[Math.max(0, Math.min(s.index, last))]);
  return { ...route, cum, total: cum[last], stepStart };
}

// `along`: metros recorridos sobre la ruta.
export function computeProgress(r, along) {
  const n = r.steps.length;
  let k = 0;
  for (let i = 0; i < n; i++) {
    if (r.stepStart[i] <= along + 1) k = i;
    else break;
  }
  const next = Math.min(k + 1, n - 1);
  const distToNext = Math.max(0, r.stepStart[next] - along);
  const segLen = r.stepStart[next] - r.stepStart[k] || 1;
  const frac = k === next ? 1 : Math.min(1, Math.max(0, (along - r.stepStart[k]) / segLen));
  let remainingTime = (r.steps[k].duration || 0) * (1 - frac);
  for (let j = k + 1; j < n; j++) remainingTime += r.steps[j].duration || 0;
  return {
    step: k,
    next,
    distToNext,
    remainingDist: Math.max(0, r.total - along),
    remainingTime,
  };
}
