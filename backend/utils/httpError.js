// Error with an HTTP status code. Throw it from a controller or service and
// the error handler in server.js turns it into a JSON response.
export default class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    if (details) this.details = details;
  }
}

export const badRequest = (message, details) => new HttpError(400, message, details);
export const forbidden = (message = "You are not allowed to do this.") => new HttpError(403, message);
export const notFound = (message = "Not found.") => new HttpError(404, message);
export const conflict = (message) => new HttpError(409, message);
