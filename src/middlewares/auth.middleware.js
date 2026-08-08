const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

/**
 * Supports two token delivery methods:
 *
 *  1. httpOnly cookie  — used by the frontend app (primary)
 *  2. Authorization: Bearer <token> — used by Swagger UI and API clients
 *     that cannot access httpOnly cookies
 *
 * Cookie takes precedence when both are present.
 */
async function authUser(req, res, next) {

    // 1. Try cookie first (frontend app flow)
    let token = req.cookies.token

    // 2. Fall back to Authorization: Bearer header (Swagger / API client flow)
    if (!token) {
        const authHeader = req.headers["authorization"]
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.slice(7)
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Token not provided." })
    }

    const isBlacklisted = await tokenBlacklistModel.findOne({ token })
    if (isBlacklisted) {
        return res.status(401).json({ message: "Token is invalid." })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token." })
    }
}

module.exports = { authUser }
