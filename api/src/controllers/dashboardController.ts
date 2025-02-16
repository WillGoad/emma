import { Response } from "express";
import axios from "axios";
import dotenv from "dotenv";

import { prisma } from "..";
import {
  AuthenticatedRequest,
  DataProductWithOrganization,
  KongDataProductDetails,
  Organisation,
} from "../utils/types";
import { DataProductStatus } from "@prisma/client";

dotenv.config();

const KONG_HEADERS = {
  "Content-Type": "application/json",
  apikey: process.env.KONG_API_KEY as string,
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

    const { userId } = req;
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Get user API key with graceful failure
      try {
        baseData.keyAuth = await getUserAPIKeyFromKong(userId);
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

const getAdminDataProductDetailsFromKong = async (
  serviceId: string
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
      }
    );
    result.serviceResponseBody = serviceResponse.data;

    const routesResponse = await axios.get(
      `${process.env.KONG_ADMIN_URL}/services/${serviceId}/routes`,
      {
        headers: KONG_HEADERS,
      }
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
      "KONG_ADMIN_URL and KONG_API_KEY must be set in environment variables"
    );
  }

  try {
    // Get Kong consumer information
    const consumerResponse = await axios.get<KongConsumerResponse>(
      `${KONG_ADMIN_URL}/consumers?custom_id=${userId}`,
      {
        headers: { apikey: KONG_API_KEY },
      }
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
      }
    );

    return keyAuthResponse.data.data[0];
  } catch (error) {
    // Enhanced error handling with original error message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to retrieve API key: ${errorMessage}`);
  }
};
