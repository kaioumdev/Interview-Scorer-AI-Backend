/**
 * Wraps async route handlers so any thrown error is forwarded to
 * Express's next() instead of causing an unhandled rejection.
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
}

module.exports = asyncHandler
