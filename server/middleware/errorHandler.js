import { sendResponse } from "../utils/apiResponse.js";

export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Server error";

  if (err.name === "ValidationError") {
    return sendResponse(res, 400, null, Object.values(err.errors).map((item) => item.message).join(", "));
  }

  if (err.name === "CastError") {
    return sendResponse(res, 400, null, "Invalid resource id");
  }

  if (err.code === 11000) {
    return sendResponse(res, 400, null, "Duplicate value already exists");
  }

  return sendResponse(res, statusCode, null, message);
};
