import { Request, Response } from "express";
import { prisma } from "..";
import "dotenv/config";
import {
  AuthenticatedRequest,
  DataProductWithOrganization,
  MappedDataProduct,
  PrivateDataProductWithOrganization,
} from "../utils/types";
import {
  DataProductStatus,
  PriceStructureMode,
  UserRole,
} from "@prisma/client";
import {
  addAllUsersToProductACL,
  addServiceAclPlugin,
  addSomeUsersToProductACL,
  manageKongService,
  upsertKongService,
} from "../utils/kong";
import { isValidCurrency } from "../utils/validation";

export const getDataProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Parse and validate count parameter
    const count = Math.min(Math.max(Number(req.query.count) || 1, 1), 48);

    // Fetch data products with organization in a single query
    const dataProducts = await prisma.dataProduct.findMany({
      where: {
        status: DataProductStatus.LIVE,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        organisationID: true,
        organisation: {
          select: {
            name: true,
            logoUrl: true,
          },
        },
      },
      take: count,
    });

    // Map to response format
    const mappedDataProducts: MappedDataProduct[] = dataProducts.map(
      (product: DataProductWithOrganization) => ({
        objectID: product.id,
        dataproduct: product.name,
        description: product.description,
        price: product.price ?? 0,
        organisation: product.organisation.name || "",
        organisationLogoUrl: product.organisation.logoUrl || "",
        organisationID: product.organisationID,
      })
    );
    res.status(200).json(mappedDataProducts);
  } catch (error) {
    console.error("Error fetching data products:", error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createDataProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Authorization check
    if (req.user.role !== UserRole.ADMIN) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Input validation
    const requiredFields = [
      "name",
      "description",
      "status",
      "organisationID",
      "accessURL",
      "upstreamURL",
      "pricingMode",
    ];

    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
      res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
      return;
    }

    const {
      name,
      description,
      status,
      organisationID,
      accessURL,
      upstreamURL,
      pricingMode,
      price: priceString,
      currency,
      paymentInterval,
    } = req.body;

    // Validate enum values
    if (!Object.values(DataProductStatus).includes(status)) {
      res.status(400).json({ message: "Invalid status value" });
      return;
    }

    if (!Object.values(PriceStructureMode).includes(pricingMode)) {
      res.status(400).json({ message: "Invalid pricing mode" });
      return;
    }

    // Convert price to number
    const price = parseFloat(priceString);

    // Validate pricing structure
    if (pricingMode !== PriceStructureMode.FREE) {
      if (isNaN(price) || price <= 0) {
        res.status(400).json({ message: "Invalid price value" });
        return;
      }
      if (!currency || !isValidCurrency(currency)) {
        // Add currency validation
        res.status(400).json({ message: "Invalid currency" });
        return;
      }
    }

    if (pricingMode === PriceStructureMode.SUBSCRIPTION && !paymentInterval) {
      res
        .status(400)
        .json({ message: "Payment interval required for subscriptions" });
      return;
    }

    // Validate organization exists
    const organizationExists = await prisma.organisation.findUnique({
      where: { id: organisationID },
      select: { id: true },
    });

    if (!organizationExists) {
      res.status(400).json({ message: "Organization not found" });
      return;
    }

    const newProduct = await prisma.dataProduct.create({
      data: {
        name,
        description,
        status: status as DataProductStatus,
        accessURL,
        upstreamURL,
        organisationID,
        pricingMode,
        ...(pricingMode !== PriceStructureMode.FREE && {
          price,
          currency: currency.toUpperCase(),
        }),
        ...(pricingMode === PriceStructureMode.SUBSCRIPTION && {
          paymentInterval,
        }),
      },
      include: { organisation: true },
    });

    // Kong integration with error handling
    let kongServiceId: string | undefined;
    try {
      const { service } = await upsertKongService(newProduct);
      await addServiceAclPlugin(
        {
          name: "acl",
          config: { whitelist: [`data_product_${newProduct.id}_group`] },
        },
        service.id
      );
      kongServiceId = service.id;
    } catch (kongError) {
      if (kongServiceId) await manageKongService("DELETE", kongServiceId);
      await prisma.dataProduct.delete({
        where: { id: newProduct.id },
      });
      throw new Error("Failed to configure API gateway");
    }

    await addAllUsersToProductACL(newProduct.id);

    // Return the created data product as a JSON response
    res.status(201).json({ message: "Data product created successfully" });
  } catch (error) {
    console.error("Data product creation error:", error);
    const message = error instanceof Error ? error.message : "Creation failed";
    res.status(500).json({ message });
  }
};

