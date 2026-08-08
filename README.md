# InterviewAI — Backend API

> AI-powered interview preparation platform. Paste a job description, upload your résumé, and get a fully structured interview report in seconds — powered by Google Gemini.

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Gemini](https://img.shields.io/badge/Google-Gemini_AI-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Endpoints](#endpoints)
- [Rate Limiting](#rate-limiting)
- [Security](#security)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

InterviewAI is a full-stack AI application that helps candidates prepare for job interviews. The backend is a RESTful API built with **Express.js** and **MongoDB**. It integrates with **Google Gemini** to analyse a candidate's profile against a job description and return a comprehensive, structured interview preparation report.

The API also uses **Puppeteer** to generate tailored PDF résumés on demand, rendering AI-produced HTML through a headless Chromium browser.

**Live API:** `https://interview-scorer-ai-backend.vercel.app`  
**Interactive Docs (Swagger UI):** `https://interview-scorer-ai-backend.vercel.app/api/docs`

---

## Key Features

| Feature | Description |
|---|---|
| **AI Report Generation** | Sends résumé + job description to Gemini and receives a fully structured JSON report |
| **Match Score** | 0–100 score indicating how well the candidate fits the role |
| **Technical Questions** | 5–8 likely interview questions with interviewer intent and model answers |
| **Behavioral Questions** | 4–6 situational questions with STAR-method guidance |
| **Skill Gap Analysis** | Identifies missing skills with severity labels (low / medium / high) |
| **7-Day Prep Plan** | Day-by-day preparation plan tailored to the specific role |
| **AI PDF Résumé** | Generates an ATS-friendly, tailored résumé as a downloadable PDF |
| **httpOnly Cookie Auth** | JWT stored in httpOnly cookies — secure against XSS |
| **Token Blacklisting** | Logged-out tokens are immediately invalidated server-side |
| **Rate Limiting** | Per-IP rate limits on auth and AI endpoints to prevent abuse |
| **Swagger API Docs** | Full OpenAPI 3.0 documentation with Try-it-out support |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22.x |
| Framework | Express.js 5.x |
| Database | MongoDB (Mongoose ODM) |
| AI Model | Google Gemini (`gemini-3.5-flash`) via `@google/genai` |
| PDF Parsing | `pdf-parse` — extracts text from uploaded résumé PDFs |
| PDF Generation | `puppeteer` — headless Chromium renders AI-generated HTML to PDF |
| Schema Validation | `zod` + `zod-to-json-schema` — typed AI response schemas |
| Authentication | JWT (`jsonwebtoken`) + httpOnly cookies |
| Password Hashing | `bcryptjs` (cost factor 10) |
| File Uploads | `multer` (memory storage, 3 MB limit) |
| Rate Limiting | `express-rate-limit` |
| API Documentation | `swagger-jsdoc` + `swagger-ui-express` (OpenAPI 3.0.3) |
| Deployment | Vercel (serverless) |

---

## Architecture

```
Client (React SPA)
        │
        │  HTTPS  (httpOnly cookie or Bearer token)
        ▼
┌─────────────────────────────────────────┐
│              Express API                │
│                                         │
│  ┌──────────┐   ┌────────────────────┐  │
│  │  Auth    │   │  Interview Reports │  │
│  │  Routes  │   │  Routes            │  │
│  └────┬─────┘   └────────┬───────────┘  │
│       │                  │              │
│  ┌────▼──────────────────▼───────────┐  │
│  │         Controllers               │  │
│  └────────────────┬──────────────────┘  │
│                   │                     │
│  ┌────────────────▼──────────────────┐  │
│  │  Services                         │  │
│  │  ┌─────────────┐  ┌────────────┐  │  │
│  │  │  ai.service │  │  (future)  │  │  │
│  │  └──────┬──────┘  └────────────┘  │  │
│  └─────────┼─────────────────────────┘  │
└────────────┼────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
Google Gemini     MongoDB Atlas
(AI generation)   (persistence)
```

**Request flow:**
1. Request hits Express → CORS + rate limit middleware
2. Protected routes pass through `authUser` middleware (cookie or Bearer token)
3. Controller validates input, calls services
4. AI service sends prompt to Gemini with a Zod-defined response schema
5. Report is saved to MongoDB and returned to the client

---

## Project Structure

```
backend/
├── server.js                    # Entry point — connects DB, starts HTTP server
├── vercel.json                  # Vercel serverless deployment config
├── .env                         # Environment variables (not committed)
├── .gitignore
├── package.json
└── src/
    ├── app.js                   # Express app — middleware, routes, error handler
    ├── config/
    │   ├── database.js          # MongoDB connection
    │   └── swagger.js           # OpenAPI 3.0 spec (schemas, servers, security)
    ├── controllers/
    │   ├── auth.controller.js   # Register, login, logout, get-me
    │   └── interview.controller.js  # Generate report, get report, list, PDF
    ├── middlewares/
    │   ├── auth.middleware.js   # JWT verification (cookie + Bearer)
    │   ├── error.middleware.js  # Global Express error handler
    │   └── file.middleware.js   # Multer config (3 MB, memory storage)
    ├── models/
    │   ├── user.model.js        # User schema (username, email, password)
    │   ├── interviewReport.model.js  # Full report schema with nested sub-docs
    │   └── blacklist.model.js   # Token blacklist (TTL index — auto-purges after 24h)
    ├── routes/
    │   ├── auth.routes.js       # /api/auth/* — includes Swagger JSDoc annotations
    │   └── interview.routes.js  # /api/interview/* — includes Swagger JSDoc annotations
    ├── services/
    │   └── ai.service.js        # Gemini API calls + Puppeteer PDF generation
    └── utils/
        └── asyncHandler.js      # Wraps async controllers — forwards errors to next()
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- A **MongoDB** database (local or [Atlas](https://www.mongodb.com/cloud/atlas) free tier)
- A **Google AI API key** — get one free at [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation

```bash
# Clone the repository
git clone https://github.com/kaioumdev/Interview-Scorer-AI-Backend.git
cd Interview-Scorer-AI-Backend

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root of the backend folder:

```env
# MongoDB connection string
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/interview-AI

# JWT signing secret — use a long, random string
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars

# Google Gemini API key (free tier supported)
GOOGLE_GENAI_API_KEY=your-google-ai-api-key

# Frontend URL for CORS (comma-separated for multiple origins)
CLIENT_ORIGIN=http://localhost:5173

# Optional — defaults to 3000
PORT=3000

# Set to 'production' on deployment
NODE_ENV=development
```

> **Never commit `.env` to version control.** It is already in `.gitignore`.

### Running Locally

```bash
# Start the development server with hot-reload (nodemon)
npm run dev
```

The server will start at `http://localhost:3000`.

**Verify it's running:**
```bash
curl http://localhost:3000/api/docs.json
# Should return the OpenAPI JSON spec
```

---

## API Reference

### Authentication

The API uses **httpOnly cookie authentication**. On a successful login or register, the server sets a `token` cookie with the following attributes:

| Attribute | Value |
|---|---|
| `HttpOnly` | `true` — JavaScript cannot read the token |
| `Secure` | `true` in production — HTTPS only |
| `SameSite` | `None` in production / `Lax` in development |
| `MaxAge` | 24 hours |

Clients must send `withCredentials: true` (Axios) or `credentials: 'include'` (fetch) on every request.

**Swagger UI users:** login via the `/api/auth/login` endpoint, copy the `token` from the response body, click **Authorize 🔒** and paste it into the `bearerAuth` field.

---

### Endpoints

#### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Create a new account |
| `POST` | `/api/auth/login` | Public | Log in |
| `POST` | `/api/auth/logout` | Optional | Invalidate session |
| `GET` | `/api/auth/get-me` | Required | Get current user profile |

#### Interview Reports — `/api/interview`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/interview` | Required | Generate a new AI interview report |
| `GET` | `/api/interview` | Required | List all reports (summary, newest first) |
| `GET` | `/api/interview/report/:id` | Required | Get full report by ID |
| `POST` | `/api/interview/resume/pdf/:id` | Required | Generate and download tailored PDF résumé |

#### Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/docs` | Interactive Swagger UI |
| `GET` | `/api/docs.json` | Raw OpenAPI 3.0 JSON spec |

**Full interactive documentation:** [`/api/docs`](https://interview-scorer-ai-backend.vercel.app/api/docs)

---

## Rate Limiting

| Route group | Window | Max requests |
|---|---|---|
| `/api/auth/*` | 15 minutes | 20 per IP |
| `/api/interview/*` | 1 hour | 10 per IP |

Exceeding the limit returns `HTTP 429` with:
```json
{ "message": "Too many requests, please try again later." }
```

---

## Security

| Concern | Implementation |
|---|---|
| XSS token theft | `httpOnly` cookie — JS cannot access the JWT |
| CSRF | `SameSite=Strict` in dev / `SameSite=None; Secure` in prod with explicit CORS origin whitelist |
| Brute force | Rate limiting on auth endpoints (20 req / 15 min) |
| Token invalidation | Blacklist model with MongoDB TTL index (auto-purges expired tokens after 24h) |
| Password storage | `bcryptjs` with cost factor 10 |
| Error leaking | Global error handler strips stack traces in production |
| Input validation | Controller-level guards + Zod schemas for AI response parsing |
| File upload | 3 MB limit, memory storage (no disk writes), PDF/DOCX only |
| CORS | Explicit origin whitelist via `CLIENT_ORIGIN` env variable |

---

## Deployment

The backend is deployed to **Vercel** as a serverless Node.js function.

### Vercel Environment Variables

Set these in **Vercel Dashboard → Project → Settings → Environment Variables**:

| Variable | Example Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | `mongodb+srv://...` |
| `JWT_SECRET` | `your-secret` |
| `GOOGLE_GENAI_API_KEY` | `your-key` |
| `CLIENT_ORIGIN` | `https://your-frontend.vercel.app` |

### Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments on every push to `main`.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

Please follow the existing code style and keep commits focused.

---

## License

ISC © [kaioumdev](https://github.com/kaioumdev)
