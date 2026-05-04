import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["classroom", "lab"],
      required: true
    },
    capacity: {
      type: Number,
      required: true,
      min: 1
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    facilities: [
      {
        type: String,
        trim: true
      }
    ],
    equipment: [
      {
        type: String,
        trim: true
      }
    ],
    images: [
      {
        type: String,
        trim: true
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Room", roomSchema);
