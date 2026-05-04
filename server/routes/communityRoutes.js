import express from "express";
import Announcement from "../models/Announcement.js";
import Event from "../models/Event.js";
import ForumPost from "../models/ForumPost.js";
import Meeting from "../models/Meeting.js";
import Message from "../models/Message.js";
import StaffProfile from "../models/StaffProfile.js";
import User from "../models/User.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { sendResponse } from "../utils/apiResponse.js";
import { createNotification, notifyAudience } from "../utils/notifications.js";

const router = express.Router();
const signedInRoles = ["admin", "student", "professor", "TA", "staff"];
const moderatorRoles = ["admin", "professor", "TA"];

router.use(authenticate);

const visibleAudienceFilter = (role) => {
  if (role === "student") return { targetAudience: { $in: ["all", "students"] } };
  if (["professor", "TA", "staff"].includes(role)) return { targetAudience: { $in: ["all", "staff"] } };
  return {};
};

router.get("/messages", authorize(...signedInRoles), async (req, res, next) => {
  try {
    const filters =
      req.user.role === "admin"
        ? {}
        : { $or: [{ sender: req.user._id }, { receiver: req.user._id }] };
    const messages = await Message.find(filters)
      .populate("sender", "name email role")
      .populate("receiver", "name email role")
      .sort({ createdAt: -1 });
    return sendResponse(res, 200, messages, "Messages loaded");
  } catch (error) {
    next(error);
  }
});

router.post("/messages", authorize(...signedInRoles), async (req, res, next) => {
  try {
    const { receiver, content } = req.body;
    if (!receiver || !content) return sendResponse(res, 400, null, "Receiver and content are required");

    const receiverUser = await User.findById(receiver).select("name role");
    if (!receiverUser) return sendResponse(res, 404, null, "Receiver not found");

    const allowedStudentTarget = req.user.role === "student" && ["professor", "TA"].includes(receiverUser.role);
    const allowedStaffReply = ["professor", "TA", "admin"].includes(req.user.role);
    if (!allowedStudentTarget && !allowedStaffReply) {
      return sendResponse(res, 403, null, "You cannot message this user");
    }

    const message = await Message.create({ sender: req.user._id, receiver, content });
    await createNotification({
      userId: receiver,
      title: "New message",
      message: `${req.user.name} sent you a message.`,
      type: "message",
      relatedItem: { itemType: "Message", itemId: message._id }
    });

    return sendResponse(res, 201, message, "Message sent");
  } catch (error) {
    next(error);
  }
});

router.put("/messages/:id/read", authorize(...signedInRoles), async (req, res, next) => {
  try {
    const message = await Message.findOne({ _id: req.params.id, receiver: req.user._id });
    if (!message) return sendResponse(res, 404, null, "Message not found");
    message.readStatus = true;
    await message.save();
    return sendResponse(res, 200, message, "Message marked as read");
  } catch (error) {
    next(error);
  }
});

router.get("/forum", authorize(...signedInRoles), async (req, res, next) => {
  try {
    const filters = req.query.course ? { course: req.query.course } : {};
    if (!moderatorRoles.includes(req.user.role)) filters.hidden = false;
    const posts = await ForumPost.find(filters)
      .populate("author", "name email role")
      .populate("course")
      .populate("replies.author", "name email role")
      .sort({ createdAt: -1 });
    return sendResponse(res, 200, posts, "Forum posts loaded");
  } catch (error) {
    next(error);
  }
});

router.post("/forum", authorize("student", ...moderatorRoles), async (req, res, next) => {
  try {
    const { title, content, course, topic = "" } = req.body;
    if (!title || !content) return sendResponse(res, 400, null, "Title and content are required");
    const post = await ForumPost.create({ title, content, course: course || undefined, topic, author: req.user._id });
    return sendResponse(res, 201, post, "Forum post created");
  } catch (error) {
    next(error);
  }
});

router.post("/forum/:id/replies", authorize(...signedInRoles), async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return sendResponse(res, 400, null, "Reply content is required");
    const post = await ForumPost.findById(req.params.id);
    if (!post) return sendResponse(res, 404, null, "Forum post not found");
    post.replies.push({ author: req.user._id, content });
    await post.save();
    return sendResponse(res, 201, post, "Reply added");
  } catch (error) {
    next(error);
  }
});

router.put("/forum/:id", authorize(...signedInRoles), async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return sendResponse(res, 404, null, "Forum post not found");
    const canModerate = moderatorRoles.includes(req.user.role);
    const isOwner = post.author.toString() === req.user._id.toString();
    if (!canModerate && !isOwner) return sendResponse(res, 403, null, "You cannot edit this post");
    Object.assign(post, req.body);
    await post.save();
    return sendResponse(res, 200, post, "Forum post updated");
  } catch (error) {
    next(error);
  }
});

router.delete("/forum/:id", authorize(...signedInRoles), async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return sendResponse(res, 404, null, "Forum post not found");
    const canModerate = moderatorRoles.includes(req.user.role);
    const isOwner = post.author.toString() === req.user._id.toString();
    if (!canModerate && !isOwner) return sendResponse(res, 403, null, "You cannot delete this post");
    await post.deleteOne();
    return sendResponse(res, 200, { id: req.params.id }, "Forum post deleted");
  } catch (error) {
    next(error);
  }
});

