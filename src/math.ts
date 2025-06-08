export function cos(x: number) {
  const x2 = x * x;
  return 1 - x2 / 2 + (x2 * x2) / 24;
}

export function sin(x: number) {
  const x3 = x * x * x;
  return x - x3 / 6 + (x3 * x * x) / 120;
}

export function round(x: number) {
  // this makes difference! check it further
  return (x + 0.5) << 0;
}
