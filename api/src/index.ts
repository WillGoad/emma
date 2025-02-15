import express from "express";

import { PrismaClient } from "@prisma/client";
import cors from "cors";

import exchangeRoutes from "./routes/exchangeRoutes";
import userRoutes from "./routes/userRoutes";
import dataProductRoutes from "./routes/dataProductRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import { startScheduler } from "./services/scheduler";

export const prisma = new PrismaClient();

const app = express();

app.use(cors());

app.use(express.json());

app.use("/exchange", exchangeRoutes);
app.use("/user", userRoutes);
app.use("/data-products", dataProductRoutes);
app.use("/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 3001;

startScheduler();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
