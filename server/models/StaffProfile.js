import mongoose from "mongoose";

const staffProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ["professor", "TA", "staff"],
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      default: ""
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    officeLocation: {
      type: String,
      default: ""
    },
    officeHours: {
      type: String,
      default: ""
    },
    assignedCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
      }
    ],
    hrData: {
      title: String,
      employmentType: String,
      salaryBand: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("StaffProfile", staffProfileSchema);
