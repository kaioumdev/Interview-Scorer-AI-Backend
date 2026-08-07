const mongoose = require('mongoose')

const blacklistTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "token is required to be added in blacklist"]
    },
    createdAt: {
        type: Date,
        default: Date.now,
        // Auto-delete after 1 day — matches JWT expiry so the collection
        // never grows unboundedly.
        expires: 86400
    }
})

const tokenBlacklistModel = mongoose.model("blacklistTokens", blacklistTokenSchema)

module.exports = tokenBlacklistModel
