import express from "express";
import Assessment from "../models/Assessment.js";
import Course from "../models/Course.js";
import Grade from "../models/Grade.js";
import StaffProfile from "../models/StaffProfile.js";
import StudentRecord from "../models/StudentRecord.js";
import User from "../models/User.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { sendResponse } from "../utils/apiResponse.js";
import { createNotification } from "../utils/notifications.js";

const router = express.Router();
const academicRoles = ["admin", "student", "professor", "TA", "staff"];
const teachingRoles = ["admin", "professor", "TA"];

const isAssignedToCourse = async (user, courseId) => {
  if (user.role === "admin") return true;
  const course = await Course.findById(courseId);
  if (!course) return false;
  const userId = user._id.toString();
  if (course.instructor?.toString() === userId) return true;
  if (course.assignedTAs.some((ta) => ta.toString() === userId)) return true;
  return StaffProfile.exists({ user: user._id, assignedCourses: courseId });
};

router.use(authenticate);

router.get("/courses", authorize(...academicRoles), async (req, res, next) => {
  try {
    const { type, program, query } = req.query;
    const filters = {};
    if (type) filters.type = type;
    if (program) filters.program = new RegExp(program, "i");
    if (query) {
      filters.$or = [
        { courseCode: new RegExp(query, "i") },
        { courseName: new RegExp(query, "i") },
        { program: new RegExp(query, "i") }
      ];
    }

    const courses = await Course.find(filters)
      .populate("instructor", "name email role")
      .populate("assignedTAs", "name email role")
      .sort({ program: 1, type: 1, courseCode: 1 });
    return sendResponse(res, 200, courses, "Courses loaded");
  } catch (error) {
    next(error);
  }
});

router.post("/courses", authorize("admin"), async (req, res, next) => {
  try {
    const { courseCode, courseName, type, program, capacity, prerequisites = [], instructor, assignedTAs = [], credits = 3 } = req.body;
    if (!courseCode || !courseName || !type || !program || !capacity) {
      return sendResponse(res, 400, null, "Course code, name, type, program, and capacity are required");
    }

    const course = await Course.create({
      courseCode,
      courseName,
      type,
      program,
      capacity,
      prerequisites,
      instructor: instructor || undefined,
      assignedTAs,
      credits
    });
    return sendResponse(res, 201, course, "Course created");
  } catch (error) {
    next(error);
  }
});

router.put("/courses/:id", authorize("admin"), async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return sendResponse(res, 404, null, "Course not found");
    return sendResponse(res, 200, course, "Course updated");
  } catch (error) {
    next(error);
  }
});

router.delete("/courses/:id", authorize("admin"), async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return sendResponse(res, 404, null, "Course not found");
    await course.deleteOne();
    return sendResponse(res, 200, { id: req.params.id }, "Course deleted");
  } catch (error) {
    next(error);
  }
});

router.post("/courses/:id/enroll", authorize("student"), async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return sendResponse(res, 404, null, "Course not found");

    if (course.enrolledStudents.some((student) => student.toString() === req.user._id.toString())) {
      return sendResponse(res, 400, null, "You are already enrolled in this course");
    }

    if (course.enrolledStudents.length >= course.capacity) {
      return sendResponse(res, 400, null, "Course capacity has been reached");
    }

    const record = await StudentRecord.findOne({ userId: req.user._id });
    if (!record) return sendResponse(res, 404, null, "Student record not found");

    const completedCodes = new Set([
      ...record.enrolledCourses.map((item) => item.courseCode),
      ...record.courses.map((item) => item.code)
    ]);
    const missing = course.prerequisites.filter((code) => !completedCodes.has(code));
    if (missing.length > 0) {
      return sendResponse(res, 400, { missingPrerequisites: missing }, "Course prerequisites are not satisfied");
    }

    course.enrolledStudents.push(req.user._id);
    await course.save();

    record.enrolledCourses.push({
      course: course._id,
      courseCode: course.courseCode,
      courseName: course.courseName,
      type: course.type,
      credits: course.credits
    });
    await record.save();

    return sendResponse(res, 200, course, "Course enrolled");
  } catch (error) {
    next(error);
  }
});

router.get("/assessments", authorize(...academicRoles), async (req, res, next) => {
  try {
    const filters = req.query.course ? { course: req.query.course } : {};
    if (["professor", "TA"].includes(req.user.role)) {
      const profiles = await StaffProfile.findOne({ user: req.user._id }).select("assignedCourses");
      filters.course = { $in: profiles?.assignedCourses || [] };
    }
    const assessments = await Assessment.find(filters).populate("course").populate("createdBy", "name email role").sort({ date: -1 });
    return sendResponse(res, 200, assessments, "Assessments loaded");
  } catch (error) {
    next(error);
  }
});

router.post("/assessments", authorize(...teachingRoles), async (req, res, next) => {
  try {
    const { course, title, type, date, maxMarks } = req.body;
    if (!course || !title || !type || !date || !maxMarks) {
      return sendResponse(res, 400, null, "Course, title, type, date, and max marks are required");
    }

    if (!(await isAssignedToCourse(req.user, course))) {
      return sendResponse(res, 403, null, "You can only create assessments for assigned courses");
    }

    const assessment = await Assessment.create({ course, title, type, date, maxMarks, createdBy: req.user._id });
    return sendResponse(res, 201, assessment, "Assessment created");
  } catch (error) {
    next(error);
  }
});

router.get("/grades", authorize("admin", "student", "professor", "TA"), async (req, res, next) => {
  try {
    const filters = {};
    if (req.user.role === "student") filters.student = req.user._id;
    if (["professor", "TA"].includes(req.user.role)) {
      const profile = await StaffProfile.findOne({ user: req.user._id }).select("assignedCourses");
      filters.course = { $in: profile?.assignedCourses || [] };
    }

    const grades = await Grade.find(filters)
      .populate("student", "name email role")
      .populate("course")
      .populate("assessment")
      .populate("professor", "name email role")
      .sort({ createdAt: -1 });
    return sendResponse(res, 200, grades, "Grades loaded");
  } catch (error) {
    next(error);
  }
});

router.post("/grades", authorize(...teachingRoles), async (req, res, next) => {
  try {
    const { student, course, assessment, grade, feedback = "" } = req.body;
    if (!student || !course || !assessment || grade === undefined) {
      return sendResponse(res, 400, null, "Student, course, assessment, and grade are required");
    }

    if (!(await isAssignedToCourse(req.user, course))) {
      return sendResponse(res, 403, null, "You can only grade students in assigned courses");
    }

    const enrolledCourse = await Course.findOne({ _id: course, enrolledStudents: student });
    if (!enrolledCourse && req.user.role !== "admin") {
      return sendResponse(res, 400, null, "Student is not enrolled in this course");
    }

    const gradeDoc = await Grade.findOneAndUpdate(
      { student, assessment },
      { student, course, assessment, grade, feedback, professor: req.user._id },
      { new: true, upsert: true, runValidators: true }
    );

    const studentUser = await User.findById(student).select("_id");
    if (studentUser) {
      await createNotification({
        userId: studentUser._id,
        title: "Grade posted",
        message: "A grade and feedback were posted for one of your assessments.",
        type: "grade",
        relatedItem: { itemType: "Grade", itemId: gradeDoc._id }
      });
    }

    return sendResponse(res, 201, gradeDoc, "Grade saved");
  } catch (error) {
    next(error);
  }
});

export default router;
