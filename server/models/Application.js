import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    applicantName: {
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
    phone: {
      type: String,
      required: true,
      trim: true
    },
    desiredProgram: {
      type: String,
      trim: true
    },
    department: {
      type: String,
      trim: true
    },
    documents: [
      {
        type: String,
        trim: true
      }
    ],
    notes: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    },
    adminComment: {
      type: String,
      default: ""
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model("Application", applicationSchema);
