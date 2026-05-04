import express from "express";
import Course from "../models/Course.js";
import LeaveRequest from "../models/LeaveRequest.js";
import StaffProfile from "../models/StaffProfile.js";
import User from "../models/User.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { sendResponse } from "../utils/apiResponse.js";
import { createNotification } from "../utils/notifications.js";

const router = express.Router();
const staffRoles = ["professor", "TA", "staff"];

router.use(authenticate);

router.get("/", authorize("admin", "student", "professor", "TA", "staff"), async (req, res, next) => {
  try {
    const { query, department, course, role } = req.query;
    const filters = {};
    if (role) filters.role = role;
    if (department) filters.department = new RegExp(department, "i");
    if (course) filters.assignedCourses = course;
    if (query) {
      filters.$or = [
        { fullName: new RegExp(query, "i") },
        { email: new RegExp(query, "i") },
        { department: new RegExp(query, "i") }
      ];
    }

    const profiles = await StaffProfile.find(filters)
      .select(req.user.role === "admin" ? "" : "-hrData")
      .populate("user", "name email role")
      .populate("assignedCourses")
      .sort({ fullName: 1 });
    return sendResponse(res, 200, profiles, "Staff directory loaded");
  } catch (error) {
    next(error);
  }
});

router.get("/me", authorize(...staffRoles), async (req, res, next) => {
  try {
    const profile = await StaffProfile.findOne({ user: req.user._id }).populate("assignedCourses");
    if (!profile) return sendResponse(res, 404, null, "Staff profile not found");
    return sendResponse(res, 200, profile, "Your staff profile loaded");
  } catch (error) {
    next(error);
  }
});

router.post("/", authorize("admin"), async (req, res, next) => {
  try {
    const { user, fullName, role, email, phone = "", department, officeLocation = "", officeHours = "", assignedCourses = [], hrData = {} } = req.body;
    if (!user || !fullName || !role || !email || !department) {
      return sendResponse(res, 400, null, "User, name, role, email, and department are required");
    }

    const linkedUser = await User.findById(user);
    if (!linkedUser) return sendResponse(res, 404, null, "Linked user not found");
    linkedUser.role = role;
    await linkedUser.save();

    const profile = await StaffProfile.findOneAndUpdate(
      { user },
      { user, fullName, role, email, phone, department, officeLocation, officeHours, assignedCourses, hrData },
      { new: true, upsert: true, runValidators: true }
    );
    return sendResponse(res, 201, profile, "Staff profile saved");
  } catch (error) {
    next(error);
  }
});

router.put("/:id", authorize("admin"), async (req, res, next) => {
  try {
    const profile = await StaffProfile.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!profile) return sendResponse(res, 404, null, "Staff profile not found");
    return sendResponse(res, 200, profile, "Staff profile updated");
  } catch (error) {
    next(error);
  }
});

router.post("/assign-courses", authorize("admin"), async (req, res, next) => {
  try {
    const { staffUserId, courseIds = [] } = req.body;
    if (!staffUserId || !Array.isArray(courseIds)) {
      return sendResponse(res, 400, null, "Staff user and course ids are required");
    }

    const profile = await StaffProfile.findOneAndUpdate(
      { user: staffUserId },
      { assignedCourses: courseIds },
      { new: true, runValidators: true }
    );
    if (!profile) return sendResponse(res, 404, null, "Staff profile not found");

    await Course.updateMany({ instructor: staffUserId }, { $unset: { instructor: "" } });
    await Course.updateMany({ _id: { $in: courseIds }, type: { $in: ["core", "elective"] } }, { instructor: staffUserId });

    return sendResponse(res, 200, profile, "Courses assigned");
  } catch (error) {
    next(error);
  }
});

router.post("/leave", authorize(...staffRoles), async (req, res, next) => {
  try {
    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate || !reason) {
      return sendResponse(res, 400, null, "Start date, end date, and reason are required");
    }

    if (new Date(startDate) > new Date(endDate)) {
      return sendResponse(res, 400, null, "End date must be after start date");
    }

    const leave = await LeaveRequest.create({ staff: req.user._id, startDate, endDate, reason });
    return sendResponse(res, 201, leave, "Leave request submitted");
  } catch (error) {
    next(error);
  }
});

router.get("/leave", authorize("admin", ...staffRoles), async (req, res, next) => {
  try {
    const filters = req.user.role === "admin" ? {} : { staff: req.user._id };
    const leaves = await LeaveRequest.find(filters).populate("staff", "name email role").sort({ createdAt: -1 });
    return sendResponse(res, 200, leaves, "Leave requests loaded");
  } catch (error) {
    next(error);
  }
});

router.put("/leave/:id/status", authorize("admin"), async (req, res, next) => {
  try {
    const { status, adminComment = "" } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return sendResponse(res, 400, null, "Status must be approved or rejected");
    }

    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return sendResponse(res, 404, null, "Leave request not found");

    leave.status = status;
    leave.adminComment = adminComment;
    await leave.save();

    await createNotification({
      userId: leave.staff,
      title: `Leave request ${status}`,
      message: `Your leave request was ${status}.`,
      type: "leave",
      relatedItem: { itemType: "LeaveRequest", itemId: leave._id }
    });

    return sendResponse(res, 200, leave, `Leave request ${status}`);
  } catch (error) {
    next(error);
  }
});

router.get("/hr/:userId", authorize("admin", ...staffRoles), async (req, res, next) => {
  try {
    const isOwn = req.params.userId === req.user._id.toString();
    if (req.user.role !== "admin" && !isOwn) {
      return sendResponse(res, 403, null, "You can only view your own HR data");
    }

    const profile = await StaffProfile.findOne({ user: req.params.userId }).select("fullName role email department hrData");
    if (!profile) return sendResponse(res, 404, null, "Staff profile not found");
    return sendResponse(res, 200, profile, "HR data loaded");
  } catch (error) {
    next(error);
  }
});

export default router;
