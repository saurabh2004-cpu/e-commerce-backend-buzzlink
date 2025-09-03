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
        const { pricingGroupId, customerId, percentage,productSku } = req.body;

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
            .populate("pricingGroup", "name slug")
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
        const { percentage, productSku } = req.body;

        if (percentage === undefined) {
            throw new ApiError(400, "Percentage is required");
        }

        if (percentage < 0 || percentage > 100) {
            throw new ApiError(400, "Percentage must be between 0 and 100");
        }

        const discount = await PricingGroupDiscount.findByIdAndUpdate(
            id,
            { percentage, productSku },
            { new: true, runValidators: true }
        )
            .populate("pricingGroup", "name slug")
            .populate("customerId", );

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
        const results = [];
        const allProcessedDiscounts = [];
        const importStats = {
            totalRows: 0,
            processedCustomers: 0,
            createdDiscounts: 0,
            updatedDiscounts: 0,
            skippedDiscounts: 0,
            errors: 0,
            errorDetails: [] // Track specific errors
        };

        fs.createReadStream(file.path)
            .pipe(csv())
            .on("data", (data) => results.push(data))
            .on("end", async () => {
                importStats.totalRows = results.length;
                console.log('=== CSV IMPORT STARTED ===');
                console.log(`Total rows in CSV: ${importStats.totalRows}`);

                for (const [index, row] of results.entries()) {
                    try {
                        const customerId = row['Customer ID'];
                        console.log(`\n=== Processing row ${index}: ${customerId} ===`);

                        // Skip header or empty rows
                        if (!customerId || customerId === 'Customer ID') {
                            console.log('Skipping header or empty row');
                            continue;
                        }

                        importStats.processedCustomers++;
                        console.log(`Processing customer: ${customerId}`);

                        let itemsProcessed = 0;

                        // Process each item pricing column (up to 21 pricing tiers)
                        for (let i = 1; i <= 21; i++) {
                            const productSku = row[`Customer - Item Pricing ${i} : Item`];
                            const percentageStr = row[`Customer - Item Pricing ${i} : Price Level`];

                            // Skip if no data for this item
                            if (!productSku || !percentageStr) {
                                continue;
                            }

                            console.log(`Processing Item ${i}: ${productSku} - ${percentageStr}`);
                            itemsProcessed++;

                            // Clean up percentage value (remove % sign if present and handle text values)
                            let percentage;
                            if (percentageStr.includes('%')) {
                                percentage = parseFloat(percentageStr.replace('%', ''));
                            } else if (percentageStr.toLowerCase() === 'custom') {
                                // Handle "Custom" pricing - you might want to set a default or skip
                                percentage = 0; // Or set to a default custom value
                                console.log(`Custom pricing detected for ${productSku}, setting to 0%`);
                            } else {
                                // Try to parse as number
                                percentage = parseFloat(percentageStr);
                            }

                            // Validate percentage
                            if (isNaN(percentage) || percentage < 0 || percentage > 100) {
                                console.log(`Invalid percentage for ${productSku}: ${percentageStr}`);
                                importStats.skippedDiscounts++;
                                continue;
                            }

                            // Check if discount already exists for this customer and product
                            const existingDiscount = await PricingGroupDiscount.findOne({
                                productSku: productSku,
                                customerId: customerId
                            });

                            let discount;

                            if (existingDiscount) {
                                // Update existing discount
                                existingDiscount.percentage = percentage;
                                discount = await existingDiscount.save();
                                importStats.updatedDiscounts++;
                                console.log(`✓ Updated discount for ${customerId}, ${productSku}`);
                            } else {
                                // Create new discount
                                discount = await PricingGroupDiscount.create({
                                    productSku: productSku,
                                    customerId: customerId,
                                    percentage: percentage,
                                    pricingGroup: null // Since we don't have pricing group info in this CSV
                                });
                                importStats.createdDiscounts++;
                                console.log(`✓ Created discount for ${customerId}, ${productSku}`);
                            }

                            // Add ALL processed discounts to the array
                            if (discount) {
                                const discountWithDetails = {
                                    ...discount.toObject(),
                                    productSku: productSku,
                                    customerId: customerId
                                };
                                allProcessedDiscounts.push(discountWithDetails);
                            }
                        }

                        console.log(`Processed ${itemsProcessed} items for ${customerId}`);

                    } catch (error) {
                        console.error(`❌ Error processing row ${index} for customer ${row['Customer ID']}:`, error.message);
                        console.error('Error stack:', error.stack);
                        importStats.errors++;
                        importStats.errorDetails.push({
                            customerId: row['Customer ID'],
                            error: error.message,
                            rowIndex: index
                        });
                    }
                }

                // Clean up uploaded file
                fs.unlinkSync(file.path);

                console.log('\n=== IMPORT COMPLETED ===');
                console.log('Final stats:', importStats);
                console.log('Total processed discounts:', allProcessedDiscounts.length);

                res.status(200).json(
                    new ApiResponse(200, {
                        importStats,
                        processedDiscounts: allProcessedDiscounts
                    }, "Pricing group discounts imported successfully")
                );
            })
            .on("error", (error) => {
                console.error("Error reading CSV file:", error.message);
                throw new ApiError(500, "Error reading CSV file");
            });

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
            new ApiResponse(200, {discounts,total:discounts.length}, "User pricing group discounts retrieved successfully")
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
            .sort({ customerId: 1, "pricingGroup.name": 1 });

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

            if (discount.pricingGroup) {
                discountsByCustomer[customerId].push({
                    pricingGroupName: discount.pricingGroup.name,
                    percentage: discount.percentage
                });
            }
        });

        // Build CSV header - exactly matching the import format
        let csvData = 'Customer Id';
        
        // Add all 18 pricing group columns
        for (let i = 1; i <= 18; i++) {
            csvData += `,Customer - Group Pricing ${i} : Pricing Group,Customer - Group Pricing ${i} : Price Level`;
        }
        csvData += '\n';

        // Build CSV rows
        for (const [customerId, customerDiscounts] of Object.entries(discountsByCustomer)) {
            let row = `"${customerId}"`;
            
            // Fill in all 18 pricing group slots
            for (let i = 0; i < 18; i++) {
                if (i < customerDiscounts.length) {
                    const discount = customerDiscounts[i];
                    row += `,"${discount.pricingGroupName}","${discount.percentage}%"`;
                } else {
                    row += ',,'; // Empty cells for unused pricing groups
                }
            }
            
            csvData += row + '\n';
        }

        // Add empty rows for customers without discounts (if needed)
        // This depends on your requirements - if you want to include all customers
        // even those without discounts, you would need to fetch all customers first

        // Send CSV file as download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="pricing_group_discounts_export.csv"');
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