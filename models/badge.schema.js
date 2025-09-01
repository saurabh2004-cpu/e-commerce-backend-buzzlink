import mongoose from "mongoose";

const ItemBadgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    backgroundColor: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    shape: {
      type: String,
      trim: true,
    },
    internalId: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

  },
  { timestamps: true }
);

const ItemBadge = mongoose.model("ItemBadge", ItemBadgeSchema);

export default ItemBadge;
