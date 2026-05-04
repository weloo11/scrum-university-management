import mongoose from "mongoose";

const transcriptRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    courses: [
      {
        courseCode: String,
        courseName: String,
        grade: String,
        credits: Number
      }
    ],
    grades: [
      {
        courseCode: String,
        assessmentTitle: String,
        grade: Number,
        feedback: String
      }
    ],
    GPA: {
      type: Number,
      min: 0,
      max: 4
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ["pending", "approved", "generated"],
      default: "pending"
    },
    requestStatus: {
      type: String,
      enum: ["pending", "approved", "generated"],
      default: "pending"
    },
    generatedDate: Date,
    downloadUrl: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

export default mongoose.model("TranscriptRequest", transcriptRequestSchema);
