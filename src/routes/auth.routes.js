const { Router } = require('express')
const authController = require("../controllers/auth.controller")
const authMiddleware = require("../middlewares/auth.middleware")

const authRouter = Router()

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     description: |
 *       Creates a new user account and opens an authenticated session.
 *
 *       The server does two things on success:
 *       1. Sets an **httpOnly `token` cookie** (used by the frontend app automatically)
 *       2. Returns the **`token` in the response body** — copy this value and paste it into
 *          the **Authorize 🔒** dialog above (bearerAuth field) to use protected endpoints here in Swagger
 *
 *       **Validation rules**
 *       - `username` — required, min 3 characters, must be unique
 *       - `email` — required, valid email format, must be unique
 *       - `password` — required, min 6 characters
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             newUser:
 *               summary: Example new user
 *               value:
 *                 username: johndoe
 *                 email: john@example.com
 *                 password: secret123
 *     responses:
 *       201:
 *         description: |
 *           Account created successfully.
 *           **Copy the `token` from this response** and use it in the Authorize 🔒 dialog.
 *         headers:
 *           Set-Cookie:
 *             description: httpOnly JWT cookie (24 h TTL) — set automatically for the browser
 *             schema:
 *               type: string
 *               example: "token=eyJhbGci...; Path=/; HttpOnly; SameSite=None; Secure"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               message: User registered successfully
 *               token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2NGYxYTJiM2M0ZDVlNmY3YThiOWMwZCIsInVzZXJuYW1lIjoiam9obmRvZSIsImlhdCI6MTcxODQyMDAwMCwiZXhwIjoxNzE4NTA2NDAwfQ.example
 *               user:
 *                 id: 664f1a2b3c4d5e6f7a8b9c0d
 *                 username: johndoe
 *                 email: john@example.com
 *       400:
 *         description: Validation error or duplicate account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFields:
 *                 summary: Missing required fields
 *                 value:
 *                   message: Please provide username, email and password
 *               shortPassword:
 *                 summary: Password too short
 *                 value:
 *                   message: Password must be at least 6 characters
 *               duplicate:
 *                 summary: Account already exists
 *                 value:
 *                   message: Account already exists with this email address or username
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
authRouter.post("/register", authController.registerUserController)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in to an existing account
 *     description: |
 *       Validates credentials and opens an authenticated session.
 *
 *       The server does two things on success:
 *       1. Sets an **httpOnly `token` cookie** (used by the frontend app automatically)
 *       2. Returns the **`token` in the response body** — copy this value and paste it into
 *          the **Authorize 🔒** dialog above (bearerAuth field) to use protected endpoints here in Swagger
 *
 *       **How to use in Swagger UI:**
 *       1. Click **Try it out**
 *       2. Enter your email and password
 *       3. Click **Execute**
 *       4. From the response, copy the `token` value
 *       5. Click **Authorize 🔒** at the top of this page
 *       6. Paste into the **bearerAuth (http, Bearer)** field → click **Authorize**
 *       7. All 🔒 endpoints will now work
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             existingUser:
 *               summary: Example credentials
 *               value:
 *                 email: john@example.com
 *                 password: secret123
 *     responses:
 *       200:
 *         description: |
 *           Login successful.
 *           **Copy the `token` from this response** and use it in the Authorize 🔒 dialog.
 *         headers:
 *           Set-Cookie:
 *             description: httpOnly JWT cookie (24 h TTL) — set automatically for the browser
 *             schema:
 *               type: string
 *               example: "token=eyJhbGci...; Path=/; HttpOnly; SameSite=None; Secure"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               message: User logged in successfully.
 *               token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2NGYxYTJiM2M0ZDVlNmY3YThiOWMwZCIsInVzZXJuYW1lIjoiam9obmRvZSIsImlhdCI6MTcxODQyMDAwMCwiZXhwIjoxNzE4NTA2NDAwfQ.example
 *               user:
 *                 id: 664f1a2b3c4d5e6f7a8b9c0d
 *                 username: johndoe
 *                 email: john@example.com
 *       400:
 *         description: Missing fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Please provide email and password
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Invalid email or password
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
authRouter.post("/login", authController.loginUserController)

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out and invalidate the current session
 *     description: |
 *       Adds the current JWT to the server-side blacklist and clears the `token` cookie.
 *       Blacklisted tokens are auto-purged after 24 hours (matching the JWT expiry).
 *
 *       After calling this endpoint, the token is no longer accepted — you will need
 *       to login again and re-authorize in Swagger.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: User logged out successfully
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
authRouter.post("/logout", authController.logoutUserController)

/**
 * @swagger
 * /api/auth/get-me:
 *   get:
 *     summary: Get the currently authenticated user
 *     description: |
 *       Returns the profile of the currently authenticated user.
 *       Useful for verifying your token is working and for rehydrating
 *       client-side auth state on page load.
 *
 *       **Requires authentication** — click Authorize 🔒 first.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User details fetched successfully
 *                 user:
 *                   $ref: '#/components/schemas/UserObject'
 *             example:
 *               message: User details fetched successfully
 *               user:
 *                 id: 664f1a2b3c4d5e6f7a8b9c0d
 *                 username: johndoe
 *                 email: john@example.com
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: User account no longer exists in the database
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: User not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController)

module.exports = authRouter
