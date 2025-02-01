import { Response } from "express";
import axios from "axios";
import dotenv from "dotenv";

import { prisma } from "..";
import { AuthenticatedRequest, DataProductWithKong, KongDataProductDetails, Organisation } from "../utils/types";
import { DataProductStatus, Prisma } from "@prisma/client";

dotenv.config();

const KONG_HEADERS = {
  "Content-Type": "application/json",
  apikey: process.env.KONG_API_KEY as string,
};

export const getDashboardDataForUser = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req;
    if (userId) {
      // Get user with prisma where object id is mongoId
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        res.status(404).send({ message: "User not found" });
        return;
      }

      let keyAuth;
      try {
        keyAuth = await getUserAPIKeyFromKong(userId);
      } catch (error) {
        // Handle case where no key exists
        keyAuth = null;
      }

      // Base response with API key

      const response: {
        keyAuth: KeyAuth | null;
        dataProductsTableData?: DataProductWithKong[];
        organisationsData?: Organisation[];
      } = {
        keyAuth: keyAuth
          ? { id: keyAuth.id, key: keyAuth.key, ttl: keyAuth.ttl }
          : null,
      };

      if (user?.role === "ADMIN") {
        const [dataProducts, organisations] = await Promise.all([
          prisma.dataProduct.findMany({
            select: {
              id: true,
              name: true,
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
              users: { select: { id: true } },
            },
          }),
          prisma.organisation.findMany({
            select: { id: true, logoUrl: true, name: true },
          }),
        ]);

        const productsWithKong = await Promise.all(
          dataProducts.map(async (product) => ({
            ...product,
            kongDetails: product.kongServiceID
              ? await getAdminDataProductDetailsFromKong(product.kongServiceID)
              : null,
          })),
        );

        response.dataProductsTableData = productsWithKong;
        response.organisationsData = organisations;
      }

      res.status(200).json(response);
    } else {
      const [dataProducts, organisations] = await Promise.all([
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
          },
        }),
        prisma.organisation.findMany({
          select: { id: true, logoUrl: true, name: true },
        }),
      ]);

      res.status(200).json({
        dataProductsTableData: dataProducts,
        organisationsData: organisations,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

const getAdminDataProductDetailsFromKong = async (
  serviceId: string,
): Promise<KongDataProductDetails> => {
  const result: KongDataProductDetails = {
    serviceResponseBody: null,
    routeResponseBody: null,
  };

  try {
    const serviceResponse = await axios.get(
      `${process.env.KONG_ADMIN_URL}/services/${serviceId}`,
      {
        headers: KONG_HEADERS,
      },
    );
    result.serviceResponseBody = serviceResponse.data;

    const routesResponse = await axios.get(
      `${process.env.KONG_ADMIN_URL}/services/${serviceId}/routes`,
      {
        headers: KONG_HEADERS,
      },
    );
    result.routeResponseBody = routesResponse.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.warn(`Kong API error for service ${serviceId}:`, error.message);
      if (!error.response?.status || error.response.status >= 500) {
        throw new Error("Kong API unavailable");
      }
    } else {
      console.error("Unexpected Kong error:", error);
      throw new Error("Failed to fetch Kong details");
    }
  }

  return result;
};

interface KongConsumer {
  id: string;
  [key: string]: any;
}

interface KongConsumerResponse {
  data: KongConsumer[];
}

interface KeyAuth {
  id: string;
  key: string;
  ttl: number;
}

interface KeyAuthResponse {
  data: KeyAuth[];
}

const getUserAPIKeyFromKong = async (userId: string): Promise<KeyAuth> => {
  const { KONG_ADMIN_URL, KONG_API_KEY } = process.env;

  // Validate environment variables
  if (!KONG_ADMIN_URL || !KONG_API_KEY) {
    throw new Error(
      "KONG_ADMIN_URL and KONG_API_KEY must be set in environment variables",
    );
  }

  try {
    // Get Kong consumer information
    const consumerResponse = await axios.get<KongConsumerResponse>(
      `${KONG_ADMIN_URL}/consumers?custom_id=${userId}`,
      {
        headers: { apikey: KONG_API_KEY },
      },
    );

    const consumers = consumerResponse.data.data;

    // Validate consumer exists
    if (!consumers || consumers.length === 0) {
      throw new Error(`No Kong consumer found for user ID: ${userId}`);
    }

    // Ensure unique consumer
    if (consumers.length > 1) {
      throw new Error(`Multiple consumers found for user ID: ${userId}`);
    }

    const kongId = consumers[0].id;

    // Get API keys for consumer
    const keyAuthResponse = await axios.get<KeyAuthResponse>(
      `${KONG_ADMIN_URL}/consumers/${kongId}/key-auth`,
      {
        headers: { apikey: KONG_API_KEY },
      },
    );

    return keyAuthResponse.data.data[0];
  } catch (error) {
    // Enhanced error handling with original error message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to retrieve API key: ${errorMessage}`);
  }
};
