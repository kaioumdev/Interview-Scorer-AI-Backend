const { Router } = require('express')
const authController = require("../controllers/auth.controller")
const authMiddleware = require("../middlewares/auth.middleware")

const authRouter = Router()

/** @route POST /api/auth/register — Public */
authRouter.post("/register", authController.registerUserController)

/** @route POST /api/auth/login — Public */
authRouter.post("/login", authController.loginUserController)

/** @route POST /api/auth/logout — Public (changed from GET to POST) */
authRouter.post("/logout", authController.logoutUserController)

/** @route GET /api/auth/get-me — Private */
authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController)

module.exports = authRouter