export const updateDataProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (req.user.role !== UserRole.ADMIN) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Input validation
    const { id, ...updates } = req.body;

    if (!id) {
      res.status(400).json({ message: "Product ID is required" });
      return;
    }

    // Validate existing product
    const existingProduct = await prisma.dataProduct.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    // Validate enum values if provided
    if (
      updates.status &&
      !Object.values(DataProductStatus).includes(updates.status)
    ) {
      res.status(400).json({ message: "Invalid status value" });
      return;
    }

    if (
      updates.pricingMode &&
      !Object.values(PriceStructureMode).includes(updates.pricingMode)
    ) {
      res.status(400).json({ message: "Invalid pricing mode" });
      return;
    }

    // Validate organization if being updated
    if (updates.organisationID) {
      const organizationExists = await prisma.organisation.findUnique({
        where: { id: updates.organisationID },
        select: { id: true },
      });

      if (!organizationExists) {
        res.status(400).json({ message: "Organization not found" });
        return;
      }
    }

    // Handle pricing changes
    if (updates.pricingMode) {
      if (updates.pricingMode === PriceStructureMode.FREE) {
        updates.price = null;
        updates.currency = null;
        updates.paymentInterval = null;
      } else {
        // Validate pricing structure for non-free modes
        if (
          updates.pricingMode === PriceStructureMode.SUBSCRIPTION &&
          !updates.paymentInterval
        ) {
          res
            .status(400)
            .json({ message: "Payment interval required for subscriptions" });
          return;
        }

        if (updates.price) {
          const price = parseFloat(updates.price);
          if (isNaN(price) || price <= 0) {
            res.status(400).json({ message: "Invalid price value" });
            return;
          }
          updates.price = price;
        }

        if (updates.currency && !isValidCurrency(updates.currency)) {
          res.status(400).json({ message: "Invalid currency" });
          return;
        }
      }
    }

    // Update the data product
    let updatedProduct: PrivateDataProductWithOrganization;

    // Kong integration with error handling
    try {
      updatedProduct = await prisma.dataProduct.update({
        where: { id },
        data: updates,
        include: { organisation: true },
      });
      const { service } = await upsertKongService(updatedProduct);
      await addServiceAclPlugin(
        {
          name: "acl",
          config: { whitelist: [`data_product_${id}_group`] },
        },
        service.id
      );
    } catch (kongError) {
      // Revert the product update if Kong fails
      await prisma.dataProduct.update({
        where: { id },
        data: existingProduct,
      });

      throw new Error("Failed to update API gateway configuration");
    }

    await addAllUsersToProductACL(updatedProduct.id);

    res.status(200).json({
      message: "Data product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Data product update error:", error);
    const message = error instanceof Error ? error.message : "Update failed";
    const statusCode = message.includes("permission")
      ? 403
      : message.includes("not found")
        ? 404
        : 500;
    res.status(statusCode).json({ message });
  }
};

export const recreateKongServices = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (req.user.role !== UserRole.ADMIN) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    // Step 1: Delete all existing services except admin-api
    const allServices = await manageKongService("GET");
    const { KONG_ADMIN_API_SERVICE_ID } = process.env;

    if (!KONG_ADMIN_API_SERVICE_ID) {
      throw new Error("KONG_ADMIN_API_SERVICE_ID is not defined");
    }

    const nonAdminServiceIDs = allServices.data
      .filter((service: any) => service.id !== KONG_ADMIN_API_SERVICE_ID)
      .map((service: any) => service.id);

    for (let i = 0; i < nonAdminServiceIDs.length; i++) {
      await manageKongService("DELETE", nonAdminServiceIDs[i]);
    }

    // Step 2: Get all data products with organization info
    const dataProducts = await prisma.dataProduct.findMany({
      where: {
        status: {
          in: [DataProductStatus.LIVE, DataProductStatus.DRAFT],
          not: DataProductStatus.ARCHIVED,
        },
      },
      include: {
        organisation: {
          select: {
            name: true,
            logoUrl: true,
            shortName: true,
          },
        },
        Subscriptions: {
          select: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Step 3: Recreate services for each data product
    for (const product of dataProducts) {
      const { service } = await upsertKongService(product);

      if (product.pricingMode !== "FREE") {
        await addServiceAclPlugin(
          {
            name: "acl",
            config: { whitelist: [`data_product_${product.id}_group`] },
          },
          service.id
        );

        const subscriberIds = product.Subscriptions.map((sub) => sub.user.id);

        await addSomeUsersToProductACL(product.id, subscriberIds);
      }
    }

    res
      .status(200)
      .json({ success: true, message: "Kong services successfully recreated" });
  } catch (error: any) {
    throw new Error("Service recreation failed.");
  }
};
