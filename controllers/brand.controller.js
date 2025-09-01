import Brand from "../models/brand.schema.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";

//  Create a new brand
export const createBrand = async (req, res) => {
    try {
        const { name, slug } = req.body;


        // check if brand already exists
        const existing = await Brand.findOne({ slug });
        if (existing) {
            return res.json(new ApiResponse(400, null, "Brand already exists"));
        }

        const brand = new Brand({ name, slug });
        await brand.save();

        res.json(new ApiResponse(201, brand, "Brand created successfully"));
    } catch (err) {
        throw new ApiError(500, err.message);
    }
};

// ✅ Get all brands (with categories populated)
export const getBrands = async (req, res) => {
    try {
        const brands = await Brand.find()

        if(!brands || brands.length === 0) {
            return res.status(404).json({ message: "Brands not found" });
        }

        res.json(new ApiResponse(200, brands, "Brands fetched successfully"));
    } catch (err) {
        throw new ApiError(500, err.message);
    }
};

// ✅ Get single brand by ID
export const getBrandById = async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id)

        if (!brand) {
            return res.json(new ApiResponse(404, null, "Brand not found"));
        }

        res.json(new ApiResponse(200, brand, "Brand fetched successfully"));
    } catch (err) {
        throw new ApiError(500, err.message);
    }
};

//  Update brand
export const updateBrand = async (req, res) => {
    try {
        const { name, slug } = req.body;


        const brand = await Brand.findByIdAndUpdate(
            req.params.id,
            { name, slug },
            { new: true, runValidators: true }
        );

        if (!brand) {
           throw new ApiError(404, "Error while updating brand");
        }

        res.json(new ApiResponse(200, brand, "Brand updated successfully"));
    } catch (err) {
        throw new ApiError(500, err.message);
    }
};

// ✅ Delete brand
export const deleteBrand = async (req, res) => {
    try {
        const brand = await Brand.findByIdAndDelete(req.params.id);

        if (!brand) {
            throw new ApiError(404, "Brand not found");
        }

        res.json(new ApiResponse(200, brand, "Brand deleted successfully"));
    } catch (err) {
        throw new ApiError(500, err.message);
    }
};

export default {
    createBrand,
    getBrands,
    getBrandById,
    updateBrand,
    deleteBrand,
};