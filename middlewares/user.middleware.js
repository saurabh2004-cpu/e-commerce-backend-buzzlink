import jwt from "jsonwebtoken"
import User from "../models/user.schema.js";
import ApiError from "../utils/apiError.js";

const verifyJwt = async (req, _, next) => {

    try {
        const token = req.headers.authorization?.split(" ")[1] || req.cookies?.accessToken;

        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            throw new Error(401, "Unauthorized request")
        }

        req.user = user;
        next()
    } catch (error) {
        throw new Error(401, error.message || "Invalid Access Token")
    }

}


export default verifyJwt;