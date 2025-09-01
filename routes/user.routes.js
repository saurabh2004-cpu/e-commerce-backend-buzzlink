import { Router } from "express";
import verifyUser from "../middlewares/user.middleware.js";
import {
    userSignup,
    login,
    logout,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser
} from "../controllers/user.comntroller.js";


const router = Router();

router.route('/user-signup').post(userSignup);

router.route('/login').post(login);

router.route('/logout').post(verifyUser, logout);

router.route('/refresh-access-token').post(refreshAccessToken);

router.route('/change-password').post(verifyUser, changeCurrentPassword);

router.route('/get-current-user').get(verifyUser, getCurrentUser);

export default router