const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const rateLimit = require("express-rate-limit")
const swaggerUi = require("swagger-ui-express")
const swaggerSpec = require("./config/swagger")

const app = express()

// ── Body / cookie parsing ────────────────────────────────────────────────────
app.use(express.json())
app.use(cookieParser())

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(",")
    : ["https://interview-scorer-ai-frontend.vercel.app", "http://localhost:5173"]

app.use(cors({
    origin: (origin, cb) => {
        // Allow requests with no origin (curl, Postman, same-origin)
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
        cb(new Error("Not allowed by CORS"))
    },
    credentials: true,
    // Required for SameSite=None cookies to work cross-origin
    exposedHeaders: ["set-cookie"]
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

// ── Swagger UI — available at /api/docs ───────────────────────────────────────
const swaggerUiOptions = {
    customSiteTitle: "InterviewAI API Docs",
    customCss: `
        .topbar { background-color: #161b22; }
        .topbar-wrapper img { content: url(''); width: 0; }
        .topbar-wrapper::before {
            content: '⭐ InterviewAI API';
            color: #ff2d78;
            font-size: 1.1rem;
            font-weight: 700;
            padding-left: 1rem;
        }
        .swagger-ui .info .title { color: #e6edf3; }
        .swagger-ui .scheme-container { background: #161b22; padding: 1rem; }
    `,
    swaggerOptions: {
        persistAuthorization: true,         // remember auth across page reloads
        displayRequestDuration: true,       // show how long each request took
        docExpansion: "none",               // start collapsed for cleaner UX
        filter: true,                       // enable the search/filter bar
        tryItOutEnabled: true               // "Try it out" open by default
    }
}

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions))

// Expose raw OpenAPI JSON (useful for code generation tools like openapi-generator)
app.get("/api/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json")
    res.send(swaggerSpec)
})

app.get('/', (req, res) => {
    res.send('Interview-Scorer — API docs available at /api/docs');
});

// ── Routes ────────────────────────────────────────────────────────────────────
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")

app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

// ── Global error handler (must be last) ──────────────────────────────────────
const errorHandler = require("./middlewares/error.middleware")
app.use(errorHandler)

module.exports = app
