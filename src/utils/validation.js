export const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);

export const toFiniteNumber = (value, fallback = null) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const toInteger = (value, fallback = null) => {
  const parsed = toFiniteNumber(value, fallback);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
};

export const safeJsonParse = (rawValue, fallback) => {
  if (typeof rawValue !== "string" || rawValue.trim() === "") return fallback;
  try {
    return JSON.parse(rawValue);
  } catch {
    return fallback;
  }
};

export const isProbability = (value) => {
  const parsed = toFiniteNumber(value, NaN);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1;
};

export const toProbability = (value, fallback = null) => {
  const parsed = toFiniteNumber(value, fallback);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) return fallback;
  return parsed;
};

export const isNonNegative = (value) => {
  const parsed = toFiniteNumber(value, NaN);
  return Number.isFinite(parsed) && parsed >= 0;
};

export const normalize2DArray = (matrix, fallback = []) => {
  if (!Array.isArray(matrix)) return fallback;
  return matrix.map((row) => (Array.isArray(row) ? [...row] : [])).filter((row) => row.length > 0);
};