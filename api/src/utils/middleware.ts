import jwt from "jsonwebtoken";
import 'dotenv/config';
import { Response, NextFunction } from "express";
import { prisma } from "..";
import { AuthenticatedRequest, EmmaJWTPayload } from "./types";

// Middleware to validate JWT

export const checkJwt = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  let token: string = req.headers["x-access-token"] as string;
  if (!token) {
    req.userId = undefined; // Mark user as unauthenticated
    return next();
  }
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res
        .status(500)
        .send({ ok: false, message: "JWT secret is not defined!" });
    }
    const decoded = jwt.verify(token, secret) as unknown as EmmaJWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });
    if (!user) {
      return res.status(401).send({ ok: false, message: "Unauthorized!" });
    }
    req.userId = decoded.id;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).send({
        ok: false,
        message: "TokenExpired",
      });
    }

    return res.status(401).send({
      ok: false,
      message: "Unauthorized!",
    });
  }
};
