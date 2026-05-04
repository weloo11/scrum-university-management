import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendResponse } from "../utils/apiResponse.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return sendResponse(res, 401, null, "Authentication token is required");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return sendResponse(res, 401, null, "User account no longer exists");
    }

    req.user = user;
    next();
  } catch (error) {
    return sendResponse(res, 401, null, "Invalid or expired token");
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendResponse(res, 403, null, "You do not have permission to access this resource");
    }

    next();
  };
};
