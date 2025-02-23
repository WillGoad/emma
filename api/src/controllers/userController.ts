import { Request, Response } from "express";
import sgMail from "@sendgrid/mail";
import jwt from "jsonwebtoken";
import { prisma } from "..";
import {
  AuthenticatedRequest,
  KeyAuth,
  DataProductWithOrganization,
  Organisation,
} from "../utils/types";
import "dotenv/config";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { Subscription, UserRole, DataProductStatus } from "@prisma/client";
import {
  addUserToFreeProducts,
  addUserToProductACL,
  createKongConsumer,
  deleteUserAPIKeyInKong,
  getConsumerById,
  getUserAPIKeyFromKong,
  rotateUserAPIKey,
  getAdminDataProductDetailsFromKong,
} from "../utils/kong";
import { calculateEndTime } from "../utils/helpers";

export const subscribeUserToDataProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user || req.user.role !== UserRole.DATA_BUYER) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const userId = req.user.id;
    const { productId } = req.body;

    // Validate productId format
    if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
      res.status(400).json({ message: "Invalid product ID format" });
      return;
    }

    // Use transaction for atomic operations
    const [user, dataProduct] = await prisma.$transaction([
      prisma.user.findUnique({
        where: { id: userId },
        include: { subscriptions: { select: { id: true } }, balances: true },
      }),
      prisma.dataProduct.findUnique({
        where: { id: productId },
      }),
    ]);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (!dataProduct) {
      res.status(404).json({ message: "Data product not found" });
      return;
    }

    // Enforce subscription-only endpoint
    if (dataProduct.pricingMode !== "SUBSCRIPTION") {
      res
        .status(400)
        .json({ message: "This endpoint is for subscription products only" });
      return;
    }

    // Check existing subscription using relation
    if (user.subscriptions.some((sub) => sub.id === productId)) {
      res.status(409).json({ message: "Already subscribed" });
      return;
    }

    // Validate pricing structure
    if (!dataProduct.price || !dataProduct.paymentInterval) {
      res.status(400).json({
        message: "Subscription product requires price and payment interval",
      });
      return;
    }

    const paymentInterval = dataProduct.paymentInterval!;
    const price = dataProduct.price!;

    await prisma.$transaction(async (tx) => {
      const userBalance = user.balances.find(
        (b) => b.currency === dataProduct.currency
      );
      if (!userBalance || userBalance.amount < price) {
        throw new Error("Insufficient balance");
      }

      const newSubscription = await tx.subscription.create({
        data: {
          interval: paymentInterval,
          startTime: new Date(),
          accessEndTime: calculateEndTime(new Date(), paymentInterval),
          cancelledTime: null,
          amount: price,
          currency: dataProduct.currency || "GBP",
          dataProductId: productId,
          userId: user.id,
        },
      });

      //Create charge
      await tx.charge.create({
        data: {
          amount: price,
          currency: dataProduct.currency || "GBP",
          time: new Date(),
          subscriptionId: newSubscription.id,
        },
      });

      // Deduct the amount from user's balance
      await tx.balance.update({
        where: { id: userBalance.id },
        data: { amount: userBalance.amount - price },
      });

      await tx.user.update({
        where: { id: userId },
        data: { subscriptions: { connect: { id: productId } } },
      });
    });

    await addUserToProductACL(userId, productId);

    res.status(200).json({ message: "User subscribed successfully" });
  } catch (error) {
    console.error("Subscription error:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Subscription failed",
    });
  }
};

export const unsubscribeUserFromDataProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user || req.user.role !== UserRole.DATA_BUYER) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const userId = req.user.id;
    const { productId } = req.body;

    // Validate productId format
    if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
      res.status(400).json({ message: "Invalid product ID format" });
      return;
    }

    // Use transaction for atomic operations
    const [user, dataProduct] = await prisma.$transaction([
      prisma.user.findUnique({
        where: { id: userId },
        include: { subscriptions: { select: { id: true } } },
      }),
      prisma.dataProduct.findUnique({
        where: { id: productId },
      }),
    ]);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (!dataProduct) {
      res.status(404).json({ message: "Data product not found" });
      return;
    }

    // Enforce subscription-only endpoint
    if (dataProduct.pricingMode !== "SUBSCRIPTION") {
      res
        .status(400)
        .json({ message: "This endpoint is for subscription products only" });
      return;
    }

    // Check existing subscription using relation
    if (!user.subscriptions.some((sub) => sub.id === productId)) {
      res.status(409).json({ message: "Not subscribed to product" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: { userId, dataProductId: productId, cancelledTime: null },
        data: { cancelledTime: new Date() },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          subscriptions: { disconnect: { id: productId } },
        },
      });
    });

    res.status(200).json({ message: "User unsubscribed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};

export const getUserDetails = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    let userDetails: any = {
      role: UserRole.GUEST,
    };
    if (req.user && req.user.role !== UserRole.GUEST) {
      const userId = req.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscriptions: true, balances: true }, // Include subscriptions in the user object
      });

      if (user) {
        userDetails = null;
        userDetails = {
          userName: user.userName,
          email: user.email,
          role: user.role,
          balances: user.balances,
          subscriptions: user.subscriptions.map((sub: Subscription) => sub.id),
        };
      }
    }

    res.status(200).json(userDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};

