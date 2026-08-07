const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")
const asyncHandler = require("../utils/asyncHandler")

const COOKIE_OPTIONS = {
    httpOnly: true,                                // JS cannot read — prevents XSS token theft
    secure: process.env.NODE_ENV === "production", // HTTPS-only in prod
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000                   // 1 day in ms
}

/**
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUserController = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
        return res.status(400).json({ message: "Please provide username, email and password" })
    }

    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" })
    }

    const existing = await userModel.findOne({ $or: [{ username }, { email }] })
    if (existing) {
        return res.status(400).json({ message: "Account already exists with this email address or username" })
    }

    const hash = await bcrypt.hash(password, 10)
    const user = await userModel.create({ username, email, password: hash })

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.cookie("token", token, COOKIE_OPTIONS)
    res.status(201).json({
        message: "User registered successfully",
        user: { id: user._id, username: user.username, email: user.email }
    })
})

/**
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUserController = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ message: "Please provide email and password" })
    }

    const user = await userModel.findOne({ email })
    if (!user) {
        return res.status(401).json({ message: "Invalid email or password" })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" })
    }

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.cookie("token", token, COOKIE_OPTIONS)
    res.status(200).json({
        message: "User logged in successfully.",
        user: { id: user._id, username: user.username, email: user.email }
    })
})

/**
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logoutUserController = asyncHandler(async (req, res) => {
    const token = req.cookies.token

    if (token) {
        await tokenBlacklistModel.create({ token })
    }

    res.clearCookie("token", COOKIE_OPTIONS)
    res.status(200).json({ message: "User logged out successfully" })
})

/**
 * @route   GET /api/auth/get-me
 * @access  Private
 */
const getMeController = asyncHandler(async (req, res) => {
    const user = await userModel.findById(req.user.id).select("-password")

    if (!user) {
        return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({
        message: "User details fetched successfully",
        user: { id: user._id, username: user.username, email: user.email }
    })
})

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}
