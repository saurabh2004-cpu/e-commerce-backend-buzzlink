import {
    createPricingGroupDiscount,
    getAllPricingGroupDiscounts,
    getPricingGroupDiscountById,
    updatePricingGroupDiscount,
    deletePricingGroupDiscount,
    importPricingGroupDiscounts,
    getUserPricingGroupDiscounts,
    exportPricingGroupDiscountsCSV
} from "../controllers/pricingGroupsDiscount.controller.js";

import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route('/create-pricing-group-discount').post(createPricingGroupDiscount);

router.route('/get-pricing-group-discounts').get(getAllPricingGroupDiscounts);

router.route('/get-pricing-group-discount/:id').get(getPricingGroupDiscountById);

router.route('/update-pricing-group-discount/:id').put(updatePricingGroupDiscount);

router.route('/delete-pricing-group-discount/:id').delete(deletePricingGroupDiscount);

router.route('/import-pricing-group-discounts').post(
    upload.single('discountGroups'),
    importPricingGroupDiscounts
);

router.route('/get-user-pricing-group-discounts/:customer').get(getUserPricingGroupDiscounts);

router.route('/export-pricing-group-discounts').get(exportPricingGroupDiscountsCSV);

export default router




