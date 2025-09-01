import {
    signup,
    loginAdmin,
    logout,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentAdmin,
    importUsers,
    getAllUsers,
    createSingleUser
} from "../controllers/admin.controller.js";
import verifyAdmin from "../middlewares/adminMiddleware.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.route('/signup').post(signup);

router.route('/login').post(loginAdmin);

router.route('/logout').post(verifyAdmin, logout);

router.route('/refresh-access-token').post(refreshAccessToken);

router.route('/change-password').patch(verifyAdmin, changeCurrentPassword);

router.route('/get-current-admin').get(verifyAdmin, getCurrentAdmin);

router.route('/import-users').post(
    verifyAdmin,
    upload.single('users'),
    importUsers
);

router.route('/create-single-user').post(verifyAdmin, createSingleUser);

router.route('/get-all-users').get(verifyAdmin, getAllUsers);




export default router
