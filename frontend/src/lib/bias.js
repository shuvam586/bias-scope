export const BIAS_UNKNOWN = -69;

export function classifyBias(value) {
  if (value === BIAS_UNKNOWN || value === null || value === undefined) return "unknown";
  if (value >= -10 && value <= -3.5) return "left";
  if (value > -3.5 && value < 3.5) return "center";
  if (value >= 3.5 && value <= 10) return "right";
  return "unknown";
}

export function articleBiasLabel(value) {
  if (value === BIAS_UNKNOWN || value === null || value === undefined) return "unknown";
  if (value <= -3.5) return "left";
  if (value >= 3.5) return "right";
  return "center";
}

export function computeBiasCounts(articles, sourceBiases) {
  const counts = { left: 0, center: 0, right: 0, unknown: 0 };
  for (const article of articles || []) {
    counts[classifyBias(sourceBiases[article.source])]++;
  }
  return counts;
}

export function toPercentages(counts) {
  const total = counts.left + counts.center + counts.right;
  if (total === 0) return { left: 0, center: 0, right: 0 };
  return {
    left: Math.round((counts.left / total) * 100),
    center: Math.round((counts.center / total) * 100),
    right: Math.round((counts.right / total) * 100),
  };
}

export function dominantSide(percentages) {
  const total = percentages.left + percentages.center + percentages.right;
  if (total === 0) return "Mixed";
  const max = Math.max(percentages.left, percentages.center, percentages.right);
  if (percentages.left === max) return "Left";
  if (percentages.center === max) return "Center";
  if (percentages.right === max) return "Right";
  return "Mixed";
}

export function dominantPercent(percentages, dominant) {
  return dominant && dominant !== "Mixed" ? percentages[dominant.toLowerCase()] : 0;
}

export function isMissingSide(event, sourceBiases, side) {
  const articles = event?.articles || [];
  if (articles.length === 0) return false;
  const hasSource = articles.some((a) => {
    const bias = sourceBiases[a.source];
    if (bias === BIAS_UNKNOWN || bias === null || bias === undefined) return false;
    return side === "right" ? bias >= 3.5 : bias <= -3.5;
  });
  return !hasSource;
}
