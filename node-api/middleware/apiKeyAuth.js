// apiKeyAuth.js
export default function apiKeyMiddleware(req, res, next) {
  // API key enforcement disabled for OpenStreetMap endpoints
  return next();
}
