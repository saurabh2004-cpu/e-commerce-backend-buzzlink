import Admin from "../models/admin.schema.js";
import bcrypt from "bcrypt";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import User from "../models/user.schema.js";
import fs from "fs";
import csv from "csv-parser";
import { generateAccessAndRefreshTokens } from "../utils/helper.js";


const signup = async (req, res) => {
    try {
        const { email, password } = req.body;

        if ([email, password].some((field) => field?.trim() === "")) {
            throw new ApiError(400, "all fields are required")
        }

        const existing = await Admin.findOne({ email });
        if (existing) {
            return res.json(new ApiResponse(400, null, "Admin already exists"));
        }

        // const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await Admin.create({
            email,
            password,

        });

        const accessToken = admin.generateAccessToken();
        const refreshToken = admin.generateRefreshToken();

        admin.refreshToken = refreshToken;
        await admin.save({ validateBeforeSave: false });

        const cookieOptions = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(201)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(new ApiResponse(200, admin, "Admin created successfully"));

    } catch (err) {
        throw new ApiError(500, err.message)
    }
};

//2. login
const loginAdmin = async (req, res) => {
    const { email, password } = req.body

    if (!password || !email) {
        throw new ApiError(400, "username or email is required")
    }

    //3. find the user
    const admin = await Admin.findOne({
        $or: [{ email }]
    })

    if (!admin) {
        throw new ApiError(404, "user does not exist !")
    }

    //4. password check
    const isPasswordValid = await bcrypt.compare(password, admin.password)

    if (!isPasswordValid) {
        throw new ApiError(401, "password does not correct !")
    }

    const accessToken = admin.generateAccessToken();
    const refreshToken = admin.generateRefreshToken();

    admin.refreshToken = refreshToken;
    await admin.save({ validateBeforeSave: false });

    //6. send cookie
    const loggedInAdmin = await Admin.findById(admin._id).
        select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, {
                user: loggedInAdmin, accessToken, refreshToken
            },
                "User LoggedIn Successfully"
            )
        )

}

// 3.logout
const logout = async (req, res) => {
    try {
        await User.findByIdAndUpdate(
            req.admin._id,
            {
                $unset: {
                    refreshToken: 1   //removes the field from document
                }
            },
            {
                new: true
            }
        )
        const options = {
            httpOnly: true,
            secure: true,
        }

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User Logged Out"))
    } catch (error) {
        throw new ApiError(500, error.message)
    }


}

// 4. refresh
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

        const admin = await Admin.findById(decodedToken?._id)

        if (!admin) {
            throw new ApiError(401, "invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(admin._id)

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

// 5. change password
const changeCurrentPassword = async (req, res) => {

    const { oldPassword, newPassword } = req.body //confpassword

    if (oldPassword === newPassword) {
        throw new ApiError(400, "new password can not be same as old password")
    }

    const admin = await Admin.findById(req.admin?._id)
    const isPasswordCorrect = await admin.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    admin.password = newPassword
    await admin.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, admin, "password changed successfully"))

}

//6.get current admin
const getCurrentAdmin = async (req, res) => {

    return res
        .status(200)
        .json(new ApiResponse(200, req.admin, "current user fetched succusssfully"))
}

const importUsers = async (req, res) => {
    const file = req.file;

    if (!file) {
        throw new ApiError(400, "No file uploaded");
    }

    try {
        const users = [];

        fs.createReadStream(file.path)
            .pipe(csv({
                skipLines: 4, // Skip the first 4 rows (explanation, empty, labels, empty)
                headers: [
                    'Internal ID', 'ID', 'Name', 'Email', 'Phone', 'Category', 'Terms',
                    'Shipping Address 1', 'Shipping Address 2', 'Shipping Address 3',
                    'Shipping City', 'Shipping State/Province', 'Shipping Zip',
                    'Billing Address 1', 'Billing Address 2', 'Billing Address 3',
                    'Billing City', 'Billing State/Province', 'Billing Zip',
                    'Contact Name', 'Contact Email', 'Contact Phone',
                    'Primary Brand', 'Default Shipping Rate', 'Order Approval',
                    'Comments', 'Inactive'
                ],
                trim: true
            }))
            .on("data", (row) => {
                // Filter out empty rows
                if (row['Internal ID'] && row['Internal ID'] !== '') {
                    users.push(row);
                }
            })
            .on("end", async () => {
                console.log(`CSV file successfully processed. Found ${users.length} valid rows.`);

                // Process each user
                for (let i = 1; i < users.length; i++) {
                    try {
                        const userData = users[i];
                        const exists = await User.findOne({ customerId: userData.ID });

                        if (exists) {
                            console.log(`Skipping existing user: ${userData.Name}`);
                            continue;
                        }

                        console.log(`Processing user: ${userData.ID}`);
                        // return

                        // Create user with default fields
                        const newUser = new User({
                            internalId: userData['Internal ID'],
                            customerId: userData.ID,
                            customerName: userData.Name,
                            email: userData.Email,
                            phone: userData.Phone,
                            category: userData.Category,
                            netTerms: userData.Terms,
                            shippingAddressOne: userData['Shipping Address 1'],
                            shippingAddressTwo: userData['Shipping Address 2'],
                            shippingAddressThree: userData['Shipping Address 3'],
                            shippingCity: userData['Shipping City'],
                            shippingState: userData['Shipping State/Province'],
                            shippingZip: userData['Shipping Zip'],
                            billingAddressOne: userData['Billing Address 1'],
                            billingAddressTwo: userData['Billing Address 2'],
                            billingAddressThree: userData['Billing Address 3'],
                            billingCity: userData['Billing City'],
                            billingState: userData['Billing State/Province'],
                            billingZip: userData['Billing Zip'],
                            contactName: userData['Contact Name'],
                            contactEmail: userData['Contact Email'],
                            contactPhone: userData['Contact Phone'],
                            primaryBrand: userData['Primary Brand'],
                            defaultShippingRate: userData['Default Shipping Rate'],
                            orderApproval: userData['Order Approval'],
                            comments: userData.Comments,
                            inactive: userData.Inactive,
                            password: 'pass123',
                            masterPassword: 'master123',
                            refreshToken: "",
                        });

                        await newUser.save();
                        console.log(`Processed user: ${userData.Name}`);

                    } catch (err) {
                        throw new ApiError(500, err.message);
                    }
                }

                res.json(new ApiResponse(200, users, "Users imported successfully"));
            })
            .on("error", (error) => {
                console.error("Error reading CSV file:", error.message);
                res.status(500).json({ message: "Error reading CSV file" });
            });

    } catch (error) {
        console.error("Error in importUsers:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.json(new ApiResponse(200, users, "Users fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
};

const createSingleUser = async (req, res) => {
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

        return res
            .json(new ApiResponse(201, user, "User registered successfully"))

    } catch (err) {
        throw new ApiError(500, err.message);
    }
};

export {
    signup,
    loginAdmin,
    logout,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentAdmin,
    importUsers,
    getAllUsers,
    createSingleUser
}