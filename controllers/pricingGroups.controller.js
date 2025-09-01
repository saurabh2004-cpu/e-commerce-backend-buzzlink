import PricingGroups from "../models/pricingGroups.schema.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";

const createPricingGroup = async (req, res) => {
    const { name, slug } = req.body;

    if (!name || !slug) {
        throw new ApiError(400, "All fields are required");
    }

    const existing = await PricingGroups.findOne({ slug });
    if (existing) {
        throw new ApiError(400, "PricingGroup already exists");
    }

    try {
        const newPricingGroup = await PricingGroups.create({ name, slug });

        if (!newPricingGroup) {
            throw new ApiError(500, "Error while creating pricingGroup");
        }

        return res.json(new ApiResponse(201, newPricingGroup, "PricingGroup created successfully"));

    } catch (error) {

    }
}

const getPricingGroups = async (req, res) => {
    try {
        const pricingGroups = await PricingGroups.find({});

        if (!pricingGroups || pricingGroups.length === 0) {
            return res.json(new ApiResponse(404, null, "PricingGroups not found"));
        }

        return res.json(new ApiResponse(200, pricingGroups, "PricingGroups fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
}

const getPricingGroupById = async (req, res) => {
    try {
        const pricingGroup = await PricingGroups.findById(req.params.id);

        if (!pricingGroup) {
            return res.json(new ApiResponse(404, null, "PricingGroup not found"));
        }

        return res.json(new ApiResponse(200, pricingGroup, "PricingGroup fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
}

const updatePricingGroup = async (req, res) => {
    try {
        const { name, slug } = req.body;

        const pricingGroup = await PricingGroups.findOne({ slug });

        if (!pricingGroup) {
            throw new ApiError(404, "PricingGroup not found");
        }

        pricingGroup.name = name;
        pricingGroup.slug = slug;
        await pricingGroup.save();

        if (!pricingGroup) {
            throw new ApiError(404, "Error while updating pricingGroup");
        }

        return res.json(new ApiResponse(200, pricingGroup, "PricingGroup updated successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
}

const deletePricingGroup = async (req, res) => {
    try {
        const pricingGroup = await PricingGroups.findByIdAndDelete(req.params.id);

        if (!pricingGroup) {
            throw new ApiError(404, "PricingGroup not found");
        }

        return res.json(new ApiResponse(200, pricingGroup, "PricingGroup deleted successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
}

export { createPricingGroup, getPricingGroups, getPricingGroupById, updatePricingGroup, deletePricingGroup };

