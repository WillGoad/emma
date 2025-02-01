const express = require("express");
const router = express.Router();
import {
  createAPIKeyForUser,
  deleteAPIKeyForUser,
  getAPIKeysByUser,
  getUserDetails,
  login,
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
  subscribeUserToDataProduct,
);
router.post(
  "/unsubscribe-user-from-data-product",
  checkJwt,
  unsubscribeUserFromDataProduct,
);
router.post("/get-user-details", checkJwt, getUserDetails);
router.post("/create-api-key", checkJwt, createAPIKeyForUser);
router.post("/delete-api-key", checkJwt, deleteAPIKeyForUser);
router.post("/get-api-key", checkJwt, getAPIKeysByUser);

// New routes for DIY Accounts, should combine with some of above routes and redo JWT logic
router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.post("/auth/verify", verifyAccount);

export default router;
