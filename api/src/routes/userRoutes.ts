const express = require("express");
const router = express.Router();
import {
  deleteAPIKeyForUser,
  getAPIKeysByUser,
  getUserDetails,
  getDashboardDataForUser,
  login,
  resetPassword,
  rotateAPIKeyForUser,
  sendPasswordResetEmail,
  signup,
  subscribeUserToDataProduct,
  unsubscribeUserFromDataProduct,
  verifyAccount,
} from "../controllers/userController";
import { checkJwt } from "../utils/middleware";

// Route to get data on an exchange by MIC code
router.post(
  "/subscribe-user-to-data-product",
  checkJwt,
  subscribeUserToDataProduct
);
router.post(
  "/unsubscribe-user-from-data-product",
  checkJwt,
  unsubscribeUserFromDataProduct
);
router.post("/get-user-details", checkJwt, getUserDetails);
router.get("/get-dashboard-data", checkJwt, getDashboardDataForUser);
router.post("/rotate-api-key", checkJwt, rotateAPIKeyForUser);
router.post("/delete-api-key", checkJwt, deleteAPIKeyForUser);
router.post("/get-api-key", checkJwt, getAPIKeysByUser);

// New routes for DIY Accounts, should combine with some of above routes and redo JWT logic
router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.post("/auth/verify", verifyAccount);

// Password resets
router.post("/auth/send-password-reset-code", sendPasswordResetEmail);
router.post("/auth/reset-password", resetPassword);

export default router;
