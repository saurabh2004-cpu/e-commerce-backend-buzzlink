import Category from "../models/category.schema.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";


const createCategory = async (req, res) => {
    const { name, brand, slug } = req.body;

    if ([name, brand].some((field) => field?.trim() === "")) {
        return res.json(new ApiResponse(400, null, "All fields are required"));
    }

    try {

        const existing = await Category.findOne({ slug });
        if (existing) {
            throw new ApiError(400, "Category already exists");
        }

        const category = await Category.create({
            name,
            brand,
            slug
        });

        if (!category) {
            throw new ApiError(500, "Error while creating category");
        }
        return res.json(new ApiResponse(201, category, "Category created successfully"));

    } catch (error) {
        throw new ApiError(500, error.message);
    }
}

const getCategories = async (req, res) => {
    try {
        const categories = await Category.find();

        if (!categories || categories.length === 0) {
            return res.json(new ApiResponse(404, null, "Categories not found"));
        }

        return res.json(new ApiResponse(200, categories, "Categories fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
}

const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.json(new ApiResponse(404, null, "Category not found"));
        }

        return res.json(new ApiResponse(200, category, "Category fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
}

const updateCategory = async (req, res) => {
    try {
        const { name, brand, slug } = req.body;

        const category = await Category.findById(req.params.id);

        if (!category) {
            throw new ApiError(404, "Error while updating category");
        }

        category.name = name;
        category.brand = brand;
        category.slug = slug;
        await category.save();

        return res.json(new ApiResponse(200, category, "Category updated successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
}

const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            throw new ApiError(404, "Category not found");
        }

        return res.json(new ApiResponse(200, category, "Category deleted successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
}

export {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
}