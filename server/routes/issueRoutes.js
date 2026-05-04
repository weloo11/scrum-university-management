import express from "express";
import Issue from "../models/Issue.js";
import Notification from "../models/Notification.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { sendResponse } from "../utils/apiResponse.js";

const router = express.Router();

router.post("/", authenticate, upload.single("image"), async (req, res, next) => {
  try {
    const { roomId, description } = req.body;

    if (!roomId || !description) {
      return sendResponse(res, 400, null, "Room and description are required");
    }

    const room = await Room.findById(roomId);
    if (!room) return sendResponse(res, 404, null, "Room not found");

    const issue = await Issue.create({
      roomId,
      reportedBy: req.user._id,
      description,
      imageUrl: req.file ? `/uploads/issues/${req.file.filename}` : ""
    });

    const populated = await issue.populate(["roomId", "reportedBy"]);
    const admins = await User.find({ role: "admin" }).select("_id email");
    await Notification.insertMany(
      admins.map((admin) => ({
        userId: admin._id,
        title: "New maintenance request",
        message: `${req.user.name} reported an issue in ${room.name}.`
      }))
    );
    admins.forEach((admin) => {
      console.log(`[notification] ${admin.email}: New maintenance request in ${room.name}`);
    });

    return sendResponse(res, 201, populated, "Issue reported");
  } catch (error) {
    next(error);
  }
});

router.get("/", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const issues = await Issue.find()
      .populate("roomId")
      .populate("reportedBy", "name email role")
      .sort({ createdAt: -1 });
    return sendResponse(res, 200, issues, "Issues loaded");
  } catch (error) {
    next(error);
  }
});

router.put("/:id/status", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["open", "in_progress", "resolved"].includes(status)) {
      return sendResponse(res, 400, null, "Invalid issue status");
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) return sendResponse(res, 404, null, "Issue not found");

    issue.status = status;
    await issue.save();

    const populated = await issue.populate(["roomId", "reportedBy"]);
    return sendResponse(res, 200, populated, "Issue status updated");
  } catch (error) {
    next(error);
  }
});

export default router;
