import PacksType from "../models/packsTypes.schema.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/apiResponse.js";

//  Create PacksType
const createPacksType = async (req, res, next) => {
    try {
        const { name, quantity } = req.body;

        if (!name || !quantity) {
            throw new ApiError(400, "Name and Quantity are required");
        }

        const exists = await PacksType.findOne({ name });
        if (exists) {
            throw new ApiError(400, "Pack type with this name already exists");
        }

        const pack = await PacksType.create({ name, quantity });

        res
            .status(201)
            .json(new ApiResponse(201, pack, "PacksType created successfully"));
    } catch (error) {
        next(error);
    }
};

//  Get all PacksTypes (with pagination)
const getAllPacksTypes = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const packs = await PacksType.find()
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await PacksType.countDocuments();

        res.status(200).json(
            new ApiResponse(200, {
                packs,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit),
                },
            }, "PacksTypes retrieved successfully")
        );
    } catch (error) {
        next(error);
    }
};

//  Get single PacksType by ID
const getPacksTypeById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const pack = await PacksType.findById(id);
        if (!pack) {
            throw new ApiError(404, "PacksType not found");
        }

        res
            .status(200)
            .json(new ApiResponse(200, pack, "PacksType retrieved successfully"));
    } catch (error) {
        next(error);
    }
};

//  Update PacksType
const updatePacksType = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, quantity } = req.body;

        const pack = await PacksType.findById(id);
        if (!pack) {
            throw new ApiError(404, "PacksType not found");
        }

        if (name) pack.name = name;
        if (quantity) pack.quantity = quantity;

        await pack.save();

        res
            .status(200)
            .json(new ApiResponse(200, pack, "PacksType updated successfully"));
    } catch (error) {
        next(error);
    }
};

//  Delete PacksType
const deletePacksType = async (req, res, next) => {
    try {
        const { id } = req.params;

        const pack = await PacksType.findById(id);
        if (!pack) {
            throw new ApiError(404, "PacksType not found");
        }

        await pack.deleteOne();

        res
            .status(200)
            .json(new ApiResponse(200, {}, "PacksType deleted successfully"));
    } catch (error) {
        next(error);
    }
};


export {
    createPacksType,
    getAllPacksTypes,
    getPacksTypeById,
    updatePacksType,
    deletePacksType
}