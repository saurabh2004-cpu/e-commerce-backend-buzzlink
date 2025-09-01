import {
    createItemBadge,
    getAllBadges,
    getBadgeById,
    updateItemBadge,
    deleteItemBadge,
    importItemBadges
} from "../controllers/badge.controller.js";
import { Router } from "express";
import verifyAdmin from "../middlewares/adminMiddleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route('/create-badge').post(verifyAdmin, createItemBadge);

router.route('/get-badges').get(getAllBadges);

router.route('/get-badge/:id').get(getBadgeById);

router.route('/update-badge/:id').put(verifyAdmin, updateItemBadge);

router.route('/delete-badge/:id').delete(verifyAdmin, deleteItemBadge);

router.route('/import-badges').post(
    verifyAdmin,
    upload.single('badges'),
    importItemBadges
);

export default router