router.get("/meetings", authorize("admin", "student", "professor", "TA"), async (req, res, next) => {
  try {
    const filters = {};
    if (req.user.role === "student") filters.student = req.user._id;
    if (["professor", "TA"].includes(req.user.role)) filters.professor = req.user._id;
    const meetings = await Meeting.find(filters)
      .populate("student", "name email role")
      .populate("professor", "name email role")
      .sort({ date: -1, timeSlot: 1 });
    return sendResponse(res, 200, meetings, "Meetings loaded");
  } catch (error) {
    next(error);
  }
});

router.post("/meetings", authorize("student"), async (req, res, next) => {
  try {
    const { professor, date, timeSlot } = req.body;
    if (!professor || !date || !timeSlot) return sendResponse(res, 400, null, "Professor, date, and time slot are required");

    const staffProfile = await StaffProfile.findOne({ user: professor, role: { $in: ["professor", "TA"] } });
    if (!staffProfile) return sendResponse(res, 404, null, "Professor or TA profile not found");

    const existing = await Meeting.exists({ professor, date, timeSlot, status: { $in: ["pending", "confirmed"] } });
    if (existing) return sendResponse(res, 409, null, "That meeting slot is already booked");

    const meeting = await Meeting.create({ student: req.user._id, professor, date, timeSlot });
    await createNotification({
      userId: professor,
      title: "New meeting request",
      message: `${req.user.name} requested a meeting.`,
      type: "meeting",
      relatedItem: { itemType: "Meeting", itemId: meeting._id }
    });
    return sendResponse(res, 201, meeting, "Meeting requested");
  } catch (error) {
    next(error);
  }
});

router.put("/meetings/:id/status", authorize("admin", "professor", "TA"), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["confirmed", "cancelled"].includes(status)) {
      return sendResponse(res, 400, null, "Status must be confirmed or cancelled");
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return sendResponse(res, 404, null, "Meeting not found");
    if (req.user.role !== "admin" && meeting.professor.toString() !== req.user._id.toString()) {
      return sendResponse(res, 403, null, "You can only manage your own meeting requests");
    }

    meeting.status = status;
    await meeting.save();
    await createNotification({
      userId: meeting.student,
      title: `Meeting ${status}`,
      message: `Your meeting request was ${status}.`,
      type: "meeting",
      relatedItem: { itemType: "Meeting", itemId: meeting._id }
    });

    return sendResponse(res, 200, meeting, `Meeting ${status}`);
  } catch (error) {
    next(error);
  }
});

router.get("/announcements", authorize(...signedInRoles), async (req, res, next) => {
  try {
    const filters = visibleAudienceFilter(req.user.role);
    if (req.query.category) filters.category = new RegExp(req.query.category, "i");
    const announcements = await Announcement.find(filters).populate("createdBy", "name email role").sort({ createdAt: -1 });
    return sendResponse(res, 200, announcements, "Announcements loaded");
  } catch (error) {
    next(error);
  }
});

router.post("/announcements", authorize("admin"), async (req, res, next) => {
  try {
    const { title, body, category, targetAudience = "all" } = req.body;
    if (!title || !body || !category) return sendResponse(res, 400, null, "Title, body, and category are required");
    const announcement = await Announcement.create({ title, body, category, targetAudience, createdBy: req.user._id });
    await notifyAudience({
      targetAudience,
      title: "New announcement",
      message: title,
      type: "announcement",
      relatedItem: { itemType: "Announcement", itemId: announcement._id }
    });
    return sendResponse(res, 201, announcement, "Announcement created");
  } catch (error) {
    next(error);
  }
});

router.put("/announcements/:id", authorize("admin"), async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!announcement) return sendResponse(res, 404, null, "Announcement not found");
    return sendResponse(res, 200, announcement, "Announcement updated");
  } catch (error) {
    next(error);
  }
});

router.delete("/announcements/:id", authorize("admin"), async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return sendResponse(res, 404, null, "Announcement not found");
    await announcement.deleteOne();
    return sendResponse(res, 200, { id: req.params.id }, "Announcement deleted");
  } catch (error) {
    next(error);
  }
});

router.get("/events", authorize(...signedInRoles), async (req, res, next) => {
  try {
    const events = await Event.find().populate("createdBy", "name email role").sort({ date: 1, time: 1 });
    return sendResponse(res, 200, events, "Events loaded");
  } catch (error) {
    next(error);
  }
});

router.post("/events", authorize("admin"), async (req, res, next) => {
  try {
    const { title, description, date, time, location } = req.body;
    if (!title || !description || !date || !time || !location) {
      return sendResponse(res, 400, null, "Title, description, date, time, and location are required");
    }
    const event = await Event.create({ title, description, date, time, location, createdBy: req.user._id });
    await notifyAudience({
      targetAudience: "all",
      title: "New event",
      message: title,
      type: "event",
      relatedItem: { itemType: "Event", itemId: event._id }
    });
    return sendResponse(res, 201, event, "Event created");
  } catch (error) {
    next(error);
  }
});

router.put("/events/:id", authorize("admin"), async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!event) return sendResponse(res, 404, null, "Event not found");
    return sendResponse(res, 200, event, "Event updated");
  } catch (error) {
    next(error);
  }
});

router.delete("/events/:id", authorize("admin"), async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return sendResponse(res, 404, null, "Event not found");
    await event.deleteOne();
    return sendResponse(res, 200, { id: req.params.id }, "Event deleted");
  } catch (error) {
    next(error);
  }
});

export default router;
