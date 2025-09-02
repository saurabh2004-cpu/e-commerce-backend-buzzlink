import {
    createSalesOrder,
    getSalesOrders,
    getSalesOrder,
    updateSalesOrder,
    deleteSalesOrder,
    importSalesOrders,
    getSalesStats
} from "../controllers/salesOrder.controller.js";
import express from "express";
import verifyAdmin from "../middlewares/adminMiddleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.route('/create-sales-order').post(verifyAdmin, createSalesOrder);

router.route('/get-sales-orders').get(getSalesOrders);

router.route('/get-sales-order/:id').get(getSalesOrder);

router.route('/update-sales-order/:id').put(verifyAdmin, updateSalesOrder);

router.route('/delete-sales-order/:id').delete(verifyAdmin, deleteSalesOrder);

router.route('/import-sales-orders').post(verifyAdmin,upload.single('salesOrders'), importSalesOrders);

router.route('/get-sales-stats').get(getSalesStats);

export default router
