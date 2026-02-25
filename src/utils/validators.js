/**
 * Throws if a required parameter is missing or empty.
 * @param {Record<string, unknown>} args
 * @param {string} name
 * @returns {unknown} The validated value
 */
export function requireParam(args, name) {
  const value = args?.[name];
  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing required parameter: "${name}"`);
  }
  return value;
}

/**
 * Throws unless confirm === true. Call before any destructive operation.
 * @param {Record<string, unknown>} args
 * @param {string} operation Human-readable description of the operation
 */
export function requireConfirm(args, operation) {
  if (args?.confirm !== true) {
    throw new Error(
      `Destructive operation requires explicit confirmation. Pass confirm: true to ${operation}.`
    );
  }
}

/**
 * Returns a value as a positive integer, or the default.
 * @param {unknown} value
 * @param {number} defaultValue
 * @param {number} max
 */
export function toPage(value, defaultValue = 1, max = 100) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return defaultValue;
  return Math.min(n, max);
}
