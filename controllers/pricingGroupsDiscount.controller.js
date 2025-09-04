// controllers/pricingGroupDiscountController.js
import PricingGroupDiscount from "../models/pricingGroupsDiscount.schema.js";
import PricingGroups from "../models/pricingGroups.schema.js";
import User from "../models/user.schema.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import csv from "csv-parser";
import fs from "fs";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

// Create a new pricing group discount
const createPricingGroupDiscount = async (req, res) => {
    try {
        const { pricingGroupId, customerId, percentage, productSku } = req.body;

        // Validate required fields
        if (!pricingGroupId || !customerId || percentage === undefined) {
            throw new ApiError(400, "All fields are required");
        }

        // Check if pricing group exists
        const pricingGroup = await PricingGroups.findById(pricingGroupId);
        if (!pricingGroup) {
            throw new ApiError(404, "Pricing group not found");
        }

        // Check if user exists
        const user = await User.findOne({ customerId });
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Validate percentage
        if (percentage < 0 || percentage > 100) {
            throw new ApiError(400, "Percentage must be between 0 and 100");
        }

        // Check if discount already exists for this user and pricing group
        const existingDiscount = await PricingGroupDiscount.findOne({
            pricingGroup: pricingGroupId,
            user: customerId
        });

        if (existingDiscount) {
            throw new ApiError(400, "Discount already exists for this user and pricing group");
        }

        // Create new discount
        const discount = await PricingGroupDiscount.create({
            pricingGroup: pricingGroupId,
            customerId,
            percentage,
            productSku
        });

        // Populate references
        await discount.populate("pricingGroup");
        await discount.populate("customerId");

        res.json(
            new ApiResponse(200, discount, "Pricing group discount created successfully")
        );

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

// Get all pricing group discounts
const getAllPricingGroupDiscounts = async (req, res) => {
    // await PricingGroupDiscount.deleteMany({});

    // res.json(new ApiResponse(200, null, "Pricing group discounts deleted successfully"));
    // return;
    try {
        const pricingGroupsDiscount = await PricingGroupDiscount.find()
            .populate("pricingGroup")


        if (!pricingGroupsDiscount) {
            throw new ApiError(404, "Pricing group discounts not found");
        }

        res.status(200).json(
            new ApiResponse(200, pricingGroupsDiscount, "Pricing group discounts retrieved successfully")
        );

    } catch (error) {
        throw new ApiError(500, error.message);
    }
};

// Get discount by ID
const getPricingGroupDiscountById = async (req, res) => {
    try {
        const { id } = req.params;

        const discount = await PricingGroupDiscount.findById(id)
            .populate("pricingGroup")
            .populate("customerId");

        if (!discount) {
            throw new ApiError(404, "Pricing group discount not found");
        }

        res.status(200).json(
            new ApiResponse(200, discount, "Pricing group discount retrieved successfully")
        );

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

// Update pricing group discount
const updatePricingGroupDiscount = async (req, res) => {
    try {
        const { id } = req.params;
        const { percentage, productSku, pricingGroupId } = req.body;

        if (percentage === undefined) {
            throw new ApiError(400, "Percentage is required");
        }

        if (percentage < 0 || percentage > 100) {
            throw new ApiError(400, "Percentage must be between 0 and 100");
        }

        const discount = await PricingGroupDiscount.findByIdAndUpdate(
            id,
            { percentage, productSku, pricingGroup: pricingGroupId },
            { new: true, runValidators: true }
        )
            .populate("pricingGroup", "name slug")
            .populate("customerId",);

        if (!discount) {
            throw new ApiError(404, "Pricing group discount not found");
        }

        res.status(200).json(
            new ApiResponse(200, discount, "Pricing group discount updated successfully")
        );

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

// Delete pricing group discount
const deletePricingGroupDiscount = async (req, res) => {
    try {
        const { id } = req.params;

        const discount = await PricingGroupDiscount.findByIdAndDelete(id);

        if (!discount) {
            throw new ApiError(404, "Pricing group discount not found");
        }

        res.status(200).json(
            new ApiResponse(200, null, "Pricing group discount deleted successfully")
        );

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

// Import pricing group discounts from CSV
const importPricingGroupDiscounts = async (req, res) => {
    const file = req.file;

    if (!file) {
        throw new ApiError(400, "No file uploaded");
    }

    try {
        const allProcessedDiscounts = [];
        const importStats = {
            totalRows: 0,
            processedCustomers: 0,
            createdDiscounts: 0,
            updatedDiscounts: 0,
            skippedDiscounts: 0,
            errors: 0,
            errorDetails: []
        };

        // Read CSV
        const fileContent = fs.readFileSync(file.path, "utf8");
        const lines = fileContent.split("\n").filter(line => line.trim() !== "");

        for (const [rowIndex, line] of lines.entries()) {
            try {
                // Skip header
                if (rowIndex === 0) continue;

                // Parse line with basic CSV splitting
                const columns = line.split(",").map(c => c.replace(/"/g, "").trim());

                const customerId = columns[0];
                if (!customerId || customerId === "Customer Id") continue;

                importStats.totalRows++;
                importStats.processedCustomers++;

                // Process chunks of 4 starting from column 2
                for (let i = 1; i < columns.length; i += 4) {
                    const productSku = columns[i];
                    const percentageStr = columns[i + 1];
                    // currency = columns[i + 2], unitPrice = columns[i + 3] (ignored for schema)

                    if (!productSku || !percentageStr) continue;

                    let percentage = parseFloat(percentageStr.replace("%", ""));
                    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
                        importStats.skippedDiscounts++;
                        continue;
                    }

                    // Check if discount exists
                    const existingDiscount = await PricingGroupDiscount.findOne({
                        customerId,
                        productSku
                    });

                    let discount;
                    if (existingDiscount) {
                        existingDiscount.percentage = percentage;
                        discount = await existingDiscount.save();
                        importStats.updatedDiscounts++;
                    } else {
                        discount = await PricingGroupDiscount.create({
                            customerId,
                            productSku,
                            percentage
                        });
                        importStats.createdDiscounts++;
                    }

                    if (discount) {
                        allProcessedDiscounts.push({
                            ...discount.toObject(),
                            customerId,
                            productSku
                        });
                    }
                }
            } catch (err) {
                importStats.errors++;
                importStats.errorDetails.push({
                    rowIndex,
                    error: err.message
                });
            }
        }

        // Clean up file
        fs.unlinkSync(file.path);

        res.status(200).json(
            new ApiResponse(
                200,
                { importStats, processedDiscounts: allProcessedDiscounts },
                "Customer item discounts imported successfully"
            )
        );
    } catch (error) {
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};



// Get discounts for a specific user
const getUserPricingGroupDiscounts = async (req, res) => {
    try {
        const { customer } = req.params;

        const discounts = await PricingGroupDiscount.find({ customerId: customer })
            .populate("pricingGroup", "name")
            .sort({ createdAt: -1 });

        res.status(200).json(
            new ApiResponse(200, { discounts, total: discounts.length }, "User pricing group discounts retrieved successfully")
        );

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};


// Export pricing group discounts in the same format as import CSV
const exportPricingGroupDiscountsCSV = async (req, res) => {
    try {
        // Fetch all discounts with pricingGroup populated
        const discounts = await PricingGroupDiscount.find()
            .populate("pricingGroup", "name")
            .sort({ customerId: 1, productSku: 1 });

        if (!discounts || discounts.length === 0) {
            throw new ApiError(404, "No pricing group discounts found");
        }

        // Group discounts by customerId
        const discountsByCustomer = {};
        discounts.forEach(discount => {
            const customerId = discount.customerId;
            if (!discountsByCustomer[customerId]) {
                discountsByCustomer[customerId] = [];
            }

            discountsByCustomer[customerId].push({
                productSku: discount.productSku,
                percentage: discount.percentage,
                currency: discount.currency || "", // optional
                unitPrice: discount.unitPrice || "" // optional
            });
        });

        // Build CSV header
        let csvData = 'Customer Id,Product SKU,Percentage,Currency,Unit Price';

        // Add repeating headers for additional product slots (up to 18 for example)
        for (let i = 2; i <= 18; i++) {
            csvData += `,Product SKU ${i},Percentage ${i},Currency ${i},Unit Price ${i}`;
        }
        csvData += '\n';

        // Build CSV rows
        for (const [customerId, customerDiscounts] of Object.entries(discountsByCustomer)) {
            let row = `"${customerId}"`;

            // Flatten discounts into row (each product = 4 columns)
            for (let i = 0; i < 18; i++) {
                if (i < customerDiscounts.length) {
                    const discount = customerDiscounts[i];
                    row += `,"${discount.productSku || ""}","${discount.percentage || ""}","${discount.currency || ""}","${discount.unitPrice || ""}"`;
                } else {
                    row += ',,,,'; // Empty cells for unused slots
                }
            }

            csvData += row + '\n';
        }

        // Send CSV file as download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="customer_item_discounts_export.csv"');
        res.setHeader('Content-Length', Buffer.byteLength(csvData, 'utf8'));

        return res.send(csvData);

    } catch (error) {
        console.error("CSV export error:", error);
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};







export {
    createPricingGroupDiscount,
    getAllPricingGroupDiscounts,
    getPricingGroupDiscountById,
    updatePricingGroupDiscount,
    deletePricingGroupDiscount,
    importPricingGroupDiscounts,
    getUserPricingGroupDiscounts,
    exportPricingGroupDiscountsCSV,
};