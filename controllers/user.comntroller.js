import bcrypt from "bcrypt";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import { generateAccessAndRefreshTokens } from "../utils/helper.js";
import User from "../models/user.schema.js";



// 1.signup
 const userSignup = async (req, res) => {
    try {
        const {
            customerId,
            customerName,
            contactName,
            contactEmail,
            email,
            phone,
            contactPhone,
            primaryBrand,
            defaultShippingRate,
            orderApproval,
            comments,
            category,
            netTerms,
            shippingAddressOne,
            shippingAddressTwo,
            shippingAddressThree,
            shippingCity,
            shippingState,
            shippingZip,
            billingAddressOne,
            billingAddressTwo,
            billingAddressThree,
            billingCity,
            billingState,
            password,
            role,
            inactive,
        } = req.body;

        if (
            !customerId ||
            !customerName ||
            !contactName ||
            !contactEmail ||
            !email ||
            !phone ||
            !contactPhone ||
            !primaryBrand ||
            !defaultShippingRate ||
            !orderApproval ||
            !comments ||
            !category ||
            !netTerms ||
            !shippingAddressOne ||
            !shippingAddressTwo ||
            !shippingAddressThree ||
            !shippingCity ||
            !shippingState ||
            !shippingZip ||
            !billingAddressOne ||
            !billingAddressTwo ||
            !billingAddressThree ||
            !billingCity ||
            !billingState ||
            !password
        ) {
            return res.status(400).json({ message: "All required fields must be provided" });
        }

        // Check for unique fields
        const existingUser = await User.findOne({
            $or: [{ email }, { phone }, { customerId }],
        });

        if (existingUser) {
            return res.json(new ApiResponse(400, null, "User already exists with the same phone number or email"));
        }


        const user = await User.create({
            customerId,
            customerName,
            contactName,
            contactEmail,
            email,
            phone,
            contactPhone,
            primaryBrand,
            defaultShippingRate,
            orderApproval,
            comments,
            category,
            netTerms,
            shippingAddressOne,
            shippingAddressTwo,
            shippingAddressThree,
            shippingCity,
            shippingState,
            shippingZip,
            billingAddressOne,
            billingAddressTwo,
            billingAddressThree,
            billingCity,
            billingState,
            password,
            inactive: inactive || "No",
        });

        if (!user) {
            return res.json(new ApiResponse(400, null, "User already exists with the same phone number or email"));
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        if (!accessToken || !refreshToken) {
            return res.json(new ApiResponse(400, null, "Error generating tokens"));
        }

        const cookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        };

        return res
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(new ApiResponse(201, user, "User registered successfully"))

    } catch (err) {
        throw new ApiError(500, err.message);
    }
};

// 2.login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        if (!accessToken || !refreshToken) {
            return res.json(new ApiResponse(400, null, "Error generating tokens"));
        }

        const cookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        };

        return res
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(new ApiResponse(200, user, "User logged in successfully"));

    } catch (err) {
        throw new ApiError(500, err.message);
    }
};

// 3. current
const getCurrentUser = async (req, res) => {
    try {
        return res.json(new ApiResponse(200, req.user, "User fetched successfully"));
    } catch (err) {
        throw new ApiError(500, err.message);
    }
};
// 4. logout
const logout = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            throw new ApiError(404, "User not found")
        }

        user.refreshToken = null;
        await user.save({ validateBeforeSave: false });

        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "none"
        };
        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, null, "User logged out successfully"));

    } catch (err) {
        throw new ApiError(500, err.message);
    }
};

// 5. refresh access token
const refreshAccessToken = async (req, res) => {

    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

        if (!incomingRefreshToken) {
            throw new ApiError(401, "unauthorized request")
        }

        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "none"
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, newRefreshToken },
                    "Access token refreshed"
                )
            )

    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }


}

// 6. change password
const changeCurrentPassword = async (req, res) => {

    const { oldPassword, newPassword } = req.body //confpassword

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, user, "password changed successfully"))

}

export {
    userSignup,
    login,
    getCurrentUser,
    logout,
    refreshAccessToken,
    changeCurrentPassword
}






