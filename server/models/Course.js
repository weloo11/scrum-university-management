import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    courseName: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["core", "elective"],
      required: true
    },
    program: {
      type: String,
      required: true,
      trim: true
    },
    capacity: {
      type: Number,
      required: true,
      min: 1
    },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    prerequisites: [
      {
        type: String,
        uppercase: true,
        trim: true
      }
    ],
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    assignedTAs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    credits: {
      type: Number,
      default: 3,
      min: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);
