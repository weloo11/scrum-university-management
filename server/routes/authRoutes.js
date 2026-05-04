import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { sendResponse } from "../utils/apiResponse.js";

const router = express.Router();

const createToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return sendResponse(res, 400, null, "Name, email, and password are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendResponse(res, 400, null, "Email is already registered");
    }

    const user = await User.create({ name, email, password, role: "user" });
    return sendResponse(res, 201, { user: publicUser(user), token: createToken(user) }, "Registered successfully");
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendResponse(res, 400, null, "Email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return sendResponse(res, 401, null, "Invalid email or password");
    }

    return sendResponse(res, 200, { user: publicUser(user), token: createToken(user) }, "Logged in successfully");
  } catch (error) {
    next(error);
  }
});

router.get("/me", authenticate, (req, res) => {
  return sendResponse(res, 200, { user: publicUser(req.user) }, "Current user loaded");
});

router.get("/users", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ name: 1 });
    return sendResponse(res, 200, users, "Users loaded");
  } catch (error) {
    next(error);
  }
});

router.put("/users/:id/role", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["admin", "student", "professor", "TA", "staff", "user"].includes(role)) {
      return sendResponse(res, 400, null, "Invalid role selected");
    }

    const user = await User.findById(req.params.id);
    if (!user) return sendResponse(res, 404, null, "User not found");

    user.role = role;
    await user.save();

    return sendResponse(res, 200, publicUser(user), "User role updated");
  } catch (error) {
    next(error);
  }
});

export default router;
