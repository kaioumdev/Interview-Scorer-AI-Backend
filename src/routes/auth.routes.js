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
 *       Creates a new user account and immediately opens an authenticated session
 *       by setting an httpOnly `token` cookie (valid 24 h).
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
 *           example:
 *             username: johndoe
 *             email: john@example.com
 *             password: secret123
 *     responses:
 *       201:
 *         description: Account created — session cookie is set automatically
 *         headers:
 *           Set-Cookie:
 *             description: httpOnly session cookie `token` (24 h TTL)
 *             schema:
 *               type: string
 *               example: token=eyJhbGciOiJIUzI1NiJ9...; HttpOnly; SameSite=Strict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               message: User registered successfully
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
 *       Validates credentials and sets an httpOnly `token` cookie on success.
 *       The cookie must be included in all subsequent requests to protected endpoints.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: john@example.com
 *             password: secret123
 *     responses:
 *       200:
 *         description: Login successful — session cookie is set automatically
 *         headers:
 *           Set-Cookie:
 *             description: httpOnly session cookie `token` (24 h TTL)
 *             schema:
 *               type: string
 *               example: token=eyJhbGciOiJIUzI1NiJ9...; HttpOnly; SameSite=Strict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               message: User logged in successfully.
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
 *       After calling this endpoint the cookie is no longer accepted by the server.
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
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
 *       Returns the profile of the user whose session cookie is present in the request.
 *       Useful for rehydrating client-side auth state on page load.
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               message: User details fetched successfully
 *               user:
 *                 id: 664f1a2b3c4d5e6f7a8b9c0d
 *                 username: johndoe
 *                 email: john@example.com
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: User account no longer exists
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
