const swaggerJsdoc = require("swagger-jsdoc")

const options = {
    definition: {
        openapi: "3.0.3",
        info: {
            title: "InterviewAI — API Reference",
            version: "1.0.0",
            description: `
## Overview

**InterviewAI** is an AI-powered interview preparation platform. Candidates paste a job description,
upload their resume (PDF) and/or a short self-description, and the API returns a fully structured
interview preparation report containing:

- A **match score** (0–100) indicating how well the candidate fits the role
- **Technical & behavioral questions** the interviewer is likely to ask, each with the intent behind
  the question and a model answer
- **Skill gaps** identified from the résumé vs. job description, labelled by severity
- A **day-by-day preparation plan** leading up to the interview
- A **tailored PDF résumé** generated from the candidate's existing experience, reframed for the
  target role

---

## 🔐 How to Authenticate in Swagger UI

Since the app uses **httpOnly cookies** (unreadable by JavaScript), Swagger UI cannot access them directly.
The login and register endpoints also return the token in the **response body** so you can authenticate here:

### Step 1 — Register or Login
Expand **Auth → POST /api/auth/register** or **POST /api/auth/login**, click **Try it out**,
fill in your credentials and click **Execute**.

### Step 2 — Copy the token
From the response body, copy the value of the **\`token\`** field.

### Step 3 — Authorize
Click the **Authorize 🔒** button at the top of this page.
In the **bearerAuth** row, paste your token and click **Authorize**.

### Step 4 — Use protected endpoints
All endpoints marked with a 🔒 lock icon will now work automatically.
The token is valid for **24 hours**.

---

## Authentication (How the App Works)

The frontend app uses **HTTP-only cookie authentication**:
1. Call \`POST /api/auth/register\` or \`POST /api/auth/login\`
2. The server sets a \`token\` cookie automatically
3. Every subsequent request from the browser sends the cookie automatically
4. To end the session call \`POST /api/auth/logout\` — the token is blacklisted server-side

---

## Rate Limits

| Route group | Limit |
|---|---|
| \`/api/auth/*\` | 20 requests / 15 minutes per IP |
| \`/api/interview/*\` | 10 requests / 1 hour per IP |

Exceeding a limit returns **HTTP 429**.

---

## Error Format

All error responses share the same shape:

\`\`\`json
{ "message": "Human-readable error description" }
\`\`\`
            `.trim(),
            contact: {
                name: "InterviewAI Support",
                url: "https://github.com/kaioumdev/Interview-Scorer-AI-Backend"
            },
            license: {
                name: "ISC"
            }
        },
        servers: [
            {
                url: "http://localhost:{port}",
                description: "Local development server",
                variables: {
                    port: {
                        default: "3000",
                        description: "Backend port (set via PORT env variable)"
                    }
                }
            },
            {
                url: "https://interview-scorer-ai-backend.vercel.app",
                description: "Production server (Vercel)"
            }
        ],
        tags: [
            {
                name: "Auth",
                description:
                    "User registration, login, logout and session retrieval. " +
                    "Authentication is cookie-based — the server sets an httpOnly `token` cookie on login/register."
            },
            {
                name: "Interview Reports",
                description:
                    "AI-powered interview preparation reports. Generate, list and retrieve full reports " +
                    "based on a job description and candidate profile."
            },
            {
                name: "Resume",
                description:
                    "Generate a tailored PDF résumé from a saved interview report using the Gemini AI model."
            }
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "token",
                    description:
                        "JWT stored as an **httpOnly cookie**. Set automatically after login/register. " +
                        "Used by the frontend app. **Cannot be used in Swagger UI** because browsers " +
                        "block JavaScript from reading httpOnly cookies."
                },
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description:
                        "**Use this in Swagger UI.** After calling `/api/auth/login` or `/api/auth/register`, " +
                        "copy the `token` value from the response body, click the **Authorize 🔒** button " +
                        "at the top of this page, paste the token into the **bearerAuth** field and click Authorize. " +
                        "All protected endpoints will then work automatically."
                }
            },
            schemas: {
                // ── Auth ──────────────────────────────────────────────────────
                RegisterRequest: {
                    type: "object",
                    required: ["username", "email", "password"],
                    properties: {
                        username: {
                            type: "string",
                            minLength: 3,
                            example: "johndoe",
                            description: "Unique username (min 3 characters)"
                        },
                        email: {
                            type: "string",
                            format: "email",
                            example: "john@example.com",
                            description: "Unique email address"
                        },
                        password: {
                            type: "string",
                            format: "password",
                            minLength: 6,
                            example: "secret123",
                            description: "Password (min 6 characters)"
                        }
                    }
                },
                LoginRequest: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            example: "john@example.com"
                        },
                        password: {
                            type: "string",
                            format: "password",
                            example: "secret123"
                        }
                    }
                },
                UserObject: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            example: "664f1a2b3c4d5e6f7a8b9c0d",
                            description: "MongoDB ObjectId"
                        },
                        username: {
                            type: "string",
                            example: "johndoe"
                        },
                        email: {
                            type: "string",
                            format: "email",
                            example: "john@example.com"
                        }
                    }
                },
                AuthResponse: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            example: "User logged in successfully."
                        },
                        token: {
                            type: "string",
                            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                            description:
                                "JWT token — also set as an httpOnly cookie automatically. " +
                                "Copy this value and use it in the Authorize 🔒 dialog (bearerAuth) " +
                                "to authenticate all protected Swagger endpoints."
                        },
                        user: {
                            $ref: "#/components/schemas/UserObject"
                        }
                    }
                },

                // ── Interview Report sub-schemas ──────────────────────────────
                Question: {
                    type: "object",
                    properties: {
                        question: {
                            type: "string",
                            example: "Explain the difference between useMemo and useCallback in React."
                        },
                        intention: {
                            type: "string",
                            example: "Tests depth of React knowledge and understanding of performance optimisation."
                        },
                        answer: {
                            type: "string",
                            example: "useMemo memoises a computed value; useCallback memoises a function reference. Use useMemo when the computation is expensive; useCallback when passing stable callbacks to child components."
                        }
                    }
                },
                SkillGap: {
                    type: "object",
                    properties: {
                        skill: {
                            type: "string",
                            example: "System Design"
                        },
                        severity: {
                            type: "string",
                            enum: ["low", "medium", "high"],
                            example: "high",
                            description:
                                "`high` — critical for the role; `medium` — notable gap; `low` — nice to address"
                        }
                    }
                },
                PreparationDay: {
                    type: "object",
                    properties: {
                        day: {
                            type: "integer",
                            example: 1,
                            description: "Day number starting from 1"
                        },
                        focus: {
                            type: "string",
                            example: "Data Structures & Algorithms fundamentals"
                        },
                        tasks: {
                            type: "array",
                            items: { type: "string" },
                            example: [
                                "Revise Big-O notation",
                                "Solve 5 LeetCode Easy array problems",
                                "Watch 'Sliding Window' technique video"
                            ]
                        }
                    }
                },

                // ── Full report ───────────────────────────────────────────────
                InterviewReport: {
                    type: "object",
                    properties: {
                        _id: {
                            type: "string",
                            example: "664f1a2b3c4d5e6f7a8b9c0e",
                            description: "MongoDB ObjectId — use this as `interviewId` in other endpoints"
                        },
                        title: {
                            type: "string",
                            example: "Senior Frontend Engineer",
                            description: "Job title inferred from the job description by the AI"
                        },
                        matchScore: {
                            type: "integer",
                            minimum: 0,
                            maximum: 100,
                            example: 74,
                            description: "How well the candidate profile matches the job description (0–100)"
                        },
                        technicalQuestions: {
                            type: "array",
                            items: { $ref: "#/components/schemas/Question" },
                            description: "5–8 technical questions likely to be asked in the interview"
                        },
                        behavioralQuestions: {
                            type: "array",
                            items: { $ref: "#/components/schemas/Question" },
                            description: "4–6 behavioral / situational questions"
                        },
                        skillGaps: {
                            type: "array",
                            items: { $ref: "#/components/schemas/SkillGap" },
                            description: "Skills the candidate lacks relative to the job requirements"
                        },
                        preparationPlan: {
                            type: "array",
                            items: { $ref: "#/components/schemas/PreparationDay" },
                            description: "7-day day-by-day preparation plan"
                        },
                        jobDescription: {
                            type: "string",
                            description: "Original job description submitted by the user"
                        },
                        resume: {
                            type: "string",
                            description: "Plain-text content extracted from the uploaded PDF"
                        },
                        selfDescription: {
                            type: "string",
                            description: "Free-text self description submitted by the user"
                        },
                        user: {
                            type: "string",
                            example: "664f1a2b3c4d5e6f7a8b9c0d",
                            description: "MongoDB ObjectId of the owning user"
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                            example: "2025-06-15T09:24:00.000Z"
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                            example: "2025-06-15T09:24:00.000Z"
                        }
                    }
                },

                // ── Summary report (list endpoint — heavy fields stripped) ────
                InterviewReportSummary: {
                    type: "object",
                    description:
                        "Lightweight version returned by the list endpoint. " +
                        "Heavy fields (resume, questions, skillGaps, preparationPlan) are excluded.",
                    properties: {
                        _id: {
                            type: "string",
                            example: "664f1a2b3c4d5e6f7a8b9c0e"
                        },
                        title: {
                            type: "string",
                            example: "Senior Frontend Engineer"
                        },
                        matchScore: {
                            type: "integer",
                            example: 74
                        },
                        user: {
                            type: "string",
                            example: "664f1a2b3c4d5e6f7a8b9c0d"
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                            example: "2025-06-15T09:24:00.000Z"
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                            example: "2025-06-15T09:24:00.000Z"
                        }
                    }
                },

                // ── Errors ────────────────────────────────────────────────────
                ErrorResponse: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            example: "Invalid email or password"
                        }
                    }
                }
            },

            // ── Reusable responses ─────────────────────────────────────────────
            responses: {
                Unauthorized: {
                    description: "Missing or invalid session cookie",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ErrorResponse" },
                            example: { message: "Token not provided." }
                        }
                    }
                },
                NotFound: {
                    description: "The requested resource does not exist or belongs to another user",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ErrorResponse" },
                            example: { message: "Interview report not found." }
                        }
                    }
                },
                TooManyRequests: {
                    description: "Rate limit exceeded",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ErrorResponse" },
                            example: { message: "Too many requests, please try again later." }
                        }
                    }
                },
                InternalError: {
                    description: "Unexpected server error",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ErrorResponse" },
                            example: { message: "Internal server error" }
                        }
                    }
                }
            }
        }
    },
    // swagger-jsdoc scans these files for @swagger / @openapi JSDoc blocks
    apis: [
        "./src/routes/auth.routes.js",
        "./src/routes/interview.routes.js"
    ]
}

const swaggerSpec = swaggerJsdoc(options)

module.exports = swaggerSpec