export const getDashboardDataForUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Base data structure with safe defaults
    const baseData = {
      dataProducts: [] as DataProductWithOrganization[],
      organizations: [] as Organisation[],
      keyAuth: null as KeyAuth | null,
    };

    // Initial fetch for all users
    const [initialDataProducts, initialOrganizations] = await Promise.all([
      prisma.dataProduct.findMany({
        where: { status: DataProductStatus.LIVE },
        select: {
          id: true,
          name: true,
          accessURL: true,
          description: true,
          price: true,
          pricingMode: true,
          currency: true,
          paymentInterval: true,
          organisationID: true,
          organisation: {
            select: { id: true, name: true, logoUrl: true, shortName: true },
          },
          Subscriptions: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
      }),
      prisma.organisation.findMany({
        select: { id: true, logoUrl: true, name: true },
      }),
    ]);

    baseData.dataProducts = initialDataProducts;
    baseData.organizations = initialOrganizations;

    if (req.user && req.user.role !== UserRole.GUEST) {
      const userId = req.user.id;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Get user API key with graceful failure
      try {
        const consumer = await getConsumerById(userId);
        baseData.keyAuth = await getUserAPIKeyFromKong(consumer.id);
      } catch (error) {
        console.error("Failed to fetch user API key from Kong:", error);
        baseData.keyAuth = null;
      }

      if (user.role === "ADMIN") {
        try {
          // Get all data products for admin
          const adminDataProducts = await prisma.dataProduct.findMany({
            select: {
              id: true,
              name: true,
              description: true,
              accessURL: true,
              kongServiceID: true,
              price: true,
              pricingMode: true,
              currency: true,
              paymentInterval: true,
              organisationID: true,
              organisation: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
                  shortName: true,
                },
              },
            },
          });

          // Enrich with Kong details (graceful per-product failure)
          const productsWithKong = await Promise.all(
            adminDataProducts.map(async (product) => ({
              ...product,
              kongDetails: product.kongServiceID
                ? await getAdminDataProductDetailsFromKong(
                    product.kongServiceID
                  ).catch((error) => {
                    console.error(
                      `Failed to fetch Kong details for product ${product.id}:`,
                      error
                    );
                    return null;
                  })
                : null,
            }))
          );

          baseData.dataProducts = productsWithKong;
        } catch (error) {
          console.error("Failed to fetch admin data products:", error);
          // Maintain existing LIVE products rather than failing completely
        }
      }
    }

    res.status(200).json(baseData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

export const rotateAPIKeyForUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<KeyAuth | undefined> => {
  if (!req.user || req.user.role !== UserRole.DATA_BUYER) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const userId = req.user.id;
    const { ttl = 60 * 60 * 24 * 30 }: { ttl?: number } = req.body;

    const response = await rotateUserAPIKey(userId, ttl);

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};

export const deleteAPIKeyForUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user || req.user.role !== UserRole.DATA_BUYER) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const userId = req.user.id;
    const { keyId } = req.body;

    await deleteUserAPIKeyInKong(userId, keyId);

    res.status(200).json({ message: "API key deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};

export const getAPIKeysByUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user || req.user.role !== UserRole.DATA_BUYER) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const userId = req.user.id;

    const consumer = await getConsumerById(userId);
    const response = await getUserAPIKeyFromKong(consumer.id);

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};

// New controllers for DIY Accounts copied from Portcode API

const sendVerificationCode = async (email: string, code: string) => {
  if (!process.env.SENDGRID_API_KEY) {
    return { err: "Sendgrid API key not found." };
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: email.toLowerCase(),
    from: "no-reply@emmadata.org", // Change to your verified sender
    subject: "Emma Data Verification Code",
    text: "Verification code",
    html: `<h1>${code}</h1>`,
  };
  try {
    await sgMail.send(msg);
  } catch (err) {
    return { err };
  }
};

