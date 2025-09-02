import mongoose from "mongoose";

const itemBaseddiscountschema = new mongoose.Schema(
    {
        productSku: {
            type: String,
            required: true
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
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


const ItemBasedDiscount = mongoose.model("ItemBasedDiscount", itemBaseddiscountschema);

export default ItemBasedDiscount;