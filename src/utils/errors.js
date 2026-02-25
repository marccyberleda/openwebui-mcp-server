/**
 * Structured error type for Open WebUI API errors.
 * Carries HTTP status, endpoint, and human-readable message.
 */
export class APIError extends Error {
  /** @param {number} status @param {string} endpoint @param {string} message */
  constructor(status, endpoint, message) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.endpoint = endpoint;
  }

  toString() {
    return `APIError ${this.status} [${this.endpoint}]: ${this.message}`;
  }
}
