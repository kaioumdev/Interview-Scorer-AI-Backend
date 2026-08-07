const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })

// ── Shared model name ────────────────────────────────────────────────────────
// gemini-3.5-flash is the model available on the free tier API key.
const FLASH_MODEL = "gemini-3.5-flash"

// ── Zod schema for the structured report ────────────────────────────────────
const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job description"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("A technical question that can be asked in the interview"),
        intention: z.string().describe("The intention of the interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question: key points, approach, examples")
    })).describe("Technical questions with intention and model answer"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("A behavioral question that can be asked in the interview"),
        intention: z.string().describe("The intention of the interviewer behind asking this question"),
        answer: z.string().describe("How to answer using the STAR method or similar framework")
    })).describe("Behavioral questions with intention and model answer"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("A skill the candidate is lacking relative to the job requirements"),
        severity: z.enum(["low", "medium", "high"]).describe("How critical this gap is to landing the role")
    })).describe("Skill gaps with severity level"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("Day number starting from 1"),
        focus: z.string().describe("Main topic or goal for this day"),
        tasks: z.array(z.string()).describe("Concrete tasks to complete on this day")
    })).describe("Day-by-day preparation plan"),
    title: z.string().describe("The job title inferred from the job description")
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const prompt = `Generate an interview preparation report for a candidate with the following details:
Resume: ${resume || "Not provided"}
Self Description: ${selfDescription || "Not provided"}
Job Description: ${jobDescription}

Provide 5-8 technical questions, 4-6 behavioral questions, all relevant skill gaps, and a 7-day preparation plan.`

    const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema)
        }
    })

    return JSON.parse(response.text)
}

// ── Puppeteer browser singleton ──────────────────────────────────────────────
// Re-use a single browser instance instead of spawning one per request.
let browserInstance = null

async function getBrowser() {
    if (!browserInstance) {
        browserInstance = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        })
    }
    return browserInstance
}

async function generatePdfFromHtml(htmlContent) {
    const browser = await getBrowser()
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" }
    })

    await page.close()
    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const resumePdfSchema = z.object({
        html: z.string().describe("Complete HTML content of the tailored resume, ready for PDF conversion")
    })

    const prompt = `Generate a tailored resume in HTML format for a candidate with the following details:
Resume: ${resume || "Not provided"}
Self Description: ${selfDescription || "Not provided"}
Job Description: ${jobDescription}

Requirements:
- Tailor the resume to match the job description closely
- Highlight relevant experience and skills
- Keep it 1-2 pages, ATS-friendly
- Use clean, professional HTML/CSS styling with subtle colors
- Do NOT make it sound AI-generated — write naturally
- Return a JSON object with a single "html" field`

    const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema)
        }
    })

    const { html } = JSON.parse(response.text)
    return generatePdfFromHtml(html)
}

module.exports = { generateInterviewReport, generateResumePdf }
