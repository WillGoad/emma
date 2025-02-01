import express from "express";

import { PrismaClient } from "@prisma/client";
import cors from "cors";

import exchangeRoutes from "./routes/exchangeRoutes";
import userRoutes from "./routes/userRoutes";
import dataProductRoutes from "./routes/dataProductRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";

export const prisma = new PrismaClient();

const app = express();

const corsOptions = {
  origin: [
    process.env.FRONTEND_URL, // Production URL
    'http://localhost:3000',  // Local development
    'http://frontend:3000'    // Docker internal
  ].filter((url): url is string => url !== undefined),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json());

app.use("/exchange", exchangeRoutes);
app.use("/user", userRoutes);
app.use("/data-products", dataProductRoutes);
app.use("/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
