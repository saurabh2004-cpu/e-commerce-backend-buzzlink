import {createDeliveryVendor, getAllDeliveryVendors, getDeliveryVendorById, updateDeliveryVendor, deleteDeliveryVendor} from "../controllers/deliveryVendor.controller.js";
import verifyAdmin from "../middlewares/adminMiddleware.js";
import { Router } from "express";

const router = Router();

router.route('/create-delivery-vendor').post(verifyAdmin, createDeliveryVendor);

router.route('/get-all-delivery-vendors').get(getAllDeliveryVendors);

router.route('/get-delivery-vendor/:id').get(getDeliveryVendorById);

router.route('/update-delivery-vendor/:id').put(verifyAdmin, updateDeliveryVendor); 

router.route('/delete-delivery-vendor/:id').delete(verifyAdmin, deleteDeliveryVendor);

export default router