const sendPasswordReset = async (email: string, token: string) => {
  if (!process.env.SENDGRID_API_KEY) {
    return { err: "Sendgrid API key not found." };
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const resetLink = `${process.env.NEXT_PUBLIC_URL}/reset-password?token=${token}`;
  const msg = {
    to: email.toLowerCase(),
    from: "no-reply@emmadata.org", // Change to your verified sender
    subject: "Emma Data Password Reset",
    text: `Please use the following link to reset your password: ${resetLink}`,
    html: `<p>Please use the following link to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
  };
  try {
    await sgMail.send(msg);
  } catch (err) {
    return { err };
  }
};

const signToken = (id: string, jwt_secret: string) =>
  jwt.sign({ id }, jwt_secret, {
    algorithm: "HS256",
    allowInsecureKeySizes: true,
    expiresIn: 60 * 60 * 24, // 24 hours
  });

export const signup = async (req: Request, res: Response) => {
  try {
    if (!req.body.userName || !req.body.email || !req.body.password) {
      res.status(400).send({ message: "Missing required fields." });
      return;
    }
    if (req.body.password.length < 12) {
      return res
        .status(400)
        .send({ message: "Password must be at least 8 characters." });
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    //Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: req.body.email.toLowerCase() },
      include: { verification: true },
    });
    if (!existingUser) {
      const tempCode = String(Math.floor(100000 + Math.random() * 900000));
      const sendTime = new Date().getTime();
      const expiryTime = new Date().getTime() + 1000 * 60 * 30; // 30 minutes in ms
      const newUser = await prisma.user.create({
        data: {
          userName: req.body.userName,
          email: req.body.email.toLowerCase(),
          password: hashedPassword,
          role: UserRole.DATA_BUYER,
          subscriptions: {
            connect: [],
          },
          verification: {
            create: {
              code: tempCode,
              expiry: new Date(expiryTime),
              sentTime: new Date(sendTime),
            },
          },
          emailVerified: false,
        },
      });
      await createKongConsumer(newUser.id);
      const response = await sendVerificationCode(
        req.body.email.toLowerCase(),
        tempCode
      );
      if (response && response.err) {
        res.status(500).send({ message: response.err });
      } else {
        res.status(200).send({ message: "Verification code sent!" });
        return;
      }
    }
    if (existingUser?.emailVerified) {
      res.status(401).send({ message: "Email is already in use." });
      return;
    }
    if (existingUser?.verification) {
      const now = new Date().getTime();
      const expiryTime = existingUser.verification.expiry.getTime();
      const sentTime = existingUser.verification.sentTime.getTime();

      if (sentTime > now - 60000) {
        res.status(425).send({
          message:
            "Please wait a minute before requesting another verification code.",
        });
        return;
      }

      // User exists and code hasn't expired
      if (expiryTime > now) {
        // Send new code & Update user
        const response = await sendVerificationCode(
          req.body.email.toLowerCase(),
          existingUser.verification.code
        );
        if (response && response.err) {
          res.status(500).send({ message: response.err });
        } else {
          res.status(200).send({ message: "New code sent!" });
        }
        return;
      } else {
        // Code has expired, delete the old verification
        await prisma.verification.delete({
          where: { id: existingUser.verification.id },
        });
      }
    }
    if (existingUser) {
      const tempCode = String(Math.floor(100000 + Math.random() * 900000));
      const sendTime = new Date().getTime();
      const expiryTime = new Date().getTime() + 1000 * 60 * 30; // 30 minutes in ms
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          verification: {
            create: {
              code: tempCode,
              expiry: new Date(expiryTime),
              sentTime: new Date(sendTime),
            },
          },
        },
      });
      const response = await sendVerificationCode(
        req.body.email.toLowerCase(),
        tempCode
      );
      if (response && response.err) {
        res.status(500).send({ message: response.err });
      } else {
        res.status(200).send({ message: "Verification code sent!" });
        return;
      }
    }
  } catch (err) {
    res.status(500).send({ message: err });
    return;
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    if (!req.body.email || !req.body.password) {
      res.status(400).send({ message: "Missing required fields." });
      return;
    }
    //Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: req.body.email.toLowerCase() },
      include: { verification: true },
    });

    if (!existingUser) {
      res.status(401).send({ message: "Email not found." });
      return;
    }

    const passwordValid = await bcrypt.compare(
      req.body.password,
      existingUser.password
    );

    if (!passwordValid) {
      return res.status(401).send({ message: "Invalid credentials." });
    }

    //Send time is less than a minute ago
    if (
      existingUser.verification &&
      existingUser.verification.sentTime.getTime() >
        new Date().getTime() - 1000 * 60
    ) {
      res.status(425).send({
        message:
          "Please wait a minute before requesting another verification code.",
      });
      return;
    }

    //Send new code
    const tempCode = String(Math.floor(100000 + Math.random() * 900000));
    const sendTime = new Date().getTime();
    const expiryTime = new Date().getTime() + 1000 * 60 * 30; // 30 minutes in ms

    await sendVerificationCode(req.body.email.toLowerCase(), tempCode);

    const existingVerification = await prisma.verification.findUnique({
      where: { userId: existingUser.id },
    });

    // If the verification record exists, delete it
    if (existingVerification) {
      await prisma.verification.delete({
        where: { userId: existingUser.id },
      });
    }

    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        verification: {
          create: {
            code: tempCode,
            expiry: new Date(expiryTime),
            sentTime: new Date(sendTime),
          },
        },
      },
    });

    res.status(200).send({ message: "Verification code sent!" });
    return;
  } catch (err) {
    res.status(500).send({ message: err });
    return;
  }
};

export const sendPasswordResetEmail = async (req: Request, res: Response) => {
  try {
    if (!req.body.email) {
      res.status(400).send({ message: "Missing required fields." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: req.body.email.toLowerCase() },
    });

    if (!user) {
      return res.status(200).send({
        message: "If an account exists, you'll receive a reset email.",
      });
    }

    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    await prisma.passwordReset.upsert({
      where: { userId: user.id },
      update: { token: resetToken, expiresAt },
      create: {
        token: resetToken,
        expiresAt,
        user: { connect: { id: user.id } },
      },
    });

    await sendPasswordReset(req.body.email.toLowerCase(), resetToken);

    return res.status(200).send({
      message: "If an account exists, you'll receive a reset email.",
    });
  } catch (err) {
    res.status(500).send({ message: err });
    return;
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    if (!req.body.email || !req.body.password || !req.body.resetToken) {
      res.status(400).send({ message: "Missing required fields." });
      return;
    }
    if (req.body.password.length < 12) {
      return res
        .status(400)
        .send({ message: "Password must be at least 8 characters." });
    }

    //Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: req.body.email.toLowerCase() },
      include: { verification: true, passwordReset: true },
    });

    if (!existingUser) {
      res.status(401).send({ message: "Email not found." });
      return;
    }

    if (
      !existingUser.passwordReset ||
      existingUser.passwordReset.expiresAt.getTime() < new Date().getTime() ||
      existingUser.passwordReset.token !== req.body.resetToken
    ) {
      res.status(401).send({ message: "Unauthorised" });
      return;
    }

    //Send time is less than a minute ago
    if (
      existingUser.verification &&
      existingUser.verification.sentTime.getTime() >
        new Date().getTime() - 1000 * 60
    ) {
      res.status(425).send({
        message:
          "Please wait a minute before requesting another verification code.",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const tempCode = String(Math.floor(100000 + Math.random() * 900000));
    const sendTime = new Date().getTime();
    const expiryTime = new Date().getTime() + 1000 * 60 * 30; // 30 minutes in ms

    await sendVerificationCode(req.body.email.toLowerCase(), tempCode);

    const existingVerification = await prisma.verification.findUnique({
      where: { userId: existingUser.id },
    });

    // If the verification record exists, delete it
    if (existingVerification) {
      await prisma.verification.delete({
        where: { userId: existingUser.id },
      });
    }

    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        password: hashedPassword,
        verification: {
          create: {
            code: tempCode,
            expiry: new Date(expiryTime),
            sentTime: new Date(sendTime),
          },
        },
      },
    });
    return res.status(200).send({
      message: "Password reset successfully. Verification code sent!",
    });
  } catch (err) {
    res.status(500).send({ message: err });
    return;
  }
};

export const verifyAccount = async (req: Request, res: Response) => {
  try {
    // If code or email missing in body
    if (!req.body.email || !req.body.code) {
      res.status(400).send({ message: "Missing required fields." });
      return;
    }
    //Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: req.body.email.toLowerCase() },
      include: { verification: true },
    });
    //If no existing user
    if (!existingUser) {
      res.status(401).send({ message: "Account not found." });
      return;
    }
    //If no verification
    if (!existingUser.verification) {
      res.status(401).send({ message: "No verification code found." });
      return;
    }
    //If incorrect code
    if (existingUser.verification.code !== req.body.code) {
      res.status(401).send({ message: "Incorrect verification code." });
      return;
    }
    if (existingUser.verification.expiry.getTime() < new Date().getTime()) {
      res.status(401).send({
        message: "Verification code expired. Please request a new one.",
      });
      return;
    }
    if (!existingUser.emailVerified) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          emailVerified: true,
        },
      });
    }
    await addUserToFreeProducts(existingUser.id);
    if (!process.env.JWT_SECRET) {
      res.status(500).send({ message: "JWT secret not found." });
      return;
    }
    const token = signToken(existingUser.id, process.env.JWT_SECRET);
    res.status(200).send({
      message: "User was registered successfully!",
      id: existingUser.id,
      username: existingUser.email,
      displayname: existingUser.userName,
      email: existingUser.email,
      accessToken: token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err });
    return;
  }
};
