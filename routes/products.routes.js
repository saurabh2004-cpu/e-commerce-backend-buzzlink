import {
    createProduct,
    getAllProducts,
    getProductById,
    getProductBySku,
    updateProduct,
    deleteProduct,
    importProducts,
    exportProductsCSV
} from "../controllers/product.controller.js";
import { Router } from "express";
import verifyAdmin from "../middlewares/adminMiddleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route('/create-product').post(verifyAdmin,createProduct);

router.route('/get-all-products').get(getAllProducts);

router.route('/get-product/:id').get(getProductById);

router.route('/get-product-by-sku/:sku').get(getProductBySku);

router.route('/update-product/:id').put(verifyAdmin, updateProduct);

router.route('/delete-product/:id').delete(verifyAdmin,deleteProduct);

router.route('/import-products').post(
    verifyAdmin,
    upload.single('products'),
    importProducts
);

router.route('/export-products').get(verifyAdmin,exportProductsCSV);

export default router
