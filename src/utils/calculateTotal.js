export function calculateTotalAmount(qty, rate) {
  const q = parseFloat(qty);
  const r = parseFloat(rate);
  if (isNaN(q) || isNaN(r)) return 0;
  return q * r;
}

export function calculateDistanceCovered(currentKm, lastKm) {
  const cur = parseFloat(currentKm);
  const last = parseFloat(lastKm);
  if (isNaN(cur) || isNaN(last)) return 0;
  return Math.max(0, cur - last);
}
