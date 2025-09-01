// models/Tax.js
import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const taxSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            maxLength: 100
        },
        percentage: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            validate: {
                validator: function (value) {
                    return value >= 0 && value <= 100;
                },
                message: 'Tax percentage must be between 0 and 100'
            }
        },

    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual for formatted percentage display
taxSchema.virtual('formattedPercentage').get(function () {
    return `${this.percentage}%`;
});

// Index for better query performance
taxSchema.index({ name: 1 });
taxSchema.index({ isActive: 1 });
taxSchema.index({ percentage: 1 });

taxSchema.plugin(mongooseAggregatePaginate);

const Tax = mongoose.model("Tax", taxSchema);

export default Tax;