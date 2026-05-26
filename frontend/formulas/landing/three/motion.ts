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

export function phaseOpacityHold(
  progress: number,
  fadeInStart: number,
  fadeInEnd: number,
  fadeOutStart: number,
  fadeOutEnd: number
): number {
  if (progress <= fadeInStart || progress >= fadeOutEnd) {
    return 0;
  }
  if (progress <= fadeInEnd) {
    return (progress - fadeInStart) / (fadeInEnd - fadeInStart);
  }
  if (progress <= fadeOutStart) {
    return 1;
  }
  return 1 - (progress - fadeOutStart) / (fadeOutEnd - fadeOutStart);
}

export function interpolateKeyframes(value: number, keyframes: { x: number; y: number }[]): number {
  if (keyframes.length === 0) return 0;
  const first = keyframes[0]!;
  const last = keyframes[keyframes.length - 1]!;
  if (value <= first.x) return first.y;
  if (value >= last.x) return last.y;

  for (let i = 0; i < keyframes.length - 1; i++) {
    const k1 = keyframes[i]!;
    const k2 = keyframes[i + 1]!;
    if (value >= k1.x && value <= k2.x) {
      const t = (value - k1.x) / (k2.x - k1.x);
      const smooth = t * t * (3 - 2 * t); // easeInOut for smooth start/stop
      return k1.y + (k2.y - k1.y) * smooth;
    }
  }
  return 0;
}
