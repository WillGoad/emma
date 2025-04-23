import jwt from "jsonwebtoken";
import "dotenv/config";
import { NextFunction, Response } from "express";
import { prisma } from "..";
import { AuthenticatedRequest, EmmaJWTPayload } from "./types";
import { UserRole } from "@prisma/client";

// Middleware to validate JWT

export const checkJwt = async (
  req: AuthenticatedRequest,
  next: NextFunction
) => {
  // Default to guest user
  req.user = { role: UserRole.GUEST };

  try {
    // 1. Extract token from Authorization header
    const token = req.headers.authorization?.split("Bearer ")[1];

    // 2. Exit early if no token
    if (!token) return;

    // 3. Verify JWT configuration
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("Missing JWT_SECRET in environment");

    // 4. Verify and decode token
    const decoded = jwt.verify(token, secret) as EmmaJWTPayload;

    // 5. Find associated user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    // 6. Attach user if found
    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Log verification errors but continue as guest
    if (error instanceof Error) {
      console.error(`Authentication error: ${error.message}`);
    }
  } finally {
    // 7. Always continue to next middleware
    next();
  }
};
