const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const rateLimit = require("express-rate-limit")

const app = express()

// ── Body / cookie parsing ────────────────────────────────────────────────────
app.use(express.json())
app.use(cookieParser())

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(",")
    : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"]

app.use(cors({
    origin: (origin, cb) => {
        // Allow requests with no origin (e.g. curl, Postman)
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
        cb(new Error("Not allowed by CORS"))
    },
    credentials: true
}))

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Auth endpoints: 20 requests per 15 minutes per IP
app.use("/api/auth", rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." }
}))

// AI / interview endpoints: 10 requests per hour per IP
app.use("/api/interview", rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "You've reached the hourly limit for report generation. Please try again later." }
}))

// ── Routes ────────────────────────────────────────────────────────────────────
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")

app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

// ── Global error handler (must be last) ──────────────────────────────────────
const errorHandler = require("./middlewares/error.middleware")
app.use(errorHandler)

module.exports = app
