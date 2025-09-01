import { Router } from "express";
import { createPricingGroup, getPricingGroups, getPricingGroupById, updatePricingGroup, deletePricingGroup } from "../controllers/pricingGroups.controller.js   ";


const router = Router();

router.route('/create-pricing-group').post(createPricingGroup);

router.route('/get-pricing-groups').get(getPricingGroups);

router.route('/get-pricing-group/:id').get(getPricingGroupById);

router.route('/update-pricing-group/:id').put(updatePricingGroup);

router.route('/delete-pricing-group/:id').delete(deletePricingGroup);

export default router