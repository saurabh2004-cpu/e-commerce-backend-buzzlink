// controllers/productController.js
import Product from "../models/products.schema.js";
import PricingGroups from "../models/pricingGroups.schema.js";
import Brand from "../models/brand.schema.js";
import Category from "../models/category.schema.js";
import SubCategory from "../models/subCategory.schema.js";
import PacksType from "../models/packsTypes.schema.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import csv from "csv-parser";
import fs from "fs";
import mongoose from "mongoose";

// Create a new product
const createProduct = async (req, res) => {
    try {
        const {
            // internalId,
            sku,
            ProductName,
            eachPrice,
            stockLevel,
            typesOfPacks,
            pricingGroup,
            commerceCategoriesOne,
            commerceCategoriesTwo,
            commerceCategoriesThree,
            storeDescription,
            pageTitle,
            eachBarcodes,
            packBarcodes
        } = req.body;


        console.log("Creating product:", req.body);

        // Validate required fields
        if (!sku || !ProductName || eachPrice === undefined || !pricingGroup) {
            throw new ApiError(400, "SKU, Product Name, Each Price, and Pricing Group are required");
        }

        // Check if product with same SKU already exists
        const existingProduct = await Product.findOne({
            sku: sku.toUpperCase()?.trim()
        });

        if (existingProduct) {
            throw new ApiError(400, "Product with this SKU already exists");
        }

        // Validate referenced documents exist
        const pricingGroupExists = await PricingGroups.findById(pricingGroup);
        if (!pricingGroupExists) {
            throw new ApiError(400, "Pricing Group not found");
        }

        if (commerceCategoriesOne) {
            const brandExists = await Brand.findById(commerceCategoriesOne);
            if (!brandExists) {
                throw new ApiError(400, "Brand not found");
            }
        }

        if (commerceCategoriesTwo) {
            const categoryExists = await Category.findById(commerceCategoriesTwo);
            if (!categoryExists) {
                throw new ApiError(400, "Category not found");
            }
        }

        if (commerceCategoriesThree) {
            const subCategoryExists = await SubCategory.findById(commerceCategoriesThree);
            if (!subCategoryExists) {
                throw new ApiError(400, "Sub Category not found");
            }
        }

        let packTypesObjects = [];
        if (typesOfPacks) {
            for (const pack of typesOfPacks) {
                const objectId = mongoose.Types.ObjectId.isValid(pack) ? pack : null;
                const packsTypeExists = await PacksType.findById(objectId);
                if (!packsTypeExists) {
                    throw new ApiError(400, "Packs Type not found");
                }
                packTypesObjects.push(packsTypeExists._id);
            }
        }

        console.log("Pack Types Objects:", packTypesObjects);

        // Create new product
        const product = await Product.create({
            sku: sku.toUpperCase().trim(),
            ProductName: ProductName.trim(),
            eachPrice: parseFloat(eachPrice),
            stockLevel: parseInt(stockLevel) || 0,
            typesOfPacks: packTypesObjects,
            pricingGroup: pricingGroup,
            commerceCategoriesOne: commerceCategoriesOne,
            commerceCategoriesTwo: commerceCategoriesTwo,
            commerceCategoriesThree: commerceCategoriesThree,
            storeDescription: storeDescription?.trim(),
            pageTitle: pageTitle?.trim(),
            eachBarcodes: eachBarcodes?.trim(),
            packBarcodes: packBarcodes?.trim()
        });

        // Populate references for response
        await product.populate([
            { path: 'pricingGroup' },
            { path: 'commerceCategoriesOne' },
            { path: 'commerceCategoriesTwo' },
            { path: 'commerceCategoriesThree' },
            { path: 'typesOfPacks' }
        ]);

        res.status(201).json(
            new ApiResponse(200, product, "Product created successfully")
        );

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

// Get all products with pagination and filtering
const getAllProducts = async (req, res) => {

    // await Product.deleteMany({});
    // return res.status(200).json(new ApiResponse(200, [], "Products deleted successfully"));
    try {
        const {
            page = 1,
            limit = 10,
            search,
            sku,
            pricingGroup,
            brand,
            category,
            subCategory,
            inactive,
            sortBy = 'ProductName',
            sortOrder = 'asc'
        } = req.query;

        const filter = {};

        // Search filter
        if (search) {
            filter.$or = [
                { ProductName: { $regex: search, $options: 'i' } },
                { storeDescription: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ];
        }

        // SKU filter
        if (sku) {
            filter.sku = { $regex: sku, $options: 'i' };
        }

        // Pricing group filter
        if (pricingGroup) {
            filter.pricingGroup = new mongoose.Types.ObjectId(pricingGroup);
        }

        // Brand filter
        if (brand) {
            filter.commerceCategoriesOne = new mongoose.Types.ObjectId(brand);
        }

        // Category filter
        if (category) {
            filter.commerceCategoriesTwo = new mongoose.Types.ObjectId(category);
        }

        // Sub Category filter
        if (subCategory) {
            filter.commerceCategoriesThree = new mongoose.Types.ObjectId(subCategory);
        }

        // Inactive filter
        if (inactive !== undefined) {
            filter.inactive = inactive === 'true';
        }

        // Build aggregation pipeline
        const aggregate = Product.aggregate([
            { $match: filter },

            // PricingGroup
            {
                $lookup: {
                    from: "pricinggroups",
                    localField: "pricingGroup",
                    foreignField: "_id",
                    as: "pricingGroup"
                }
            },
            { $unwind: { path: "$pricingGroup", preserveNullAndEmptyArrays: true } },

            // Brand
            {
                $lookup: {
                    from: "brands",
                    localField: "commerceCategoriesOne",
                    foreignField: "_id",
                    as: "commerceCategoriesOne"
                }
            },
            { $unwind: { path: "$commerceCategoriesOne", preserveNullAndEmptyArrays: true } },

            // Category
            {
                $lookup: {
                    from: "categories",
                    localField: "commerceCategoriesTwo",
                    foreignField: "_id",
                    as: "commerceCategoriesTwo"
                }
            },
            { $unwind: { path: "$commerceCategoriesTwo", preserveNullAndEmptyArrays: true } },

            // SubCategory
            {
                $lookup: {
                    from: "subcategories",
                    localField: "commerceCategoriesThree",
                    foreignField: "_id",
                    as: "commerceCategoriesThree"
                }
            },
            { $unwind: { path: "$commerceCategoriesThree", preserveNullAndEmptyArrays: true } },

            // TypesOfPacks
            {
                $lookup: {
                    from: "packstypes",
                    localField: "typesOfPacks",
                    foreignField: "_id",
                    as: "typesOfPacks"
                }
            },
            { $unwind: { path: "$typesOfPacks", preserveNullAndEmptyArrays: true } },

            // Sorting
            { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } }
        ]);

        // Pagination options
        const options = {
            page: parseInt(page),
            limit: parseInt(limit)
        };

        const products = await Product.aggregatePaginate(aggregate, options);

        res.status(200).json(
            new ApiResponse(200, products, "Products retrieved successfully")
        );

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};


// Get product by ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id)
            .populate('pricingGroup', 'name slug')
            .populate('commerceCategoriesOne', 'name slug')
            .populate('commerceCategoriesTwo', 'name slug')
            .populate('commerceCategoriesThree', 'name slug')
            .populate('typesOfPacks', 'name');

        if (!product) {
            throw new ApiError(404, "Product not found");
        }

        res.status(200).json(
            new ApiResponse(200, product, "Product retrieved successfully")
        );

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

// Get product by SKU
const getProductBySku = async (req, res) => {
    try {
        const { sku } = req.params;

        const product = await Product.findOne({ sku: sku.toUpperCase() })
            .populate('pricingGroup', 'name slug')
            .populate('commerceCategoriesOne', 'name slug')
            .populate('commerceCategoriesTwo', 'name slug')
            .populate('commerceCategoriesThree', 'name slug')
            .populate('typesOfPacks', 'name');

        if (!product) {
            throw new ApiError(404, "Product not found");
        }

        res.status(200).json(
            new ApiResponse(200, product, "Product retrieved successfully")
        );

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

// Update product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Find product
        const product = await Product.findById(id);
        if (!product) {
            throw new ApiError(404, "Product not found");
        }

        // Check for duplicate SKU if SKU is being updated
        if (updateData.sku && updateData.sku !== product.sku) {
            const existingProduct = await Product.findOne({
                sku: updateData.sku.toUpperCase().trim(),
                _id: { $ne: id }
            });

            if (existingProduct) {
                throw new ApiError(400, "Product with this SKU already exists");
            }
        }

        // Validate referenced documents exist if being updated
        if (updateData.pricingGroup) {
            const pricingGroupExists = await PricingGroups.findById(updateData.pricingGroup);
            if (!pricingGroupExists) {
                throw new ApiError(400, "Pricing Group not found");
            }
        }

        if (updateData.commerceCategoriesOne) {
            const brandExists = await Brand.findById(updateData.commerceCategoriesOne);
            if (!brandExists) {
                throw new ApiError(400, "Brand not found");
            }
        }

        if (updateData.commerceCategoriesTwo) {
            const categoryExists = await Category.findById(updateData.commerceCategoriesTwo);
            if (!categoryExists) {
                throw new ApiError(400, "Category not found");
            }
        }

        if (updateData.commerceCategoriesThree) {
            const subCategoryExists = await SubCategory.findById(updateData.commerceCategoriesThree);
            if (!subCategoryExists) {
                throw new ApiError(400, "Sub Category not found");
            }
        }

        if (updateData.typesOfPacks) {
            const packsTypeExists = await PacksType.findById(updateData.typesOfPacks);
            if (!packsTypeExists) {
                throw new ApiError(400, "Packs Type not found");
            }
        }

        // Clean and format update data
        if (updateData.sku) updateData.sku = updateData.sku.toUpperCase().trim();
        if (updateData.ProductName) updateData.ProductName = updateData.ProductName.trim();
        if (updateData.eachPrice) updateData.eachPrice = parseFloat(updateData.eachPrice);
        if (updateData.stockLevel) updateData.stockLevel = parseInt(updateData.stockLevel);

        // Handle array fields
        if (updateData.excludedUnitsOnStore && Array.isArray(updateData.excludedUnitsOnStore)) {
            updateData.excludedUnitsOnStore = updateData.excludedUnitsOnStore.map(u => u.trim());
        }
        if (updateData.eachBarcodes && Array.isArray(updateData.eachBarcodes)) {
            updateData.eachBarcodes = updateData.eachBarcodes.map(b => b.trim());
        }
        if (updateData.packBarcodes && Array.isArray(updateData.packBarcodes)) {
            updateData.packBarcodes = updateData.packBarcodes.map(b => b.trim());
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate([
            { path: 'pricingGroup', select: 'name slug' },
            { path: 'commerceCategoriesOne', select: 'name slug' },
            { path: 'commerceCategoriesTwo', select: 'name slug' },
            { path: 'commerceCategoriesThree', select: 'name slug' },
            { path: 'typesOfPacks', select: 'name' }
        ]);

        res.status(200).json(
            new ApiResponse(200, updatedProduct, "Product updated successfully")
        );

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

// Delete product
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            throw new ApiError(404, "Product not found");
        }

        res.status(200).json(
            new ApiResponse(200, null, "Product deleted successfully")
        );

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

// Import products from CSV (Simplified version for reference structure)
const importProducts = async (req, res) => {
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

        // Read the CSV file manually to handle the specific format
        const fileContent = fs.readFileSync(file.path, 'utf8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');

        // Skip the first two header rows
        const dataRows = lines.slice(2);

        for (const [index, row] of dataRows.entries()) {
            try {
                // Parse CSV row manually (since your CSV has quoted fields with commas)
                const columns = [];
                let currentColumn = '';
                let inQuotes = false;

                for (let i = 0; i < row.length; i++) {
                    const char = row[i];

                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        columns.push(currentColumn.trim());
                        currentColumn = '';
                    } else {
                        currentColumn += char;
                    }
                }
                columns.push(currentColumn.trim());

                // Skip empty rows
                if (columns.length < 5 || !columns[1] || columns[1] === 'Name') {
                    continue;
                }

                const internalId = columns[0];
                const sku = columns[1];
                const productName = columns[2];
                const eachPrice = columns[3];
                const type = columns[4];
                const primaryUnitsType = columns[5];
                const sellingUOMUnit = columns[6];
                const stockLevel = columns[7];
                const typesOfPacks = columns[8];
                const excludedUnitsOnStore = columns[9];
                const pricingGroupName = columns[10];
                const displayInWebsite = columns[11];
                const inactive = columns[12];
                const commerceLevel1 = columns[13];
                const commerceLevel2 = columns[14];
                const commerceLevel3 = columns[15];
                const storeDescription = columns[16];
                const pageTitle = columns[17];
                const eachBarcodes = columns[18];
                const packBarcodes = columns[19];

                importStats.totalRows++;

                // Skip empty rows
                if (!sku || !productName) {
                    console.log(`Skipping row ${index + 3} - missing SKU or product name`);
                    importStats.skipped++;
                    continue;
                }

                // Clean values
                const cleanSku = sku.trim().toUpperCase();
                const cleanProductName = productName.trim();
                const cleanEachPrice = parseFloat(eachPrice?.toString().replace(/[^\d.]/g, "")) || 0;
                const cleanStockLevel = parseInt(stockLevel) || 0;
                const cleanInactive = inactive?.toLowerCase() === "yes";
                const cleanDisplayInWebsite = displayInWebsite?.toLowerCase() === "yes";

                console.log(`Processing: ${cleanSku} - ${cleanProductName}`);

                // --- FIND OR CREATE REFERENCES ---

                // Pricing group
                let pricingGroupDoc = null;
                if (pricingGroupName) {
                    pricingGroupDoc = await PricingGroups.findOne({
                        name: { $regex: new RegExp(pricingGroupName.trim(), "i") }
                    });

                    if (!pricingGroupDoc) {
                        pricingGroupDoc = await PricingGroups.create({
                            name: pricingGroupName.trim(),
                            slug: pricingGroupName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                        });
                        console.log(`Created new pricing group: ${pricingGroupName}`);
                    }
                }

                // Brand (Commerce Category - Level 1)
                let brandDoc = null;
                if (commerceLevel1) {
                    brandDoc = await Brand.findOne({
                        name: { $regex: new RegExp(commerceLevel1.trim(), "i") }
                    });

                    if (!brandDoc) {
                        brandDoc = await Brand.create({
                            name: commerceLevel1.trim(),
                            slug: commerceLevel1.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                        });
                        console.log(`Created new brand: ${commerceLevel1}`);
                    }
                }

                // Category (Commerce Category - Level 2)
                let categoryDoc = null;
                if (commerceLevel2) {
                    categoryDoc = await Category.findOne({
                        name: { $regex: new RegExp(commerceLevel2.trim(), "i") }
                    });

                    if (!categoryDoc) {
                        categoryDoc = await Category.create({
                            name: commerceLevel2.trim(),
                            slug: commerceLevel2.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                        });
                        console.log(`Created new category: ${commerceLevel2}`);
                    }
                }

                // SubCategory (Commerce Category - Level 3)
                let subCategoryDoc = null;
                if (commerceLevel3) {
                    subCategoryDoc = await SubCategory.findOne({
                        name: { $regex: new RegExp(commerceLevel3.trim(), "i") }
                    });

                    if (!subCategoryDoc) {
                        subCategoryDoc = await SubCategory.create({
                            name: commerceLevel3.trim(),
                            slug: commerceLevel3.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                        });
                        console.log(`Created new subcategory: ${commerceLevel3}`);
                    }
                }

                // Types of packs
                let packsTypeDoc = null;
                if (typesOfPacks) {
                    const packTypeName = typesOfPacks.split(",")[0].trim();
                    if (packTypeName) {
                        packsTypeDoc = await PacksType.findOne({
                            name: { $regex: new RegExp(packTypeName, "i") }
                        });

                        if (!packsTypeDoc) {
                            packsTypeDoc = await PacksType.create({
                                name: packTypeName,
                                quantity: packTypeName
                            });
                            console.log(`Created new packs type: ${packTypeName}`);
                        }
                    }
                }

                // Excluded units
                const excludedUnitsDocs = [];
                if (excludedUnitsOnStore) {
                    const units = excludedUnitsOnStore.split(",").map(u => u.trim()).filter(u => u);
                    for (const unitName of units) {
                        const unitDoc = await PacksType.findOne({
                            name: { $regex: new RegExp(unitName, "i") }
                        });

                        if (!unitDoc) {
                            const newUnitDoc = await PacksType.create({
                                name: unitName,
                                quantity: unitName
                            });
                            excludedUnitsDocs.push(newUnitDoc._id);
                            console.log(`Created new packs type for excluded unit: ${unitName}`);
                        } else {
                            excludedUnitsDocs.push(unitDoc._id);
                        }
                    }
                }

                // --- UPSERT PRODUCT ---
                const existingProduct = await Product.findOne({ sku: cleanSku });

                if (existingProduct) {
                    // Update existing product
                    existingProduct.internalId = internalId;
                    existingProduct.ProductName = cleanProductName;
                    existingProduct.eachPrice = cleanEachPrice;
                    existingProduct.type = type || "Inventory Item";
                    existingProduct.primaryUnitsType = primaryUnitsType;
                    existingProduct.pricingGroup = pricingGroupDoc?._id;
                    existingProduct.sellingUOMUnit = sellingUOMUnit;
                    existingProduct.stockLevel = cleanStockLevel;
                    existingProduct.typesOfPacks = packsTypeDoc?._id;
                    existingProduct.excludedUnitsOnStore = excludedUnitsDocs;
                    existingProduct.displayInWebsite = cleanDisplayInWebsite;
                    existingProduct.inactive = cleanInactive;
                    existingProduct.commerceCategoriesOne = brandDoc?._id;
                    existingProduct.commerceCategoriesTwo = categoryDoc?._id;
                    existingProduct.commerceCategoriesThree = subCategoryDoc?._id;
                    existingProduct.storeDescription = storeDescription;
                    existingProduct.pageTitle = pageTitle;
                    existingProduct.eachBarcodes = eachBarcodes;
                    existingProduct.packBarcodes = packBarcodes;

                    await existingProduct.save();
                    importStats.updated++;
                    console.log(`✓ Updated: ${cleanSku}`);
                } else {
                    // Create new product
                    const newProduct = await Product.create({
                        internalId: internalId,
                        sku: cleanSku,
                        ProductName: cleanProductName,
                        eachPrice: cleanEachPrice,
                        type: type || "Inventory Item",
                        primaryUnitsType: primaryUnitsType,
                        pricingGroup: pricingGroupDoc?._id,
                        sellingUOMUnit: sellingUOMUnit,
                        stockLevel: cleanStockLevel,
                        typesOfPacks: packsTypeDoc?._id,
                        excludedUnitsOnStore: excludedUnitsDocs,
                        displayInWebsite: cleanDisplayInWebsite,
                        inactive: cleanInactive,
                        commerceCategoriesOne: brandDoc?._id,
                        commerceCategoriesTwo: categoryDoc?._id,
                        commerceCategoriesThree: subCategoryDoc?._id,
                        storeDescription: storeDescription,
                        pageTitle: pageTitle,
                        eachBarcodes: eachBarcodes,
                        packBarcodes: packBarcodes
                    });

                    importStats.created++;
                    console.log(`✓ Created: ${cleanSku}`);
                }

                importStats.processed++;

            } catch (error) {
                console.error(`❌ Error in row ${index + 3}:`, error.message);
                importStats.errors++;
                importStats.errorDetails.push({
                    row: index + 3,
                    error: error.message
                });
            }
        }

        // Clean up uploaded file
        fs.unlinkSync(file.path);

        console.log("=== IMPORT FINISHED ===", importStats);
        res.status(200).json(new ApiResponse(200, { importStats }, "Import completed"));

    } catch (error) {
        // Clean up uploaded file in case of error
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        throw new ApiError(error.statusCode || 500, error.message);
    }
};


// Export products to CSV
const exportProductsCSV = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('pricingGroup', 'name')
            .populate('commerceCategoriesOne', 'name')
            .populate('commerceCategoriesTwo', 'name')
            .populate('commerceCategoriesThree', 'name')
            .populate('typesOfPacks', 'name')
            .sort({ sku: 1 });

        if (!products || products.length === 0) {
            throw new ApiError(404, "No products found");
        }

        // Create CSV header
        let csvData = 'SKU,Product Name,Each Price,Type,Stock Level,Pricing Group,Brand,Category,SubCategory,Packs Type,Display in Website,Inactive\n';

        // Add product data
        products.forEach((product) => {
            const row = [
                `"${product.sku.replace(/"/g, '""')}"`,
                `"${product.ProductName.replace(/"/g, '""')}"`,
                product.eachPrice,
                `"${product.type.replace(/"/g, '""')}"`,
                product.stockLevel,
                `"${product.pricingGroup?.name.replace(/"/g, '""') || ''}"`,
                `"${product.commerceCategoriesOne?.name.replace(/"/g, '""') || ''}"`,
                `"${product.commerceCategoriesTwo?.name.replace(/"/g, '""') || ''}"`,
                `"${product.commerceCategoriesThree?.name.replace(/"/g, '""') || ''}"`,
                `"${product.typesOfPacks?.name.replace(/"/g, '""') || ''}"`,
                product.displayInWebsite ? 'Yes' : 'No',
                product.inactive ? 'Yes' : 'No'
            ].join(',');

            csvData += row + '\n';
        });

        // Set response headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="products_export.csv"');
        res.setHeader('Content-Length', Buffer.byteLength(csvData, 'utf8'));

        res.status(200).send(csvData);

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

export {
    createProduct,
    getAllProducts,
    getProductById,
    getProductBySku,
    updateProduct,
    deleteProduct,
    importProducts,
    exportProductsCSV
};