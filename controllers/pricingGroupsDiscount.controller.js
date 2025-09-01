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
        const { pricingGroupId, customerId, percentage } = req.body;

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
            user: customerId,
            percentage
        });

        // Populate references
        await discount.populate("pricingGroup");
        await discount.populate("user", "customerName customerId email");

        res.status(201).json(
            new ApiResponse(201, discount, "Pricing group discount created successfully")
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
        const { percentage } = req.body;

        if (percentage === undefined) {
            throw new ApiError(400, "Percentage is required");
        }

        if (percentage < 0 || percentage > 100) {
            throw new ApiError(400, "Percentage must be between 0 and 100");
        }

        const discount = await PricingGroupDiscount.findByIdAndUpdate(
            id,
            { percentage },
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
                console.log('Raw CSV data:', JSON.stringify(results, null, 2));

                for (const [index, row] of results.entries()) {
                    try {
                        const customerId = row['Customer Id'];
                        console.log(`\n=== Processing row ${index}: ${customerId} ===`);

                        // Skip header or empty rows
                        if (!customerId || customerId === 'Customer Id') {
                            console.log('Skipping header or empty row');
                            continue;
                        }

                        importStats.processedCustomers++;
                        console.log(`Processing customer: ${customerId}`);

                        let pricingGroupsProcessed = 0;

                        // Process each pricing group column
                        for (let i = 1; i <= 18; i++) {
                            const pricingGroupName = row[`Customer - Group Pricing ${i} : Pricing Group`];
                            const percentageStr = row[`Customer - Group Pricing ${i} : Price Level`];

                            // Skip if no data for this pricing group
                            if (!pricingGroupName || !percentageStr) {
                                console.log(`Skipping empty pricing group ${i}`);
                                continue;
                            }

                            console.log(`Processing PG ${i}: ${pricingGroupName} - ${percentageStr}`);
                            pricingGroupsProcessed++;

                            // Clean up percentage value (remove % sign if present)
                            const percentage = parseFloat(percentageStr.replace('%', ''));

                            // Validate percentage
                            if (isNaN(percentage) || percentage < 0 || percentage > 100) {
                                console.log(`Invalid percentage for ${pricingGroupName}: ${percentageStr}`);
                                importStats.skippedDiscounts++;
                                continue;
                            }

                            // Find or create pricing group
                            let pricingGroup = await PricingGroups.findOne({
                                name: pricingGroupName
                            });

                            if (!pricingGroup) {
                                // Create slug from name
                                const slug = pricingGroupName
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, '-')
                                    .replace(/(^-|-$)/g, '');

                                pricingGroup = await PricingGroups.create({
                                    name: pricingGroupName,
                                    slug
                                });
                                console.log(`Created new pricing group: ${pricingGroupName}`);
                            }

                            // Check if discount already exists for this customer and pricing group
                            const existingDiscount = await PricingGroupDiscount.findOne({
                                pricingGroup: pricingGroup._id,
                                customerId: customerId
                            });

                            let discount;

                            if (existingDiscount) {
                                // Update existing discount
                                existingDiscount.percentage = percentage;
                                discount = await existingDiscount.save();
                                importStats.updatedDiscounts++;
                                console.log(`✓ Updated discount for ${customerId}, ${pricingGroupName}`);
                            } else {
                                // Create new discount
                                discount = await PricingGroupDiscount.create({
                                    pricingGroup: pricingGroup._id,
                                    customerId: customerId,
                                    percentage: percentage
                                });
                                importStats.createdDiscounts++;
                                console.log(`✓ Created discount for ${customerId}, ${pricingGroupName}`);
                            }

                            // Add ALL processed discounts to the array
                            if (discount) {
                                const discountWithDetails = {
                                    ...discount.toObject(),
                                    pricingGroupName: pricingGroupName,
                                    customerId: customerId
                                };
                                allProcessedDiscounts.push(discountWithDetails);
                            }
                        }

                        console.log(`Processed ${pricingGroupsProcessed} pricing groups for ${customerId}`);

                    } catch (error) {
                        console.error(`❌ Error processing row ${index} for customer ${row['Customer Id']}:`, error.message);
                        console.error('Error stack:', error.stack);
                        importStats.errors++;
                        importStats.errorDetails.push({
                            customerId: row['Customer Id'],
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


// controllers/pricingGroupDiscountController.js

// Export pricing group discounts in the same format as import CSV
const exportPricingGroupDiscountsCSV = async (req, res) => {
    try {
        // Get all discounts with populated pricing group info
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
            discountsByCustomer[customerId].push({
                pricingGroupName: discount.pricingGroup.name,
                percentage: discount.percentage
            });
        });

        // Create CSV header matching the import format exactly
        let csvData = 'Customer Id';
        
        // Add pricing group columns (up to 18 as per import template)
        for (let i = 1; i <= 18; i++) {
            csvData += `,Customer - Group Pricing ${i} : Pricing Group,Customer - Group Pricing ${i} : Price Level`;
        }
        csvData += '\n';

        // Process each customer
        for (const [customerId, customerDiscounts] of Object.entries(discountsByCustomer)) {
            let row = customerId;
            
            // Add up to 18 pricing groups with their discounts
            for (let i = 0; i < 18; i++) {
                if (i < customerDiscounts.length) {
                    const discount = customerDiscounts[i];
                    row += `,"${discount.pricingGroupName.replace(/"/g, '""')}","${discount.percentage}%"`;
                } else {
                    row += ',,'; // Empty columns for missing pricing groups
                }
            }

            csvData += row + '\n';
        }

        // Set response headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="pricing_group_discounts_export.csv"');
        res.setHeader('Content-Length', Buffer.byteLength(csvData, 'utf8'));

        // Send CSV data
        res.status(200).send(csvData);

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

// Export specific customer's pricing group discounts
const exportCustomerPricingGroupDiscountsCSV = async (req, res) => {
    try {
        const { customerId } = req.params;

        // Get all discounts for this customer with populated pricing group info
        const discounts = await PricingGroupDiscount.find({ customerId })
            .populate("pricingGroup", "name")
            .sort({ "pricingGroup.name": 1 });

        if (!discounts || discounts.length === 0) {
            throw new ApiError(404, "No pricing group discounts found for this customer");
        }

        // Create CSV header matching the import format exactly
        let csvData = 'Customer Id';
        
        // Add pricing group columns (up to 18 as per import template)
        for (let i = 1; i <= 18; i++) {
            csvData += `,Customer - Group Pricing ${i} : Pricing Group,Customer - Group Pricing ${i} : Price Level`;
        }
        csvData += '\n';

        // Start the row with customer ID
        let row = customerId;
        
        // Add up to 18 pricing groups with their discounts
        for (let i = 0; i < 18; i++) {
            if (i < discounts.length) {
                const discount = discounts[i];
                row += `,"${discount.pricingGroup.name.replace(/"/g, '""')}","${discount.percentage}%"`;
            } else {
                row += ',,'; // Empty columns for missing pricing groups
            }
        }

        csvData += row + '\n';

        // Set response headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${customerId}_pricing_discounts_export.csv"`);
        res.setHeader('Content-Length', Buffer.byteLength(csvData, 'utf8'));

        // Send CSV data
        res.status(200).send(csvData);

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

// Export empty template in the same format for manual filling
const exportPricingGroupDiscountsTemplateCSV = async (req, res) => {
    try {
        // Get all pricing groups for reference
        const pricingGroups = await PricingGroups.find().sort({ name: 1 });

        // Create CSV header matching the import format exactly
        let csvData = 'Customer Id';
        
        // Add pricing group columns (up to 18 as per import template)
        for (let i = 1; i <= 18; i++) {
            csvData += `,Customer - Group Pricing ${i} : Pricing Group,Customer - Group Pricing ${i} : Price Level`;
        }
        csvData += '\n';

        // Add sample rows with the first few pricing groups
        const sampleCustomers = [
            { id: 'CUS001149', discounts: 9 },
            { id: 'CUS002339', discounts: 18 },
            { id: 'CUS002403', discounts: 15 },
            { id: 'CUS005035', discounts: 3 }
        ];

        for (const sample of sampleCustomers) {
            let sampleRow = sample.id;
            
            for (let i = 0; i < 18; i++) {
                if (i < pricingGroups.length && i < sample.discounts) {
                    // Use example percentages: 5%, 10%, 15%, 20% etc.
                    const examplePercentage = ((i % 4) + 1) * 5;
                    sampleRow += `,"${pricingGroups[i].name.replace(/"/g, '""')}","${examplePercentage}%"`;
                } else {
                    sampleRow += ',,'; // Empty columns
                }
            }

            csvData += sampleRow + '\n';
        }

        // Add instructions
        csvData += '\n# Instructions:\n';
        csvData += '# 1. Keep the header format exactly as shown\n';
        csvData += '# 2. Customer Id format: CUS followed by 6 digits (e.g., CUS001234)\n';
        csvData += '# 3. Percentage format: Number followed by % sign (e.g., 15%)\n';
        csvData += '# 4. Empty cells will be ignored during import\n';

        // Set response headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="pricing_group_discounts_template.csv"');
        res.setHeader('Content-Length', Buffer.byteLength(csvData, 'utf8'));

        // Send CSV data
        res.status(200).send(csvData);

    } catch (error) {
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