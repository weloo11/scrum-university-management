import fs from "fs";
import path from "path";
import express from "express";
import PDFDocument from "pdfkit";
import TranscriptRequest from "../models/TranscriptRequest.js";
import StudentRecord from "../models/StudentRecord.js";
import Grade from "../models/Grade.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { sendResponse } from "../utils/apiResponse.js";
import { createNotification } from "../utils/notifications.js";

const router = express.Router();

router.post("/request", authenticate, authorize("student"), async (req, res, next) => {
  try {
    const existingPending = await TranscriptRequest.findOne({
      studentId: req.user._id,
      requestStatus: "pending"
    });

    if (existingPending) {
      return sendResponse(res, 400, existingPending, "You already have a pending transcript request");
    }

    const request = await TranscriptRequest.create({ studentId: req.user._id, student: req.user._id });
    return sendResponse(res, 201, request, "Transcript requested");
  } catch (error) {
    next(error);
  }
});

router.get("/my", authenticate, authorize("student"), async (req, res, next) => {
  try {
    const requests = await TranscriptRequest.find({ studentId: req.user._id }).sort({ requestedAt: -1 });
    return sendResponse(res, 200, requests, "Your transcript requests loaded");
  } catch (error) {
    next(error);
  }
});

router.get("/", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const requests = await TranscriptRequest.find()
      .populate("studentId", "name email role")
      .sort({ requestedAt: -1 });
    return sendResponse(res, 200, requests, "Transcript requests loaded");
  } catch (error) {
    next(error);
  }
});

router.get("/:id/generate", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const request = await TranscriptRequest.findById(req.params.id).populate("studentId", "name email");
    if (!request) return sendResponse(res, 404, null, "Transcript request not found");

    const record = await StudentRecord.findOne({ userId: request.studentId._id });
    if (!record) return sendResponse(res, 404, null, "Student record not found");
    const grades = await Grade.find({ student: request.studentId._id }).populate("course").populate("assessment");

    const transcriptDir = path.resolve("uploads", "transcripts");
    fs.mkdirSync(transcriptDir, { recursive: true });

    const fileName = `transcript-${record.studentId}-${Date.now()}.pdf`;
    const filePath = path.join(transcriptDir, fileName);
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text("University Transcript", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Student ID: ${record.studentId}`);
    doc.text(`Name: ${record.fullName || record.name}`);
    doc.text(`Email: ${record.email}`);
    doc.text(`Program: ${record.program || record.department}`);
    doc.text(`Level/Year: ${record.level || record.year}`);
    doc.text(`GPA: ${Number(record.GPA ?? record.gpa ?? 0).toFixed(2)}`);
    doc.text(`Enrollment Date: ${new Date(record.enrollmentDate).toLocaleDateString()}`);
    doc.moveDown();
    doc.fontSize(14).text("Courses");
    doc.moveDown(0.5);

    const courses = record.enrolledCourses.length > 0 ? record.enrolledCourses : record.courses.map((course) => ({
      courseCode: course.code,
      courseName: course.title,
      grade: course.grade,
      credits: course.credits
    }));

    if (courses.length === 0) {
      doc.fontSize(12).text("No courses recorded.");
    } else {
      courses.forEach((course) => {
        doc.fontSize(12).text(`${course.courseCode} - ${course.courseName} | Grade: ${course.grade || "N/A"} | Credits: ${course.credits || 0}`);
      });
    }

    if (grades.length > 0) {
      doc.moveDown();
      doc.fontSize(14).text("Assessment Grades");
      doc.moveDown(0.5);
      grades.forEach((grade) => {
        doc.fontSize(12).text(`${grade.course?.courseCode} | ${grade.assessment?.title}: ${grade.grade} - ${grade.feedback || "No feedback"}`);
      });
    }

    doc.moveDown();
    doc.fontSize(10).text(`Generated on ${new Date().toLocaleString()}`);
    doc.end();

    await new Promise((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    request.status = "generated";
    request.requestStatus = "generated";
    request.generatedDate = new Date();
    request.courses = courses;
    request.grades = grades.map((grade) => ({
      courseCode: grade.course?.courseCode,
      assessmentTitle: grade.assessment?.title,
      grade: grade.grade,
      feedback: grade.feedback
    }));
    request.GPA = Number(record.GPA ?? record.gpa ?? 0);
    request.downloadUrl = `/uploads/transcripts/${fileName}`;
    await request.save();

    await createNotification({
      userId: request.studentId._id,
      title: "Transcript generated",
      message: "Your transcript is ready to download.",
      type: "transcript",
      relatedItem: { itemType: "TranscriptRequest", itemId: request._id }
    });

    return sendResponse(res, 200, request, "Transcript generated");
  } catch (error) {
    next(error);
  }
});

router.put("/:id/approve", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const request = await TranscriptRequest.findById(req.params.id);
    if (!request) return sendResponse(res, 404, null, "Transcript request not found");
    request.status = "approved";
    request.requestStatus = "approved";
    await request.save();
    return sendResponse(res, 200, request, "Transcript request approved");
  } catch (error) {
    next(error);
  }
});

export default router;
