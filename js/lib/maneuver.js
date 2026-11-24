// Símbolo para cada tipo de maniobra de Valhalla.
const ARROWS = {
  1: '↑', 2: '→', 3: '←', 4: '⚑', 5: '⚑', 6: '⚑', 7: '↑', 8: '↑',
  9: '↗', 10: '→', 11: '↘', 12: '↷', 13: '↶', 14: '↙', 15: '←', 16: '↖',
  17: '↑', 18: '↗', 19: '↖', 20: '↗', 21: '↖', 22: '↑', 23: '↗', 24: '↖',
  25: '↑', 26: '⟳', 27: '⟳', 28: '⛴', 29: '⛴',
};

export const isArrival = (type) => type === 4 || type === 5 || type === 6;

export function arrowFor(type) {
  return ARROWS[type] ?? '↑';
}
