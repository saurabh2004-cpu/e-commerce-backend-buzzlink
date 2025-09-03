import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import SubCategory from "../models/subCategory.schema.js";


const createSubCategory = async (req, res) => {
    try {
        const { name, category, slug } = req.body;

        if ([name, category, slug].some((field) => field?.trim() === "")) {
            return res.json(new ApiResponse(400, null, "All fields are required"));
        }

        const existing = await SubCategory.findOne({ slug });
        if (existing) {
            throw new ApiError(400, "SubCategory already exists");
        }

        const subCategory = await SubCategory.create({
            name,
            category,
            slug
        });

        if (!subCategory) {
            throw new ApiError(500, "Error while creating subCategory");
        }
        return res.json(new ApiResponse(200, subCategory, "SubCategory created successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
}


const getSubCategories = async (req, res) => {
    try {
        const subCategories = await SubCategory.find().populate("category");

        if (!subCategories || subCategories.length === 0) {
            return res.json(new ApiResponse(404, null, "SubCategories not found"));
        }

        return res.json(new ApiResponse(200, subCategories, "SubCategories fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
}

const getSubCtegoryById = async (req, res) => {
    try {
        const subCategory = await SubCategory.findById(req.params.id);

        if (!subCategory) {
            return res.json(new ApiResponse(404, null, "SubCategory not found"));
        }

        return res.json(new ApiResponse(200, subCategory, "SubCategory fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
}

const updateSubCategory = async (req, res) => {
    try {
        const { name, category, slug } = req.body;

        const subCategory = await SubCategory.findOne({ slug });

        if (!subCategory) {
            throw new ApiError(404, "Error while updating subCategory");
        }

        subCategory.name = name;
        subCategory.category = category;
        subCategory.slug = slug;
        await subCategory.save();

        return res.json(new ApiResponse(200, subCategory, "SubCategory updated successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
}

const deleteSubCategory = async (req, res) => {
    try {
        const subCategory = await SubCategory.findByIdAndDelete(req.params.id);

        if (!subCategory) {
            throw new ApiError(404, "SubCategory not found");
        }

        return res.json(new ApiResponse(200, subCategory, "SubCategory deleted successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
}

export {
    createSubCategory,
    getSubCategories,
    getSubCtegoryById,
    updateSubCategory,
    deleteSubCategory
}
