export class ApiError extends Error {
  constructor(status, code, message, details = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function requireObjectBody(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "invalid_body", "Expected a JSON object body.");
  }
  return value;
}

export function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export function notFound(_req, _res, next) {
  next(new ApiError(404, "not_found", "Route was not found."));
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  res.status(status).json({
    error: {
      code: err.code || "internal_error",
      message: status >= 500 ? "Internal server error" : err.message,
      details: err.details || {}
    }
  });
}
