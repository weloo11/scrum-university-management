import express from "express";
import Notification from "../models/Notification.js";
import { authenticate } from "../middleware/auth.js";
import { sendResponse } from "../utils/apiResponse.js";

const router = express.Router();

router.get("/", authenticate, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const unreadCount = notifications.filter((notification) => !notification.read && !notification.isRead).length;
    return sendResponse(res, 200, { notifications, unreadCount }, "Notifications loaded");
  } catch (error) {
    next(error);
  }
});

router.put("/:id/read", authenticate, async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user._id });
    if (!notification) return sendResponse(res, 404, null, "Notification not found");

    notification.read = true;
    notification.isRead = true;
    await notification.save();
    return sendResponse(res, 200, notification, "Notification marked as read");
  } catch (error) {
    next(error);
  }
});

export default router;
