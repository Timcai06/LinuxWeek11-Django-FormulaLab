export function easedRange(progress: number, start: number, end: number): number {
  const value = Math.min(Math.max((progress - start) / (end - start), 0), 1);
  return value * value * (3 - 2 * value);
}

export function progressBetween(progress: number, start: number, end: number): number {
  return Math.min(Math.max((progress - start) / (end - start), 0), 1);
}

export function phaseOpacity(progress: number, start: number, peak: number, end: number): number {
  if (progress <= start || progress >= end) {
    return 0;
  }
  if (progress <= peak) {
    return (progress - start) / (peak - start);
  }
  return 1 - (progress - peak) / (end - peak);
}
