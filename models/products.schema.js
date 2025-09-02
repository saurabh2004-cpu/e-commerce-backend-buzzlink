// models/Product.js
import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const productSchema = new mongoose.Schema(
    {
        internalId: {
            type: String,
            trim: true
        },
        sku: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true
        },
        ProductName: {
            type: String,
            required: true,
            trim: true
        },

        eachPrice: {
            type: Number,
            min: 0
        },
        type: {
            type: String,
            enum: ["Inventory Item", "Kit/Package", "Service", "Non-Inventory Item"],
            default: "Inventory Item"
        },
        primaryUnitsType: {
            type: String,
            trim: true
        },
        sellingUOMUnit: {
            type: String,
            trim: true
        },
        stockLevel: {
            type: Number,
            default: 0,
            min: 0
        },
        typesOfPacks: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PacksType",
        },
        excludedUnitsOnStore: [{
            type: [mongoose.Schema.Types.ObjectId],
            ref: "PacksType",
        }],

        pricingGroup: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PricingGroups",
            required: true
        },
        
        displayInWebsite: {
            type: Boolean,
            default: true
        },
        inactive: {
            type: Boolean,
            default: false
        },
        commerceCategoriesOne: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Brand',
        },
        commerceCategoriesTwo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
        },
        commerceCategoriesThree: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubCategory',
        },
        storeDescription: {
            type: String,
            trim: true
        },
        pageTitle: {
            type: String,
            trim: true
        },
        eachBarcodes: {
            type: String,
            trim: true
        },
        packBarcodes: {
            type: String,
            trim: true
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Generate slug before saving
productSchema.pre("save", function (next) {
    if (this.isModified("name") || this.isNew) {
        this.slug = this.ProductName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});



productSchema.plugin(mongooseAggregatePaginate);

const Product = mongoose.model("Product", productSchema);

export default Product;