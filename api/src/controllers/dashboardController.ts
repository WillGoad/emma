import { Response } from "express";
import "dotenv/config";

import { prisma } from "..";
import {
  AuthenticatedRequest,
  DataProductWithOrganization,
  KeyAuth,
  Organisation,
} from "../utils/types";
import { DataProductStatus } from "@prisma/client";
import {
  getAdminDataProductDetailsFromKong,
  getConsumerById,
  getUserAPIKeyFromKong,
} from "../utils/kong";

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
