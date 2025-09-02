import mongoose from "mongoose";

const packsTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Pack name is required"],
      trim: true,
      unique: true,
    },
    quantity: {
      type: String,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("PacksType", packsTypeSchema);
