import express from "express";

import { PrismaClient } from "@prisma/client";
import cors from "cors";

import exchangeRoutes from "./routes/exchangeRoutes";
import userRoutes from "./routes/userRoutes";
import dataProductRoutes from "./routes/dataProductRoutes";
import { startScheduler } from "./services/scheduler";

export const prisma = new PrismaClient();

const app = express();

// Configure CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || process.env.INTERNAL_RENDER_URL, // Allow your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'], // Allowed headers
  credentials: true, // Allow cookies and credentials
  optionsSuccessStatus: 200 // Legacy browsers choke on 204
};

if (process.env.NODE_ENV === 'development') {
  corsOptions.origin = '*'; // Allow all origins in development
  corsOptions.credentials = false; 
}

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

app.use("/exchange", exchangeRoutes);
app.use("/user", userRoutes);
app.use("/data-products", dataProductRoutes);

const PORT = process.env.PORT || 3001;



if (process.env.NODE_ENV !== 'test') {
  startScheduler();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
