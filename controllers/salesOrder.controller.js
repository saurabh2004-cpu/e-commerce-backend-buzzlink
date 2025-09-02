import SalesOrder from '../models/salesOrder.schema.js';
import csv from 'csv-parser';
import fs from 'fs';
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";


// Create a new sales order
const createSalesOrder = async (req, res) => {
    try {
        if (!req.body) {
            return res.json(new ApiResponse(400, null, "Request body is empty"));
        }

        const salesOrder = new SalesOrder(req.body);


        const savedOrder = await salesOrder.save();
        res.json(new ApiResponse(200, savedOrder, "Sales order created successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

// Get all sales orders with optional filtering
const getSalesOrders = async (req, res) => {
    const deletedOrders = await SalesOrder.find({});

    return res.json(new ApiResponse(200, deletedOrders, "Sales orders deleted successfully"));
    try {
        const {
            page = 1,
            limit = 10,
            documentNumber,
            customerName,
            startDate,
            endDate,
            itemSku
        } = req.query;

        let query = {};

        if (documentNumber) query.documentNumber = new RegExp(documentNumber, 'i');
        if (customerName) query.customerName = new RegExp(customerName, 'i');
        if (itemSku) query.itemSku = new RegExp(itemSku, 'i');

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { date: -1 }
        };

        const salesOrders = await SalesOrder.find(query)
            .limit(options.limit * 1)
            .skip((options.page - 1) * options.limit)
            .sort(options.sort);

        const total = await SalesOrder.countDocuments(query);

        res.json(new ApiResponse(200, {salesOrders,total:salesOrders.length}, "Sales orders retrieved successfully", total));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

// Get a single sales order by ID
const getSalesOrder = async (req, res) => {
    try {
        const salesOrder = await SalesOrder.findById(req.params.id);
        if (!salesOrder) {
            return res.json(new ApiResponse(404, null, "Sales order not found"));
        }
        res.json(new ApiResponse(200, salesOrder, "Sales order retrieved successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

// Update a sales order
const updateSalesOrder = async (req, res) => {
    try {

        const salesOrder = await SalesOrder.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!salesOrder) {
            return res.json(new ApiResponse(404, null, "Sales order not found"));
        }

        res.json(new ApiResponse(200, salesOrder, "Sales order updated successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

// Delete a sales order
const deleteSalesOrder = async (req, res) => {
    try {
        const salesOrder = await SalesOrder.findByIdAndDelete(req.params.id);

        if (!salesOrder) {
            return res.json(new ApiResponse(404, null, "Sales order not found"));
        }

        res.json(new ApiResponse(200, null, "Sales order deleted successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};


const importSalesOrders = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = file.path;
    const rows = [];

    // Step 1: Read raw CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv({ headers: false })) // Don't auto-use first row as header
        .on("data", (row) => rows.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    if (rows.length < 4) {
      return res.status(400).json({ error: "CSV does not have enough rows" });
    }

    // Step 2: Find the actual header row (look for "Date" in the first column)
    let headerRowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === "Date") {
        headerRowIndex = i;
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      return res.status(400).json({ error: "Could not find header row with 'Date' column" });
    }

    // Get headers from the identified row
    const headers = Object.values(rows[headerRowIndex]).map((h) => h.trim());
    
    // Data starts from the row after the header
    const dataRows = rows.slice(headerRowIndex + 1);

    const salesOrders = [];
    
    for (const rowObj of dataRows) {
      // Skip empty rows
      if (!rowObj || !rowObj[0] || rowObj[0].trim() === "") continue;
      
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = rowObj[idx] || "";
      });

      // Skip rows that don't have essential data
      if (!row.Date || !row["Document Number"] || !row.Item) continue;

      // Extract numbers from pack description (e.g., "Pack of 6" → 6)
      const packText = row.Units || "";
      let packQty = 0;
      
      // Handle different pack formats
      if (packText.toLowerCase().includes("pack of")) {
        packQty = parseInt(packText.replace(/\D/g, "")) || 0;
      } else if (packText.toLowerCase().includes("carton of")) {
        packQty = parseInt(packText.replace(/\D/g, "")) || 0;
      } else if (packText.toLowerCase() === "each") {
        packQty = 1;
      } else {
        // Default to 1 if we can't determine
        packQty = 1;
      }
      
      const qty = Number(row.Quantity) || 0;
      const amount = Number(row.Amount) || 0;

      // Clean up addresses - they might have newlines
      const shippingAddress = (row["Shipping Address"] || "").replace(/\n/g, ", ");
      const billingAddress = (row["Billing Address"] || "").replace(/\n/g, ", ");

      salesOrders.push({
        date: new Date(row.Date),
        documentNumber: row["Document Number"],
        customerName: row.Name,
        salesChannel: row["Sales Channel"],
        trackingNumber: row["Tracking #1"] || null,
        shippingAddress: shippingAddress,
        billingAddress: billingAddress,
        customerPO: row["Customer PO#"] || null,
        itemSku: row.Item,
        packQuantity: packQty,
        quantity: qty,
        amount: amount,
        finalAmount: amount, // The CSV already has the final amount calculated
      });
    }

    if (salesOrders.length > 0) {
      await SalesOrder.insertMany(salesOrders);
      console.log(`✅ ${salesOrders.length} sales orders imported successfully!`);
      return res.status(200).json({
        message: "Sales orders imported successfully",
        count: salesOrders.length,
      });
    } else {
      return res.status(400).json({ error: "No valid records found in CSV" });
    }
  } catch (err) {
    console.error("❌ Error importing sales orders:", err);
    return res.status(500).json({ error: "Failed to import sales orders" });
  }
};

//  sales orders to CSV
const SalesOrders = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let query = {};
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const salesOrders = await SalesOrder.find(query).sort({ date: -1 });

        if (salesOrders.length === 0) {
            return res.json(new ApiResponse(404, null, "No sales orders found"));
        }

        // Transform data to match CSV format
        const csvData = salesOrders.map(order => ({
            Date: order.date.toISOString().split('T')[0],
            'Document Number': order.documentNumber,
            Name: order.customerName,
            'Sales Channel': order.salesChannel,
            'Tracking #1': order.trackingNumber,
            'Shipping Address': order.shippingAddress,
            'Billing Address': order.billingAddress,
            'Customer PO#': order.customerPO,
            Item: order.itemSku,
            Units: order.packQuantity,
            Quantity: order.quantity,
            Amount: order.amount
        }));

        // Convert to CSV
        const parser = new Parser();
        const csv = parser.parse(csvData);

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=sales-orders-.csv');

        res.send(csv);
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};

// Get sales statistics
const getSalesStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let matchStage = {};
        if (startDate || endDate) {
            matchStage.date = {};
            if (startDate) matchStage.date.$gte = new Date(startDate);
            if (endDate) matchStage.date.$lte = new Date(endDate);
        }

        const stats = await SalesOrder.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$finalAmount' },
                    totalQuantity: { $sum: '$quantity' },
                    avgOrderValue: { $avg: '$finalAmount' }
                }
            }
        ]);

        const channelStats = await SalesOrder.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$salesChannel',
                    count: { $sum: 1 },
                    revenue: { $sum: '$finalAmount' }
                }
            }
        ]);

        const topProducts = await SalesOrder.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$itemSku',
                    count: { $sum: 1 },
                    revenue: { $sum: '$finalAmount' },
                    quantity: { $sum: '$quantity' }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 }
        ]);


        res.json(new ApiResponse(200, {
            overall: stats[0] || {
                totalOrders: 0,
                totalRevenue: 0,
                totalQuantity: 0,
                avgOrderValue: 0
            },
            byChannel: channelStats,
            topProducts
        }, "Sales statistics retrieved successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
};


export {
    createSalesOrder,
    getSalesOrders,
    getSalesOrder,
    updateSalesOrder,
    deleteSalesOrder,
    importSalesOrders,
    SalesOrders,
    getSalesStats
};