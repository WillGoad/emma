import { Request, Response } from "express";
import { prisma } from "..";
import dotenv from "dotenv";
import { AuthenticatedRequest, DataProductWithOrganization, MappedDataProduct } from "../utils/types";
import { DataProductStatus } from "@prisma/client";
import axios from "axios";
import { replaceSpacesWithUnderscores } from "../utils/helpers";

dotenv.config();

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
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const createDataProduct = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  if (req.userId === undefined) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    //check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (currentUser?.role !== "ADMIN") {
      throw new Error("Lacks Permissions");
    }

    const {
      name,
      description,
      status,
      organisationID,
      accessURL,
      upstreamURL,
      pricingMode,
      price,
      currency,
      paymentInterval,
    } = req.body;

    if (!name) {
      throw new Error("Missing required field: name");
    }
    if (!description) {
      throw new Error("Missing required field: description");
    }
    if (!status) {
      throw new Error("Missing required field: status");
    }
    if (!organisationID) {
      throw new Error("Missing required field: organisationID");
    }
    if (!accessURL) {
      throw new Error("Missing required field: url");
    }
    if (!upstreamURL) {
      throw new Error("Missing required field: url");
    }
    if (!pricingMode) {
      throw new Error("Missing required field: pricingMode");
    }
    if (pricingMode !== "FREE") {
      if (price === undefined) {
        throw new Error("Missing required field: price");
      }
      if (!currency) {
        throw new Error("Missing required field: currency");
      }
    }
    if (pricingMode === "SUBSCRIPTION") {
      if (!paymentInterval) {
        throw new Error("Missing required field: paymentInterval");
      }
    }
    if (!Object.values(DataProductStatus).includes(status)) {
      throw new Error("Invalid status value");
    }

    // Create the data product in MongoDB
    const newProduct = await prisma.dataProduct.create({
      data: {
        name,
        description,
        status: DataProductStatus[status as keyof typeof DataProductStatus],
        accessURL,
        upstreamURL,
        organisationID,
        Charge: {
          create: [],
        },
        pricingMode,
        ...(pricingMode === "SUBSCRIPTION" && {
          priceStructureInterval: paymentInterval,
        }),
        ...(pricingMode !== "FREE" && { price, currency }),
      },
      include: {
        organisation: true,
      },
    });

    await insertKongService(newProduct);

    // Return the created data product as a JSON response
    res.status(201).json({ message: "Data product created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Server error` });
  }
};

export const updateDataProduct = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  if (req.userId === undefined) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    //check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (currentUser?.role !== "ADMIN") {
      throw new Error("Lacks Permissions");
    }

    const { id, ...updates } = req.body;

    // Validate input
    if (!id) {
      throw new Error("Product ID is required.");
    }

    const existingProduct = await prisma.dataProduct.findUnique({
      where: { id },
    });
    if (!existingProduct) {
      throw new Error("Product not found.");
    }

    // Handle pricingMode changes
    if (updates.pricingMode === "FREE") {
      delete updates.price;
      delete updates.currency;
      delete updates.paymentInterval;
    } else if (updates.pricingMode !== "SUBSCRIPTION") {
      delete updates.paymentInterval;
    }

    if (updates.price) {
      updates.price = Number(updates.price);
    }

    // Update the data product in MongoDB
    const updatedProduct = await prisma.dataProduct.update({
      where: { id },
      data: {
        ...updates,
      },
      include: {
        organisation: true,
      },
    });

    await upsertKongService(updatedProduct);

    res.status(201).json({ message: "Data product updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Server error` });
  }
};

const upsertKongService = async (updatedProduct: any) => {
  let kongServiceId = updatedProduct.kongServiceID;
  const kongServiceName = replaceSpacesWithUnderscores(
    `${updatedProduct.name}_${updatedProduct.organisation.shortName}`,
  );
  const isKongEnabled = updatedProduct.status === "LIVE";

  let kongService;

  if (kongServiceId) {
    // Check if Kong service exists
    kongService = await axios
      .get(`${process.env.KONG_ADMIN_URL}/services/${kongServiceId}`, {
        headers: { apikey: process.env.KONG_API_KEY as string },
      })
      .then((res) => res.data)
      .catch(() => null);
  }

  if (!kongService) {
    const newKongService = await axios.post(
      `${process.env.KONG_ADMIN_URL}/services`,
      {
        name: kongServiceName,
        url: updatedProduct.upstreamURL,
        enabled: isKongEnabled,
      },
      {
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.KONG_API_KEY as string,
        },
      },
    );

    await prisma.dataProduct.update({
      where: { id: updatedProduct.id },
      data: {
        kongServiceID: newKongService.data.id,
      },
    });
    kongServiceId = newKongService.data.id;
  }

  // Check if route exists for service

  let kongServiceRoute = await axios
    .get(`${process.env.KONG_ADMIN_URL}/services/${kongServiceId}/routes`, {
      headers: { apikey: process.env.KONG_API_KEY as string },
    })
    .then((res) => res.data)
    .catch(() => null);

  if (kongServiceRoute?.data.length === 0) {
    await axios.post(
      `${process.env.KONG_ADMIN_URL}/routes`,
      {
        paths: [
          `/${updatedProduct.organisation.shortName}/${updatedProduct.accessURL}`,
        ],
        service: { id: kongServiceId },
      },
      {
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.KONG_API_KEY as string,
        },
      },
    );
  }

  // Update existing Kong service
  await axios.patch(
    `${process.env.KONG_ADMIN_URL}/services/${kongServiceId}`,
    {
      name: kongServiceName,
      url: updatedProduct.upstreamURL,
      enabled: isKongEnabled,
    },
    {
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.KONG_API_KEY as string,
      },
    },
  );

  if (!kongServiceRoute) {
    kongServiceRoute = await axios
      .get(`${process.env.KONG_ADMIN_URL}/services/${kongServiceId}/routes`, {
        headers: { apikey: process.env.KONG_API_KEY as string },
      })
      .then((res) => res.data)
      .catch(() => null);
  }

  // Update route
  await axios.patch(
    `${process.env.KONG_ADMIN_URL}/services/${kongServiceId}/routes/${kongServiceRoute.data[0].id}`,
    {
      paths: [
        `/${updatedProduct.organisation.shortName}/${updatedProduct.accessURL}`,
      ],
    },
    {
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.KONG_API_KEY as string,
      },
    },
  );
};

const insertKongService = async (updatedProduct: any) => {
  const kongServiceName = replaceSpacesWithUnderscores(
    `${updatedProduct.name}_${updatedProduct.organisation.shortName}`,
  );
  const isKongEnabled = updatedProduct.status === "LIVE";
  const newKongService = await axios.post(
    `${process.env.KONG_ADMIN_URL}/services`,
    {
      name: kongServiceName,
      url: updatedProduct.upstreamURL,
      enabled: isKongEnabled,
    },
    {
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.KONG_API_KEY as string,
      },
    },
  );

  await prisma.dataProduct.update({
    where: { id: updatedProduct.id },
    data: {
      kongServiceID: newKongService.data.id,
    },
  });

  await axios.post(
    `${process.env.KONG_ADMIN_URL}/routes`,
    {
      paths: [
        `/${updatedProduct.organisation.shortName}/${updatedProduct.accessURL}`,
      ],
      service: { id: newKongService.data.id },
    },
    {
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.KONG_API_KEY as string,
      },
    },
  );
};
