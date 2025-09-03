import { Router } from "express";
import verifyAdmin from "../middlewares/adminMiddleware.js";
import {
    createBrand,
    getBrands,
    getBrandById,
    updateBrand,
    deleteBrand,
} from "../controllers/brand.controller.js";

const router = Router();

router.route('/create-brand').post(verifyAdmin, createBrand);

router.route('/get-brands-list').get(getBrands);

router.route('/get-brand/:id').get(getBrandById);

router.route('/update-brand/:id').put(verifyAdmin, updateBrand);

router.route('/delete-brand/:id').delete(verifyAdmin, deleteBrand);

export default router