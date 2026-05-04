import express from "express";
import User from "../models/User.js";
import StudentRecord from "../models/StudentRecord.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { sendResponse } from "../utils/apiResponse.js";

const router = express.Router();

router.post("/", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const {
      userId,
      studentId,
      fullName,
      name,
      email,
      program,
      department,
      level,
      year,
      GPA,
      gpa,
      enrolledCourses = [],
      courses = [],
      academicStatus = "active",
      contactInfo = {},
      enrollmentDate
    } = req.body;

    const nextName = fullName || name;
    const nextProgram = program || department;
    const nextLevel = Number(level || year);
    const nextGpa = Number(GPA ?? gpa);

    if (!userId || !studentId || !nextName || !email || !nextProgram || !nextLevel || Number.isNaN(nextGpa)) {
      return sendResponse(res, 400, null, "All student record fields are required");
    }

    const user = await User.findById(userId);
    if (!user) return sendResponse(res, 404, null, "Linked user not found");

    const record = await StudentRecord.create({
      userId,
      studentId,
      fullName: nextName,
      name: nextName,
      email,
      program: nextProgram,
      department: nextProgram,
      level: nextLevel,
      year: nextLevel,
      GPA: nextGpa,
      gpa: nextGpa,
      enrolledCourses,
      courses,
      academicStatus,
      contactInfo,
      enrollmentDate
    });

    return sendResponse(res, 201, record, "Student record created");
  } catch (error) {
    next(error);
  }
});

router.put("/:id", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (payload.fullName && !payload.name) payload.name = payload.fullName;
    if (payload.name && !payload.fullName) payload.fullName = payload.name;
    if (payload.program && !payload.department) payload.department = payload.program;
    if (payload.department && !payload.program) payload.program = payload.department;
    if (payload.level && !payload.year) payload.year = payload.level;
    if (payload.year && !payload.level) payload.level = payload.year;
    if (payload.GPA !== undefined && payload.gpa === undefined) payload.gpa = payload.GPA;
    if (payload.gpa !== undefined && payload.GPA === undefined) payload.GPA = payload.gpa;

    const record = await StudentRecord.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });
    if (!record) return sendResponse(res, 404, null, "Student record not found");
    return sendResponse(res, 200, record, "Student record updated");
  } catch (error) {
    next(error);
  }
});

router.get("/", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const query = req.query.query?.trim();
    const filters = query
      ? {
          $or: [
            { name: new RegExp(query, "i") },
            { fullName: new RegExp(query, "i") },
            { studentId: new RegExp(query, "i") },
            { email: new RegExp(query, "i") },
            { program: new RegExp(query, "i") },
            { department: new RegExp(query, "i") }
          ]
        }
      : {};

    const records = await StudentRecord.find(filters).populate("userId", "name email role").sort({ fullName: 1, name: 1 });
    return sendResponse(res, 200, records, "Student records loaded");
  } catch (error) {
    next(error);
  }
});

router.get("/students", authenticate, authorize("admin", "professor", "TA"), async (req, res, next) => {
  try {
    const records = await StudentRecord.find()
      .populate("userId", "name email role")
      .sort({ fullName: 1, name: 1 });
    return sendResponse(res, 200, records, "Student list loaded");
  } catch (error) {
    next(error);
  }
});

router.get("/me", authenticate, authorize("student"), async (req, res, next) => {
  try {
    const record = await StudentRecord.findOne({ userId: req.user._id }).populate("userId", "name email role");
    if (!record) return sendResponse(res, 404, null, "Student record not found");
    return sendResponse(res, 200, record, "Your student record loaded");
  } catch (error) {
    next(error);
  }
});

export default router;
