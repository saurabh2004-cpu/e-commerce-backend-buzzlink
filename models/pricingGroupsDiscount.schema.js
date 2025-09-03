// models/PricingGroupDiscount.js
import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const pricingGroupDiscountSchema = new mongoose.Schema(
    {
        productSku: {
            type: String,
            required: true
        },
        pricingGroup: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PricingGroups",
            // required: true
        },
        customerId: {
            type: String,
            required: true
        },
        percentage: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        }
    },
    { timestamps: true }
);


const PricingGroupDiscount = mongoose.model("PricingGroupDiscount", pricingGroupDiscountSchema);

export default PricingGroupDiscount;