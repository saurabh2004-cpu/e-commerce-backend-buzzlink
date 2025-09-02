import {
     createItemBasedDiscount,
    getAllItemBasedDiscounts,
    getItemBasedDiscountById,
    updateItemBasedDiscount,
    deleteItemBasedDiscount
}from "../controllers/itemBasedDiscount.controller.js";

import express from "express";
import verifyAdmin from "../middlewares/adminMiddleware.js";

const router = express.Router();    

router.route('/create-item-based-discount').post(verifyAdmin, createItemBasedDiscount);

router.route('/get-all-item-based-discounts').get(getAllItemBasedDiscounts);

router.route('/get-item-based-discount/:id').get(getItemBasedDiscountById);

router.route('/update-item-based-discount/:id').put(verifyAdmin, updateItemBasedDiscount);

router.route('/delete-item-based-discount/:id').delete(verifyAdmin, deleteItemBasedDiscount);

export default router