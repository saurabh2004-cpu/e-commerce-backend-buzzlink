import mongoose from "mongoose";


const pricingGroupsSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        }
    },
    { timestamps: true }
);

const PricingGroups = mongoose.model("PricingGroups", pricingGroupsSchema);

export default PricingGroups;