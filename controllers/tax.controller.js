// controllers/taxController.js
import Tax from "../models/tax.schema.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

// Create a new tax
const createTax = async (req, res) => {
    try {
        const { name, percentage, } = req.body;

        // Validate required fields
        if (!name || percentage === undefined) {
            throw new ApiError(400, "Name and percentage are required");
        }

        // Validate percentage range
        if (percentage < 0 || percentage > 100) {
            throw new ApiError(400, "Percentage must be between 0 and 100");
        }

        // Check if tax with same name already exists
        const existingTax = await Tax.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });

        if (existingTax) {
            throw new ApiError(400, "Tax with this name already exists");
        }

        // Create new tax
        const tax = await Tax.create({
            name: name.trim(),
            percentage: parseFloat(percentage),
        });

        res.status(201).json(
            new ApiResponse(200, tax, "Tax created successfully")
        );

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

// Get all taxes with pagination and filtering
const getAllTaxes = async (req, res) => {
    try {
        try {
            const taxes = await Tax.find().sort({ createdAt: -1 });

            res.json(
                new ApiResponse(200, taxes, "Taxes retrieved successfully")
            );
        } catch (error) {
            throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
        }

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

// Get tax by ID
const getTaxById = async (req, res) => {
    try {
        const { id } = req.params;

        const tax = await Tax.findById(id);

        if (!tax) {
            throw new ApiError(404, "Tax not found");
        }

        res.status(200).json(
            new ApiResponse(200, tax, "Tax retrieved successfully")
        );

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

// Update tax
const updateTax = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, percentage } = req.body;

        // Find tax
        const tax = await Tax.findById(id);
        if (!tax) {
            throw new ApiError(404, "Tax not found");
        }

        // Validate percentage if provided
        if (percentage !== undefined && (percentage < 0 || percentage > 100)) {
            throw new ApiError(400, "Percentage must be between 0 and 100");
        }

        // Check for duplicate name if name is being updated
        if (name && name !== tax.name) {
            const existingTax = await Tax.findOne({
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                _id: { $ne: id }
            });

            if (existingTax) {
                throw new ApiError(400, "Tax with this name already exists");
            }
        }

        // Update tax
        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (percentage !== undefined) updateData.percentage = parseFloat(percentage);

        const updatedTax = await Tax.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json(
            new ApiResponse(200, updatedTax, "Tax updated successfully")
        );

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

// Delete tax
const deleteTax = async (req, res) => {
    try {
        const { id } = req.params;

        const tax = await Tax.findByIdAndDelete(id);

        if (!tax) {
            throw new ApiError(404, "Tax not found");
        }

        res.status(200).json(
            new ApiResponse(200, null, "Tax deleted successfully")
        );

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};


export {
    createTax,
    getAllTaxes,
    getTaxById,
    updateTax,
    deleteTax,
};