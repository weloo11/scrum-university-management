import mongoose from "mongoose";

const studentRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    fullName: {
      type: String,
      trim: true
    },
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    program: {
      type: String,
      trim: true
    },
    department: {
      type: String,
      trim: true
    },
    level: {
      type: Number,
      min: 1,
      max: 8
    },
    year: {
      type: Number,
      min: 1,
      max: 8
    },
    GPA: {
      type: Number,
      min: 0,
      max: 4
    },
    gpa: {
      type: Number,
      min: 0,
      max: 4
    },
    enrolledCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course"
        },
        courseCode: String,
        courseName: String,
        type: {
          type: String
        },
        grade: String,
        credits: Number
      }
    ],
    courses: [
      {
        code: String,
        title: String,
        grade: String,
        credits: Number
      }
    ],
    academicStatus: {
      type: String,
      enum: ["active", "probation", "suspended", "graduated"],
      default: "active"
    },
    contactInfo: {
      phone: String,
      address: String,
      emergencyContact: String
    },
    enrollmentDate: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model("StudentRecord", studentRecordSchema);
