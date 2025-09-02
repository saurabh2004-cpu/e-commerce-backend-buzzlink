import ItemBasedDiscount from "../models/itemBasedDiscount.schema.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";


const createItemBasedDiscount = async (req, res) => {
    try {
        if (!req.body) {
            return json(new ApiResponse(400, null, "Request body is empty"));
        }

        const itemBasedDiscount = await ItemBasedDiscount.create(req.body);

        if (!itemBasedDiscount) {
            throw new ApiError(500, "Error while creating itemBasedDiscount");
        }

        return res.json(new ApiResponse(201, itemBasedDiscount, "ItemBasedDiscount created successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

const getAllItemBasedDiscounts = async (req, res) => {
    try {
        const itemBasedDiscounts = await ItemBasedDiscount.find();
        if (!itemBasedDiscounts) {
            return res.json(new ApiResponse(404, null, "ItemBasedDiscounts not found"));
        }
        return res.json(new ApiResponse(200, itemBasedDiscounts, "ItemBasedDiscounts retrieved successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};


const getItemBasedDiscountById = async (req, res) => {
    try {
        const itemBasedDiscount = await ItemBasedDiscount.findById(req.params.id);
        if (!itemBasedDiscount) {
            return res.json(new ApiResponse(404, null, "ItemBasedDiscount not found"));
        }
        return res.json(new ApiResponse(200, itemBasedDiscount, "ItemBasedDiscount retrieved successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};


const updateItemBasedDiscount = async (req, res) => {
    try {
        const itemBasedDiscount = await ItemBasedDiscount.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!itemBasedDiscount) {
            return res.json(new ApiResponse(404, null, "ItemBasedDiscount not found"));
        }
        return res.json(new ApiResponse(200, itemBasedDiscount, "ItemBasedDiscount updated successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};


const deleteItemBasedDiscount = async (req, res) => {
    try {
        const itemBasedDiscount = await ItemBasedDiscount.findByIdAndDelete(req.params.id);
        if (!itemBasedDiscount) {
            return res.json(new ApiResponse(404, null, "ItemBasedDiscount not found"));
        }
        return res.json(new ApiResponse(200, null, "ItemBasedDiscount deleted successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

export {
    createItemBasedDiscount,
    getAllItemBasedDiscounts,
    getItemBasedDiscountById,
    updateItemBasedDiscount,
    deleteItemBasedDiscount
};