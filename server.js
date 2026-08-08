require("dotenv").config()
const app = require("./src/app")
const connectToDB = require("./src/config/database")

const PORT = process.env.PORT || 3000

connectToDB()

// For local development — start the HTTP server
// Vercel ignores app.listen() and uses the module.exports instead
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
}

// Required for Vercel serverless deployment
module.exports = app
