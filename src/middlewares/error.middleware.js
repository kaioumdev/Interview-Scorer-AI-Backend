/**
 * Global Express error handler — must be registered AFTER all routes.
 * Catches anything forwarded via next(err) or thrown in asyncHandler wrappers.
 */
function errorHandler(err, req, res, next) {
    const status = err.status || err.statusCode || 500
    const message = err.message || "Internal server error"

    // Don't leak stack traces in production
    if (process.env.NODE_ENV !== "production") {
        console.error("[Error]", err)
    }

    res.status(status).json({ message })
}

module.exports = errorHandler
