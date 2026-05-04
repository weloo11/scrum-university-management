import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["exam", "assignment", "quiz"],
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 1
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Assessment", assessmentSchema);
