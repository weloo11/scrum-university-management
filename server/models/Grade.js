import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true
    },
    grade: {
      type: Number,
      required: true,
      min: 0
    },
    feedback: {
      type: String,
      default: ""
    },
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

gradeSchema.index({ student: 1, assessment: 1 }, { unique: true });

export default mongoose.model("Grade", gradeSchema);
