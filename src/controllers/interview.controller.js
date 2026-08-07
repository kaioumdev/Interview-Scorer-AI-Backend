// pdf-parse v2.x exports the function directly as the module value.
// The `.default ||` fallback handles any bundler wrapping.
const pdfParse = (() => {
    const m = require("pdf-parse")
    return typeof m === "function" ? m : (m.default || m)
})()
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")
const asyncHandler = require("../utils/asyncHandler")

/**
 * @route   POST /api/interview/
 * @desc    Generate interview report from resume + job description
 * @access  Private
 */
const generateInterViewReportController = asyncHandler(async (req, res) => {
    const { selfDescription, jobDescription } = req.body

    if (!jobDescription || jobDescription.trim().length < 20) {
        return res.status(400).json({ message: "Please provide a job description (at least 20 characters)." })
    }

    if (!req.file && (!selfDescription || selfDescription.trim().length < 10)) {
        return res.status(400).json({ message: "Please provide either a resume file or a self description." })
    }

    let resumeText = ""
    if (req.file) {
        const parsed = await pdfParse(req.file.buffer)
        resumeText = parsed.text
    }

    const aiReport = await generateInterviewReport({
        resume: resumeText,
        selfDescription: selfDescription || "",
        jobDescription
    })

    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeText,
        selfDescription: selfDescription || "",
        jobDescription,
        ...aiReport
    })

    res.status(201).json({
        message: "Interview report generated successfully.",
        interviewReport
    })
})

/**
 * @route   GET /api/interview/report/:interviewId
 * @desc    Get single full report by ID (owner only)
 * @access  Private
 */
const getInterviewReportByIdController = asyncHandler(async (req, res) => {
    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({
        _id: interviewId,
        user: req.user.id   // ownership check
    })

    if (!interviewReport) {
        return res.status(404).json({ message: "Interview report not found." })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
})

/**
 * @route   GET /api/interview/
 * @desc    List all reports for logged-in user (summary fields only)
 * @access  Private
 */
const getAllInterviewReportsController = asyncHandler(async (req, res) => {
    const interviewReports = await interviewReportModel
        .find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
})

/**
 * @route   POST /api/interview/resume/pdf/:interviewReportId
 * @desc    Generate and stream a tailored resume PDF
 * @access  Private
 */
const generateResumePdfController = asyncHandler(async (req, res) => {
    const { interviewReportId } = req.params

    // Ownership check — user can only download PDF for their own reports
    const interviewReport = await interviewReportModel.findOne({
        _id: interviewReportId,
        user: req.user.id
    })

    if (!interviewReport) {
        return res.status(404).json({ message: "Interview report not found." })
    }

    const { resume, jobDescription, selfDescription } = interviewReport
    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
})

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController
}
