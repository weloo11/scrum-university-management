import express from "express";
import Application from "../models/Application.js";
import Notification from "../models/Notification.js";
import StudentRecord from "../models/StudentRecord.js";
import User from "../models/User.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { sendResponse } from "../utils/apiResponse.js";

const router = express.Router();

router.post("/", authenticate, authorize("user"), upload.array("documents", 5), async (req, res, next) => {
  try {
    const { applicantName, name, email, phone, desiredProgram, department, notes = "" } = req.body;
    const nextName = applicantName || name;
    const nextProgram = desiredProgram || department;

    if (!nextName || !email || !phone || !nextProgram) {
      return sendResponse(res, 400, null, "Name, email, phone, and department are required");
    }

    if (email.toLowerCase() !== req.user.email) {
      return sendResponse(res, 400, null, "Application email must match your registered account email");
    }

    const existingStudentRecord = await StudentRecord.findOne({ userId: req.user._id });
    if (req.user.role === "student" || existingStudentRecord) {
      return sendResponse(res, 400, null, "Enrolled students cannot submit admission applications");
    }

    const existingPending = await Application.findOne({ email: req.user.email, status: "pending" });
    if (existingPending) {
      return sendResponse(res, 400, existingPending, "You already have a pending application");
    }

    const application = await Application.create({
      applicantName: nextName,
      name: nextName,
      email: req.user.email,
      phone,
      desiredProgram: nextProgram,
      department: nextProgram,
      notes,
      documents: (req.files || []).map((file) => `/uploads/admissions/${file.filename}`)
    });

    return sendResponse(res, 201, application, "Application submitted");
  } catch (error) {
    next(error);
  }
});

router.get("/", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const filters = req.query.status === "all" ? {} : { status: req.query.status || "pending" };
    const applications = await Application.find(filters).sort({ submittedAt: -1 });
    return sendResponse(res, 200, applications, "Applications loaded");
  } catch (error) {
    next(error);
  }
});

router.put("/:id/status", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const { status, adminComment = "" } = req.body;
    if (!["accepted", "rejected"].includes(status)) {
      return sendResponse(res, 400, null, "Status must be accepted or rejected");
    }

    const application = await Application.findById(req.params.id);
    if (!application) return sendResponse(res, 404, null, "Application not found");

    const applicantUser = await User.findOne({ email: application.email });
    if (status === "accepted" && !applicantUser) {
      return sendResponse(res, 404, null, "No registered user found for this application email");
    }

    if (status === "accepted") {
      applicantUser.role = "student";
      await applicantUser.save();

      await StudentRecord.findOneAndUpdate(
        { userId: applicantUser._id },
        {
          userId: applicantUser._id,
          studentId: `STU-${new Date().getFullYear()}-${applicantUser._id.toString().slice(-6).toUpperCase()}`,
          fullName: application.applicantName || application.name,
          name: application.applicantName || application.name,
          email: application.email,
          program: application.desiredProgram || application.department,
          department: application.desiredProgram || application.department,
          level: 1,
          year: 1,
          GPA: 0,
          gpa: 0,
          enrolledCourses: [],
          courses: [],
          enrollmentDate: new Date()
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await Notification.create({
        userId: applicantUser._id,
        title: "Admission accepted",
        message: "Your admission application was accepted. Student features are now available."
      });
    }

    if (status === "rejected") {
      if (applicantUser) {
        await Notification.create({
          userId: applicantUser._id,
          title: "Admission rejected",
          message: "Your admission application was rejected."
        });
      }
    }

    application.status = status;
    application.adminComment = adminComment;
    await application.save();

    console.log(`[admission] ${application.email}: Application ${status}`);
    return sendResponse(res, 200, application, `Application ${status}`);
  } catch (error) {
    next(error);
  }
});

router.get("/status/:email", async (req, res, next) => {
  try {
    const application = await Application.findOne({ email: req.params.email.toLowerCase() }).sort({ submittedAt: -1 });
    if (!application) return sendResponse(res, 404, null, "No application found for that email");
    return sendResponse(res, 200, application, "Application status loaded");
  } catch (error) {
    next(error);
  }
});

export default router;
