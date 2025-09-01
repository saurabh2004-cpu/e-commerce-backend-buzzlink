import {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} from "../controllers/category.controller.js";
import express from "express";
import verifyAdmin from "../middlewares/adminMiddleware.js";

const router = express.Router();

router.route('/create-category').post(verifyAdmin, createCategory);

router.route('/get-categories').get(getCategories);

router.route('/get-category/:id').get(getCategoryById);

router.route('/update-category/:id').put(verifyAdmin, updateCategory);

router.route('/delete-category/:id').delete(verifyAdmin, deleteCategory);

export default router