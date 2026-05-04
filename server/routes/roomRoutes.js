import express from "express";
import Room from "../models/Room.js";
import Booking from "../models/Booking.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { sendResponse } from "../utils/apiResponse.js";

const router = express.Router();

const buildRoomFilters = ({ capacity, equipment, type }) => {
  const filters = {};

  if (capacity) filters.capacity = { $gte: Number(capacity) };
  if (type) filters.type = type;
  if (equipment) {
    const equipmentList = equipment.split(",").map((item) => item.trim()).filter(Boolean);
    if (equipmentList.length > 0) filters.equipment = { $all: equipmentList.map((item) => new RegExp(item, "i")) };
  }

  return filters;
};

router.use(authenticate, authorize("student", "admin"));

router.get("/", async (req, res, next) => {
  try {
    const { date, time } = req.query;
    const rooms = await Room.find(buildRoomFilters(req.query)).sort({ name: 1 });

    if (!date || !time) {
      return sendResponse(res, 200, rooms, "Rooms loaded");
    }

    const conflictingBookings = await Booking.find({
      date,
      startTime: { $lt: time },
      endTime: { $gt: time },
      status: { $in: ["pending", "approved"] }
    }).select("roomId");

    const busyRoomIds = new Set(conflictingBookings.map((booking) => booking.roomId.toString()));
    const availableRooms = rooms.filter((room) => !busyRoomIds.has(room._id.toString()));

    return sendResponse(res, 200, availableRooms, "Available rooms loaded");
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return sendResponse(res, 404, null, "Room not found");
    return sendResponse(res, 200, room, "Room details loaded");
  } catch (error) {
    next(error);
  }
});

export default router;
