import mongoose from "mongoose";

const deliveryVendorSchema = new mongoose.Schema(
  {
    vendorName: {
      type: String,
      required: true,
      trim: true,
    },
    vendorTrackingUrl: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const DeliveryVendor = mongoose.model("DeliveryVendor", deliveryVendorSchema);

export default DeliveryVendor;
