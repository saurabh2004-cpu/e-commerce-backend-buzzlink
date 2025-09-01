import jwt from "jsonwebtoken"
import Admin from "../models/admin.schema.js";
import ApiError from "../utils/apiError.js";

const verifyAdmin = async (req, res, next) => {

    try {
        const token = req.headers.authorization?.split(" ")[1] || req.cookies?.accessToken;

        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const admin = await Admin.findById(decodedToken?._id).select("-password -refreshToken")

        // console.log("adminMiddleware", user);

        if (!admin) {
            throw new error(401, "Unauthorized request or user is not an admin")
        }

        req.admin = admin;
        next()
    } catch (error) {
        console.error("Error in admin middleware:", error);
        return res.status(401).json({ message: "Unauthorized request or user is not an admin" });
    }

}


export default verifyAdmin;