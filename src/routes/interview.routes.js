const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")

const interviewRouter = express.Router()

/**
 * @swagger
 * /api/interview:
 *   post:
 *     summary: Generate a new AI interview preparation report
 *     description: |
 *       The core endpoint of InterviewAI. Accepts the target job description plus at
 *       least one of: a PDF résumé file or a plain-text self-description. The server
 *       extracts text from the PDF (if provided), sends everything to the Gemini AI
 *       model and returns a fully structured report.
 *
 *       **Processing time:** ~20–40 seconds depending on model load.
 *
 *       **What the AI generates**
 *       - A **match score** (0–100)
 *       - 5–8 **technical questions** with interviewer intent + model answer
 *       - 4–6 **behavioural questions** with interviewer intent + model answer
 *       - All relevant **skill gaps** labelled by severity (low / medium / high)
 *       - A **7-day preparation plan** with daily tasks
 *       - An inferred **job title**
 *
 *       **Validation**
 *       - `jobDescription` — required, min 20 characters
 *       - At least one of `resume` (PDF ≤ 3 MB) or `selfDescription` (min 10 chars) must be present
 *
 *       **Rate limit:** 10 requests per hour per IP.
 *     tags: [Interview Reports]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - jobDescription
 *             properties:
 *               jobDescription:
 *                 type: string
 *                 minLength: 20
 *                 maxLength: 5000
 *                 description: Full text of the target job description
 *                 example: >
 *                   Senior Frontend Engineer at Acme Corp. We are looking for an
 *                   experienced engineer proficient in React, TypeScript, GraphQL and
 *                   system design. 5+ years experience required.
 *               resume:
 *                 type: string
 *                 format: binary
 *                 description: Candidate résumé as a PDF file (max 3 MB). Optional if selfDescription is provided.
 *               selfDescription:
 *                 type: string
 *                 minLength: 10
 *                 description: |
 *                   Plain-text description of the candidate's background. Optional if resume is provided.
 *                 example: >
 *                   3 years of React experience, worked on large e-commerce platforms,
 *                   familiar with TypeScript and REST APIs.
 *     responses:
 *       201:
 *         description: Report generated and saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Interview report generated successfully.
 *                 interviewReport:
 *                   $ref: '#/components/schemas/InterviewReport'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingJD:
 *                 summary: Job description too short
 *                 value:
 *                   message: Please provide a job description (at least 20 characters).
 *               missingProfile:
 *                 summary: No profile information provided
 *                 value:
 *                   message: Please provide either a resume file or a self description.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
interviewRouter.post(
    "/",
    authMiddleware.authUser,
    upload.single("resume"),
    interviewController.generateInterViewReportController
)

/**
 * @swagger
 * /api/interview:
 *   get:
 *     summary: List all interview reports for the authenticated user
 *     description: |
 *       Returns a summary list of all reports belonging to the authenticated user,
 *       sorted by creation date (newest first).
 *
 *       **Note:** Heavy fields are intentionally excluded from this response to keep
 *       the payload small. To retrieve the full report including questions, skill gaps
 *       and the preparation plan, use `GET /api/interview/report/{interviewId}`.
 *
 *       Fields excluded from this endpoint:
 *       `resume`, `selfDescription`, `jobDescription`, `technicalQuestions`,
 *       `behavioralQuestions`, `skillGaps`, `preparationPlan`
 *     tags: [Interview Reports]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List retrieved successfully (may be an empty array)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Interview reports fetched successfully.
 *                 interviewReports:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InterviewReportSummary'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
interviewRouter.get(
    "/",
    authMiddleware.authUser,
    interviewController.getAllInterviewReportsController
)

/**
 * @swagger
 * /api/interview/report/{interviewId}:
 *   get:
 *     summary: Get a full interview report by ID
 *     description: |
 *       Retrieves the complete interview report including all questions, skill gaps
 *       and the day-by-day preparation plan.
 *
 *       **Ownership:** A user can only access their own reports. Requesting another
 *       user's report ID returns 404 (not 403) to avoid leaking resource existence.
 *     tags: [Interview Reports]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: interviewId
 *         required: true
 *         schema:
 *           type: string
 *           example: 664f1a2b3c4d5e6f7a8b9c0e
 *         description: MongoDB ObjectId of the interview report (returned by the generate endpoint)
 *     responses:
 *       200:
 *         description: Full report returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Interview report fetched successfully.
 *                 interviewReport:
 *                   $ref: '#/components/schemas/InterviewReport'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
interviewRouter.get(
    "/report/:interviewId",
    authMiddleware.authUser,
    interviewController.getInterviewReportByIdController
)

/**
 * @swagger
 * /api/interview/resume/pdf/{interviewReportId}:
 *   post:
 *     summary: Generate and download a tailored PDF résumé
 *     description: |
 *       Takes the résumé content and job description stored in an existing interview
 *       report and uses the Gemini AI model to generate a tailored, ATS-friendly HTML
 *       résumé. Puppeteer then renders it to a PDF which is streamed back as a file download.
 *
 *       **Processing time:** ~20–40 seconds.
 *
 *       **Ownership:** Only the report owner can generate a PDF from it.
 *
 *       **Response:** Binary PDF stream with `Content-Disposition: attachment`.
 *       Clients should treat the response body as a blob and prompt a file save.
 *
 *       **Rate limit:** Shares the 10 requests/hour limit with other interview endpoints.
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: interviewReportId
 *         required: true
 *         schema:
 *           type: string
 *           example: 664f1a2b3c4d5e6f7a8b9c0e
 *         description: MongoDB ObjectId of the interview report to generate a résumé from
 *     responses:
 *       200:
 *         description: PDF résumé file — triggers a browser download
 *         headers:
 *           Content-Disposition:
 *             description: Attachment filename
 *             schema:
 *               type: string
 *               example: attachment; filename=resume_664f1a2b3c4d5e6f7a8b9c0e.pdf
 *           Content-Type:
 *             schema:
 *               type: string
 *               example: application/pdf
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
interviewRouter.post(
    "/resume/pdf/:interviewReportId",
    authMiddleware.authUser,
    interviewController.generateResumePdfController
)

module.exports = interviewRouter
