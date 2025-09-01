import { Router } from "express";
import {
    createSubCategory,
    getSubCategories,
    getSubCtegoryById,
    updateSubCategory,
    deleteSubCategory
} from "../controllers/subCategory.routes.js";
import verifyAdmin from "../middlewares/adminMiddleware.js";

const router = Router();

router.route('/create-sub-category').post(verifyAdmin, createSubCategory);

router.route('/get-sub-categories').get(getSubCategories);

router.route('/get-sub-category/:id').get(getSubCtegoryById);

router.route('/update-sub-category/:id').put(verifyAdmin, updateSubCategory);

router.route('/delete-sub-category/:id').delete(verifyAdmin, deleteSubCategory);

export default router