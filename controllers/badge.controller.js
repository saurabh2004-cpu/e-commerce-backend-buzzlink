import ItemBadge from "../models/badge.schema.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import fs from "fs";
import csv from "csv-parser";

// Create a new Item Badge
const createItemBadge = async (req, res) => {
    try {
        const { name, backgroundColor, text, slug } = req.body;

        const exists = await ItemBadge.findOne({ slug });
        if (exists) {
            return res.json(new ApiResponse(400, null, "Badge already exists"));
        }

        const badge = new ItemBadge({
            name,
            backgroundColor,
            text,
            slug
        });
        await badge.save();

        res.json(new ApiResponse(201, badge, "Badge created successfully"));
    } catch (err) {
        throw new ApiError(500, err.message);
    }
};

//  Get all badges
const getAllBadges = async (req, res) => {
    try {
        const badges = await ItemBadge.find();

        if (!badges || badges.length === 0) {
            return res.status(404).json({ message: "Badges not found" });
        }

        res.json(new ApiResponse(200, badges, "Badges fetched successfully"));
    } catch (err) {
        throw new ApiError(500, err.message);
    }
};

// Get single badge by ID
const getBadgeById = async (req, res) => {
    try {
        const badge = await ItemBadge.findById(req.params.id);
        if (!badge) {
            throw new ApiError(404, "Item Badge not found");
        }

        res.json(new ApiResponse(200, badge, "Item Badge fetched successfully"));
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

//  Update badge
const updateItemBadge = async (req, res) => {
    try {
        const { name, backgroundColor, text, slug } = req.body;

        const badge = await ItemBadge.findByIdAndUpdate(
            req.params.id,
            {
                name,
                backgroundColor,
                text,
                slug,
            },
            { new: true, runValidators: true }
        );

        if (!badge) {
            throw new ApiError(404, "Error while updating badge");
        }

        res.json(new ApiResponse(200, badge, "Badge updated successfully"));
    } catch (err) {
        throw new ApiError(500, err.message);
    }
};

// Delete badge
const deleteItemBadge = async (req, res) => {
    try {
        const badge = await ItemBadge.findByIdAndDelete(req.params.id);

        if (!badge) {
            throw new ApiError(404, "Item Badge not found");
        }

        res.json(new ApiResponse(200, badge, "Item Badge deleted successfully"));
    } catch (err) {
        throw new ApiError(500, err.message);
    }
};

// Import item badges from CSV
const importItemBadges = async (req, res) => {
    const file = req.file;

    if (!file) {
        throw new ApiError(400, "No file uploaded");
    }

    try {
        const results = [];
        const importStats = {
            totalRows: 0,
            processed: 0,
            created: 0,
            updated: 0,
            skipped: 0,
            errors: 0,
            errorDetails: []
        };

        fs.createReadStream(file.path)
            .pipe(csv())
            .on("data", (data) => results.push(data))
            .on("end", async () => {
                importStats.totalRows = results.length;
                console.log('=== ITEM BADGE IMPORT STARTED ===');
                console.log(`Total rows in CSV: ${importStats.totalRows}`);

                for (const [index, row] of results.entries()) {
                    try {
                        const internalId = row['Internal ID'];
                        const name = row['Name'];
                        const backgroundColor = row['Background Color'];
                        const badgeText = row['Badge Text'];
                        const shape = row['Shape'];

                        // Skip header or empty rows
                        if (!internalId || internalId === 'Internal ID' || !name) {
                            console.log('Skipping header or empty row');
                            continue;
                        }

                        importStats.processed++;
                        console.log(`Processing badge: ${name}`);

                        // Validate required fields
                        if (!backgroundColor || !badgeText) {
                            console.log(`Skipping ${name} - missing required fields`);
                            importStats.skipped++;
                            continue;
                        }

                        // Create slug from name
                        const slug = name
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)/g, '');

                        // Check if badge already exists by name or slug
                        const existingBadge = await ItemBadge.findOne({
                            $or: [
                                { name: name.trim() },
                                { slug: slug }
                            ]
                        });

                        let badge;

                        if (existingBadge) {
                            // Update existing badge
                            existingBadge.backgroundColor = backgroundColor.trim();
                            existingBadge.text = badgeText.trim();
                            existingBadge.shape = shape?.trim() || '';
                            badge = await existingBadge.save();
                            importStats.updated++;
                            console.log(`✓ Updated badge: ${name}`);
                        } else {
                            // Create new badge
                            badge = await ItemBadge.create({
                                name: name.trim(),
                                backgroundColor: backgroundColor.trim(),
                                text: badgeText.trim(),
                                shape: shape?.trim() || '',
                                slug: slug
                            });
                            importStats.created++;
                            console.log(`✓ Created badge: ${name}`);
                        }

                    } catch (error) {
                        console.error(`❌ Error processing row ${index}:`, error.message);
                        importStats.errors++;
                        importStats.errorDetails.push({
                            rowIndex: index,
                            rowData: row,
                            error: error.message
                        });
                    }
                }

                // Clean up uploaded file
                fs.unlinkSync(file.path);

                console.log('\n=== IMPORT COMPLETED ===');
                console.log('Final stats:', importStats);

                res.status(200).json(
                    new ApiResponse(200, { importStats }, "Item badges imported successfully")
                );
            })
            .on("error", (error) => {
                console.error("Error reading CSV file:", error.message);
                throw new ApiError(500, "Error reading CSV file");
            });

    } catch (error) {
        // Clean up uploaded file in case of error
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

export { createItemBadge, getAllBadges, getBadgeById, updateItemBadge, deleteItemBadge, importItemBadges };


