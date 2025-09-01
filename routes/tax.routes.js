import {
    createTax,
    getAllTaxes,
    getTaxById,
    updateTax,
    deleteTax,
} from "../controllers/tax.controller.js";
import verifyAdmin from "../middlewares/adminMiddleware.js";
import { Router } from "express";

const router = Router();

router.route('/create-tax').post(verifyAdmin, createTax);

router.route('/get-all-taxes').get(getAllTaxes);

router.route('/get-tax/:id').get(getTaxById);

router.route('/update-tax/:id').put(verifyAdmin, updateTax);

router.route('/delete-tax/:id').delete(verifyAdmin, deleteTax);

export default router
