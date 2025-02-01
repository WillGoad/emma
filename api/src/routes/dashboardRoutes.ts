const express = require("express");
const router = express.Router();
import { getDashboardDataForUser } from "../controllers/dashboardController";
import { checkJwt } from "../utils/middleware";

router.get("/get-dashboard-data", checkJwt, getDashboardDataForUser);

export default router;
