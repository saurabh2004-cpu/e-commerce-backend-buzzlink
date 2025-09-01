import mongoose from "mongoose";

const itemBaseddiscountschema = new mongoose.Schema(
    {
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: true
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