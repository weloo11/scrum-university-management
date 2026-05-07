import express from "express";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Notification from "../models/Notification.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { sendResponse } from "../utils/apiResponse.js";

const router = express.Router();

const hasConflict = async ({ roomId, date, startTime, endTime, excludeId = null }) => {
  const query = {
    roomId,
    date,
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
    status: { $in: ["pending", "approved"] }
  };

  if (excludeId) query._id = { $ne: excludeId };
  return Booking.exists(query);
};

const validateBookingTime = (startTime, endTime) => {
  return typeof startTime === "string" && typeof endTime === "string" && startTime < endTime;
};

router.post("/", authenticate, authorize("student", "admin"), async (req, res, next) => {
  try {
    const { roomId, date, startTime, endTime, purpose } = req.body;

    if (!roomId || !date || !startTime || !endTime || !purpose) {
      return sendResponse(res, 400, null, "Room, date, start time, end time, and purpose are required");
    }

    if (!validateBookingTime(startTime, endTime)) {
      return sendResponse(res, 400, null, "End time must be later than start time");
    }

    const room = await Room.findById(roomId);
    if (!room) return sendResponse(res, 404, null, "Room not found");

    if (await hasConflict({ roomId, date, startTime, endTime })) {
      return sendResponse(res, 409, null, "Room is already booked in that time slot");
    }

    const booking = await Booking.create({
      roomId,
      userId: req.user._id,
      date,
      startTime,
      endTime,
      purpose,
      status: "pending"
    });

    const populated = await booking.populate(["roomId", "userId"]);
    return sendResponse(res, 201, populated, "Booking request created");
  } catch (error) {
    next(error);
  }
});

router.get("/my", authenticate, authorize("student", "admin"), async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate("roomId")
      .sort({ date: -1, startTime: -1 });
    return sendResponse(res, 200, bookings, "Your bookings loaded");
  } catch (error) {
    next(error);
  }
});

router.get("/", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const filters = req.query.status === "all" ? {} : { status: req.query.status || "pending" };
    const bookings = await Booking.find(filters)
      .populate("roomId")
      .populate("userId", "name email role")
      .sort({ createdAt: -1 });
    return sendResponse(res, 200, bookings, "Bookings loaded");
  } catch (error) {
    next(error);
  }
});

router.put("/:id", authenticate, authorize("student", "admin"), async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return sendResponse(res, 404, null, "Booking not found");

    const isOwner = booking.userId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return sendResponse(res, 403, null, "You can only modify your own bookings");
    }

    if (req.user.role !== "admin" && booking.status !== "pending") {
      return sendResponse(res, 403, null, "Only pending bookings can be edited");
    }

    const nextValues = {
      roomId: req.body.roomId || booking.roomId,
      date: req.body.date || booking.date,
      startTime: req.body.startTime || booking.startTime,
      endTime: req.body.endTime || booking.endTime,
      purpose: req.body.purpose?.trim() || booking.purpose
    };

    if (!nextValues.roomId || !nextValues.date || !nextValues.startTime || !nextValues.endTime || !nextValues.purpose) {
      return sendResponse(res, 400, null, "Room, date, start time, end time, and purpose are required");
    }

    if (!validateBookingTime(nextValues.startTime, nextValues.endTime)) {
      return sendResponse(res, 400, null, "End time must be later than start time");
    }

    const room = await Room.findById(nextValues.roomId);
    if (!room) return sendResponse(res, 404, null, "Room not found");

    if (await hasConflict({ ...nextValues, excludeId: booking._id })) {
      return sendResponse(res, 409, null, "Room is already booked in that time slot");
    }

    Object.assign(booking, nextValues);
    await booking.save();

    const populated = await booking.populate(["roomId", "userId"]);
    return sendResponse(res, 200, populated, "Booking updated");
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", authenticate, authorize("student", "admin"), async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return sendResponse(res, 404, null, "Booking not found");

    const isOwner = booking.userId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return sendResponse(res, 403, null, "You can only cancel your own bookings");
    }

    await booking.deleteOne();
    return sendResponse(res, 200, { id: req.params.id }, "Booking cancelled");
  } catch (error) {
    next(error);
  }
});

router.put("/:id/status", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return sendResponse(res, 400, null, "Status must be approved or rejected");
    }

    const booking = await Booking.findById(req.params.id).populate("roomId").populate("userId", "name email");
    if (!booking) return sendResponse(res, 404, null, "Booking not found");

    booking.status = status;
    await booking.save();

    const notification = await Notification.create({
      userId: booking.userId._id,
      title: `Booking ${status}`,
      message: `Your booking for ${booking.roomId.name} on ${booking.date} was ${status}.`
    });

    console.log(`[notification] ${booking.userId.email}: ${notification.message}`);
    return sendResponse(res, 200, booking, `Booking ${status}`);
  } catch (error) {
    next(error);
  }
});

export default router;
