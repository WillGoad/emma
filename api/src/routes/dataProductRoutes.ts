const express = require("express");
const router = express.Router();
import {
  createDataProduct,
  getDataProducts,
  recreateKongServices,
  updateDataProduct,
} from "../controllers/dataProductController";
import { checkJwt } from "../utils/middleware";

// Route to index data products in algolia
router.get("/get-count", getDataProducts);
router.get("/populate-kong-db", checkJwt, recreateKongServices);

// Operations on data products

router.post("/create", checkJwt, createDataProduct);
router.post("/update", checkJwt, updateDataProduct);

export default router;
