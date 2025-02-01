const express = require("express");
const router = express.Router();
import { getExchangeByMic } from "../controllers/exchangeController";

// Route to get data on an exchange by MIC code
router.get("/", getExchangeByMic);

export default router;
