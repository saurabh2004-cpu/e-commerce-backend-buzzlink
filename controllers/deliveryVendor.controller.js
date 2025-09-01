import DeliveryVendor from "../models/deliveryVendor.schema.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

// Create Vendor
const createDeliveryVendor = async (req, res) => {
    try {
        const { vendorName, vendorTrackingUrl } = req.body;

        if (!vendorName || !vendorTrackingUrl) {
            return res.json(new ApiResponse(400, null, "Vendor name and tracking URL are required"));
        }

        const newVendor = new DeliveryVendor({
            vendorName,
            vendorTrackingUrl,
        });

        await newVendor.save();

        res.json(new ApiResponse(201, newVendor, "Vendor created successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

// Get All Vendors
const getAllDeliveryVendors = async (req, res) => {
    try {
        const vendors = await DeliveryVendor.find();
        if(!vendors) {
            return res.json(new ApiResponse(404, null, "Vendors not found"));
        }
        res.status(200).json(vendors);
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

//  Get Vendor by ID
const getDeliveryVendorById = async (req, res) => {
    try {
        const vendor = await DeliveryVendor.findById(req.params.id);

        if (!vendor) {
            return res.json(new ApiResponse(404, null, "Vendor not found"));
        }

        res.json(new ApiResponse(200, vendor, "Vendor fetched successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

//  Update Vendor
const updateDeliveryVendor = async (req, res) => {
    try {
        const { vendorName, vendorTrackingUrl } = req.body;

        const updatedVendor = await DeliveryVendor.findByIdAndUpdate(
            req.params.id,
            { vendorName, vendorTrackingUrl },
            { new: true, runValidators: true }
        );

        if (!updatedVendor) {
            return res.json(new ApiResponse(404, null, "Vendor not found"));
        }

        res.json(new ApiResponse(200, updatedVendor, "Vendor updated successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

//  Delete Vendor
const deleteDeliveryVendor = async (req, res) => {
    try {
        const deletedVendor = await DeliveryVendor.findByIdAndDelete(req.params.id);

        if (!deletedVendor) {
            return res.json(new ApiResponse(404, null, "Vendor not found"));
        }

        res.json(new ApiResponse(200, null, "Vendor deleted successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

export { createDeliveryVendor, getAllDeliveryVendors, getDeliveryVendorById, updateDeliveryVendor, deleteDeliveryVendor };