const mongoose = require("mongoose")

// Cache the connection across serverless function invocations.
// Vercel spins up a new Node process per cold start — without this cache
// every request would open (and leak) a brand-new connection.
let cached = global._mongooseConnection

if (!cached) {
    cached = global._mongooseConnection = { conn: null, promise: null }
}

async function connectToDB() {
    // Already connected — reuse
    if (cached.conn) {
        return cached.conn
    }

    // Connection in progress — wait for it
    if (!cached.promise) {
        cached.promise = mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,   // give Atlas 10 s to respond
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            retryWrites: true,
        })
    }

    try {
        cached.conn = await cached.promise
        console.log("Connected to Database")
    } catch (err) {
        // Reset so the next request can retry
        cached.promise = null
        console.error("MongoDB connection error:", err.message)
        throw err   // let the caller (server.js) know it failed
    }

    return cached.conn
}

module.exports = connectToDB
