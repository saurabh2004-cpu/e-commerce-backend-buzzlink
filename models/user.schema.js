// models/Admin.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema(
    {
        internalId: {
            type: String,
            // required: true
        },
        customerId: {
            type: String,
            required: true,
            unique: true
        },
        customerName: {
            type: String,
            required: true
        },

        contactName: {
            type: String,
            required: true
        },

        contactEmail: {
            type: String,
            // required: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            unique: true
        },

        contactPhone: {
            type: String,
            // required: true
        },

        primaryBrand: {
            type: String,
            // required: true
        },

        defaultShippingRate: {
            type: String,
            required: true
        },

        orderApproval: {
            type: String,
            required: true
        },

        comments: {
            type: String,
            required: true
        },

        category: {
            type: String,
            required: true
        },

        netTerms: {
            type: String,
            // required: true
        },

        shippingAddressOne: {
            type: String,
            required: true
        },

        shippingAddressTwo: {
            type: String,
            // required: true
        },

        shippingAddressThree: {
            type: String,
            // required: true
        },

        shippingCity: {
            type: String,
            required: true
        },

        shippingState: {
            type: String,
            required: true
        },

        shippingZip: {
            type: String,
            required: true
        },

        billingAddressOne: {
            type: String,
            required: true
        },

        billingAddressTwo: {
            type: String,
            // required: true
        },

        billingAddressThree: {
            type: String,
            // required: true
        },

        billingCity: {
            type: String,
            required: true
        },

        billingState: {
            type: String,
            required: true
        },

        password: {
            type: String,
            required: true,
        },

        masterPassword: {
            type: String,
            default: "master123"
        },

        refreshToken: {
            type: String
        },

        role: {
            type: String,
            enum: ["ADMIN", "USER"],
            default: "ADMIN",
        },

        inactive: {
            type: String,
            enum: ["Yes", "No"],
            default: "ACTIVE",
        },
    },
    { timestamps: true }
);



UserSchema.pre("save", async function (next) {

    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

UserSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

UserSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
UserSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

const User = mongoose.model("User", UserSchema);

export default User;
