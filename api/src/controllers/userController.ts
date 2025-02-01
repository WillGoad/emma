import { Response } from "express";
import sgMail from "@sendgrid/mail";
import jwt from "jsonwebtoken";
import { prisma } from "..";
import { AuthenticatedRequest } from "../utils/types";
import axios from "axios";
import dotenv from "dotenv";
import { DataProduct, UserRole } from "@prisma/client";

dotenv.config();

export const subscribeUserToDataProduct = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  if (req.userId === undefined) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const userId = req.userId; // Extract user.sub from validated JWT
    const { productId } = req.body; // Extract product data from request body
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { charges: true, subscriptions: true }, // Include charges in the user object
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if the productId is already in the subscriptions array
    if (
      user.subscriptions
        .map((subscription: DataProduct) => subscription.id)
        .includes(productId)
    ) {
      res.status(200).json({ message: "User already subscribed", user });
      return;
    }

    // Fetch the data product to get the monthlyAmount
    const dataProduct = await prisma.dataProduct.findUnique({
      where: { id: productId },
    });

    if (!dataProduct) {
      res.status(404).json({ message: "Data product not found" });
      return;
    }

    // If the data product has a monthly amount, add a new charge
    if (dataProduct.pricingMode !== "FREE" && dataProduct.price) {
      const newCharge = await prisma.charge.create({
        data: {
          dataProductId: productId,
          originalChargeDate: new Date(),
          lastChargeDate: new Date(),
          chargeAmount: dataProduct.price,
          userId: user.id,
        },
      });

      // Add the new charge to the user's charges array
      user.charges.push(newCharge);
    }

    // Add user to DataProduct's userIDs array
    await prisma.dataProduct.update({
      where: { id: productId },
      data: {
        userIDs: {
          push: userId, // Add userId to the userIDs array
        },
      },
    });

    // Update the user's subscriptions
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        dataProductIDs: {
          push: productId, // Add the product ID to the array
        },
        subscriptions: {
          connect: { id: productId }, // Connect the subscription relation
        },
      },
      include: { charges: true, subscriptions: true }, // Include charges in the updated user object
    });

    // Get the user's Kong id using it's custom_id which is set to it's userId

    const kongAdminUrlGetConsumer = `${process.env.KONG_ADMIN_URL}/consumers?custom_id=${userId}`; // Replace with your Kong Admin API URL
    const responseGetConsumer = await axios.get(kongAdminUrlGetConsumer, {
      headers: {
        apikey: process.env.KONG_API_KEY,
      },
    });

    const kongId = responseGetConsumer.data.data[0].id;

    if (!kongId) {
      throw new Error("Kong id not found");
    }

    // Add User to ACL for this data product's route

    const kongAdminUrl = `${process.env.KONG_ADMIN_URL}/consumers/${kongId}/acls`;
    await axios.post(
      kongAdminUrl,
      {
        group: `data_product_${productId}_group`,
      },
      {
        headers: {
          apikey: process.env.KONG_API_KEY,
        },
      },
    );

    res
      .status(200)
      .json({ message: "User subscribed successfully", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};

export const unsubscribeUserFromDataProduct = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  if (req.userId === undefined) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const userId = req.userId; // Extract user.sub from validated JWT
    const { productId } = req.body; // Extract product data from request body

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { charges: true, subscriptions: true }, // Include charges in the user object
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if the productId is in the subscriptions array
    if (
      !user.subscriptions
        .map((subscription: DataProduct) => subscription.id)
        .includes(productId)
    ) {
      res
        .status(400)
        .json({ message: "User is not subscribed to this product" });
      return;
    }

    // Remove relevant charges related to the productId
    await prisma.charge.deleteMany({
      where: {
        userId: user.id,
        dataProductId: productId,
      },
    });

    // Fetch the data product to get the userIDs
    const dataProduct = await prisma.dataProduct.findUnique({
      where: { id: productId },
    });

    if (!dataProduct) {
      res.status(404).json({ message: "Data product not found" });
      return;
    }

    // Filter out the productId from dataProductIDs
    const updatedDataProductIDs = user.dataProductIDs.filter(
      (id: string) => id !== productId,
    );

    // Remove user from DataProduct's userIDs array
    await prisma.dataProduct.update({
      where: { id: productId },
      data: {
        userIDs: {
          set: dataProduct.userIDs.filter((id: string) => id !== userId), // Remove the userId from the array
        },
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        dataProductIDs: updatedDataProductIDs, // Update the raw dataProductIDs array
        subscriptions: {
          disconnect: { id: productId }, // Disconnect the subscription relation
        },
      },
      include: { charges: true }, // Include charges in the updated user object
    });

    // Get the user's Kong id using it's custom_id which is set to it's userId

    const kongAdminUrlGetConsumer = `${process.env.KONG_ADMIN_URL}/consumers?custom_id=${userId}`; // Replace with your Kong Admin API URL
    const responseGetConsumer = await axios.get(kongAdminUrlGetConsumer, {
      headers: {
        apikey: process.env.KONG_API_KEY,
      },
    });

    const kongId = responseGetConsumer.data.data[0].id;

    if (!kongId) {
      throw new Error("Kong id not found");
    }

    // Remove user from ACL for this data product's route

    const kongAdminUrl = `${process.env.KONG_ADMIN_URL}/consumers/${kongId}/acls/data_product_${productId}_group`; // Replace with your Kong Admin API URL
    await axios.delete(kongAdminUrl, {
      headers: {
        apikey: process.env.KONG_API_KEY,
      },
    });

    res
      .status(200)
      .json({ message: "User unsubscribed successfully", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};

export const getUserDetails = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  if (req.userId === undefined) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const userId = req.userId; // Extract user.sub from validated JWT

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscriptions: true }, // Include subscriptions in the user object
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    let userDetails;

    userDetails = {
      userName: user.userName,
      email: user.email,
      role: user.role,
      subscriptions: user.subscriptions.map((sub: DataProduct) => sub.id),
    };

    res.status(200).json(userDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};

export const createAPIKeyForUser = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  if (req.userId === undefined) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const userId = req.userId;
    const { ttl = 60 * 60 * 24 * 30 } = req.body;

    const kongAdminUrlGetConsumer = `${process.env.KONG_ADMIN_URL}/consumers?custom_id=${userId}`; // Replace with your Kong Admin API URL
    const responseGetConsumer = await axios.get(kongAdminUrlGetConsumer, {
      headers: {
        apikey: process.env.KONG_API_KEY,
      },
    });

    const kongId = responseGetConsumer.data.data[0].id;

    if (!kongId) {
      throw new Error("Kong id not found");
    }

    const kongAdminUrlGetKeys = `${process.env.KONG_ADMIN_URL}/consumers/${kongId}/key-auth`;
    const responseGetKeys = await axios.get(kongAdminUrlGetKeys, {
      headers: {
        apikey: process.env.KONG_API_KEY,
      },
    });

    if (responseGetKeys.data.data.length > 0) {
      res.status(400).json({ message: "User already has an API key" });
      return;
    }

    const kongAdminUrl = `${process.env.KONG_ADMIN_URL}/consumers/${kongId}/key-auth`;
    const response = await axios.post(
      kongAdminUrl,
      {
        ttl,
      },
      {
        headers: {
          apikey: process.env.KONG_API_KEY,
        },
      },
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};

export const deleteAPIKeyForUser = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  if (req.userId === undefined) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const userId = req.userId;
    const { keyId } = req.body;

    const kongAdminUrlGetConsumer = `${process.env.KONG_ADMIN_URL}/consumers?custom_id=${userId}`; // Replace with your Kong Admin API URL
    const responseGetConsumer = await axios.get(kongAdminUrlGetConsumer, {
      headers: {
        apikey: process.env.KONG_API_KEY,
      },
    });

    const kongId = responseGetConsumer.data.data[0].id;

    if (!kongId) {
      throw new Error("Kong id not found");
    }

    const kongAdminUrl = `${process.env.KONG_ADMIN_URL}/consumers/${kongId}/key-auth/${keyId}`;
    const response = await axios.delete(kongAdminUrl, {
      headers: {
        apikey: process.env.KONG_API_KEY,
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
    return;
  }
};

export const getAPIKeysByUser = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  if (req.userId === undefined) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const userId = req.userId;

    const kongAdminUrlGetConsumer = `${process.env.KONG_ADMIN_URL}/consumers?custom_id=${userId}`; // Replace with your Kong Admin API URL
    const responseGetConsumer = await axios.get(kongAdminUrlGetConsumer, {
      headers: {
        apikey: process.env.KONG_API_KEY,
      },
    });

    const kongId = responseGetConsumer.data.data[0].id;

    if (!kongId) {
      throw new Error("Kong id not found");
    }

    const kongAdminUrl = `${process.env.KONG_ADMIN_URL}/consumers/${kongId}/key-auth`;
    const response = await axios.get(kongAdminUrl, {
      headers: {
        apikey: process.env.KONG_API_KEY,
      },
    });

    res.status(200).json(response.data);
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

const signToken = (id: string, jwt_secret: string) =>
  jwt.sign({ id }, jwt_secret, {
    algorithm: "HS256",
    allowInsecureKeySizes: true,
    expiresIn: 60 * 60 * 24, // 24 hours
  });

export const signup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.body.userName || !req.body.email) {
      res.status(400).send({ message: "Missing required fields." });
      return;
    }
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
          role: UserRole.DATA_BUYER,
          subscriptions: {
            connect: [],
          },
          charges: {
            create: [], // Initialize with an empty array of charges
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
      const kongAdminUrl = `${process.env.KONG_ADMIN_URL}/consumers`; // Replace with your Kong Admin API URL
      await axios.post(
        kongAdminUrl,
        {
          username: newUser.email.toLowerCase(),
          custom_id: newUser.id,
        },
        {
          headers: {
            apikey: process.env.KONG_API_KEY,
          },
        },
      );
      const response = await sendVerificationCode(
        req.body.email.toLowerCase(),
        tempCode,
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
        res
          .status(425)
          .send({
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
          existingUser.verification.code,
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
        tempCode,
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

export const login = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.body.email) {
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

    //Send time is less than a minute ago
    if (
      existingUser.verification &&
      existingUser.verification.sentTime.getTime() >
        new Date().getTime() - 1000 * 60
    ) {
      res
        .status(425)
        .send({
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

export const verifyAccount = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
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
      res
        .status(401)
        .send({
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
