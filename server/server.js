import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import issueRoutes from "./routes/issueRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import recordRoutes from "./routes/recordRoutes.js";
import admissionRoutes from "./routes/admissionRoutes.js";
import transcriptRoutes from "./routes/transcriptRoutes.js";
import academicRoutes from "./routes/academicRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { sendResponse } from "./utils/apiResponse.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve("uploads")));

app.get("/api/health", (req, res) => sendResponse(res, 200, { uptime: process.uptime() }, "API is running"));
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/admissions", admissionRoutes);
app.use("/api/transcripts", transcriptRoutes);
app.use("/api/academic", academicRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/community", communityRoutes);

app.use(notFound);
app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  });
