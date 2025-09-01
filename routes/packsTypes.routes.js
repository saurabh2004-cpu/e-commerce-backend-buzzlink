import {
    createPacksType,
    getAllPacksTypes,
    getPacksTypeById,
    updatePacksType,
    deletePacksType
} from "../controllers/packsTypes.controller.js";   

import express from "express";
import verifyAdmin from "../middlewares/adminMiddleware.js";

const router = express.Router();

router.route('/create-packs-type').post(verifyAdmin, createPacksType);

router.route('/get-all-packs-types').get(getAllPacksTypes);

router.route('/get-packs-type/:id').get(getPacksTypeById);

router.route('/update-packs-type/:id').put(verifyAdmin, updatePacksType);

router.route('/delete-packs-type/:id').delete(verifyAdmin, deletePacksType);

export default router