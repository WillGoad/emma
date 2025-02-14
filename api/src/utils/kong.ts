import axios from "axios";
import { prisma } from "..";
import {
  replaceSpacesWithUnderscores,
  sanitizeKongName,
  sanitizeRoutePath,
} from "./helpers";
import { DataProduct, DataProductStatus } from "@prisma/client";

interface KongConsumer {
  id: string;
  username: string;
  custom_id: string;
}

export interface KongServiceConfig {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

export interface KongRouteConfig {
  paths: string[];
  service: { id: string };
}

export const addUserToProductACL = async (
  userId: string,
  productId: string
): Promise<void> => {
  const consumer = await getOrCreateConsumer(userId);
  await addACLGroup(consumer.id, `data_product_${productId}_group`);
};

export const removeUserFromProductACL = async (
  userId: string,
  productId: string
): Promise<void> => {
  try {
    const consumer = await findConsumer(userId);
    await removeACLGroup(consumer.id, `data_product_${productId}_group`);
  } catch (error) {
    console.error("Failed to remove ACL group:", error);
    throw new Error("Failed to update access controls");
  }
};

const getOrCreateConsumer = async (userId: string): Promise<KongConsumer> => {
  try {
    return await findConsumer(userId);
  } catch (error) {
    return createConsumer(userId);
  }
};

const findConsumer = async (userId: string): Promise<KongConsumer> => {
  const apiKey = process.env.KONG_API_KEY;
  const adminUrl = process.env.KONG_ADMIN_URL;

  if (!apiKey || !adminUrl) {
    throw new Error(
      "KONG_API_KEY or KONG_ADMIN_URL environment variables not configured"
    );
  }

  const response = await axios.get(`${adminUrl}/consumers`, {
    params: { custom_id: userId },
    headers: { apikey: apiKey },
  });

  if (!response.data.data?.length) {
    throw new Error("Consumer not found");
  }

  return response.data.data[0];
};

const createConsumer = async (userId: string): Promise<KongConsumer> => {
  const apiKey = process.env.KONG_API_KEY;
  const adminUrl = process.env.KONG_ADMIN_URL;

  if (!apiKey || !adminUrl) {
    throw new Error(
      "KONG_API_KEY or KONG_ADMIN_URL environment variables not configured"
    );
  }

  const response = await axios.post(
    `${adminUrl}/consumers`,
    {
      username: `user_${userId}`,
      custom_id: userId,
    },
    {
      headers: { apikey: apiKey },
    }
  );

  return response.data;
};

const addACLGroup = async (
  consumerId: string,
  group: string
): Promise<void> => {
  const apiKey = process.env.KONG_API_KEY;
  const adminUrl = process.env.KONG_ADMIN_URL;

  if (!apiKey || !adminUrl) {
    throw new Error(
      "KONG_API_KEY or KONG_ADMIN_URL environment variables not configured"
    );
  }

  await axios.post(
    `${adminUrl}/consumers/${consumerId}/acls`,
    { group },
    {
      headers: { apikey: apiKey },
    }
  );
};

const removeACLGroup = async (
  consumerId: string,
  group: string
): Promise<void> => {
  const apiKey = process.env.KONG_API_KEY;
  const adminUrl = process.env.KONG_ADMIN_URL;

  if (!apiKey || !adminUrl) {
    throw new Error(
      "KONG_API_KEY or KONG_ADMIN_URL environment variables not configured"
    );
  }

  // First get the ACL ID for the group
  const aclResponse = await axios.get(
    `${adminUrl}/consumers/${consumerId}/acls`,
    { headers: { apikey: apiKey } }
  );

  const targetACL = aclResponse.data.data.find(
    (acl: any) => acl.group === group
  );

  if (!targetACL) {
    console.warn(`ACL group ${group} not found for consumer ${consumerId}`);
    return;
  }

  await axios.delete(
    `${adminUrl}/consumers/${consumerId}/acls/${targetACL.id}`,
    { headers: { apikey: apiKey } }
  );
};

const getKongHeaders = () => ({
  "Content-Type": "application/json",
  apikey: process.env.KONG_API_KEY as string,
});

export const upsertKongService = async (updatedProduct: any) => {
  let kongServiceId = updatedProduct.kongServiceID;
  const kongServiceName = replaceSpacesWithUnderscores(
    `${updatedProduct.name}_${updatedProduct.organisation.shortName}`
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
      }
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
      }
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
    }
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
    }
  );
};

interface KongServiceCreationParams {
  product: {
    id: string;
    name: string;
    upstreamURL: string;
    accessURL: string;
    status: DataProductStatus;
    organisation: {
      shortName: string;
    };
  };
}

export const createKongServiceForProduct = async (
  params: KongServiceCreationParams
): Promise<{ service: KongServiceConfig; route: KongRouteConfig }> => {
  try {
    const { KONG_ADMIN_URL, KONG_API_KEY } = process.env;

    // Validate environment variables
    if (!KONG_ADMIN_URL || !KONG_API_KEY) {
      throw new Error("Kong configuration missing");
    }

    // Sanitize service name
    const serviceName = sanitizeKongName(
      `${params.product.name}_${params.product.organisation.shortName}`
    );

    // Create Kong service
    const serviceResponse = await axios.post<KongServiceConfig>(
      `${KONG_ADMIN_URL}/services`,
      {
        name: serviceName,
        url: params.product.upstreamURL,
        enabled: params.product.status === "LIVE",
      },
      {
        headers: getKongHeaders(),
        timeout: 10000, // 10-second timeout
      }
    );

    // Create Kong route
    const routePath = sanitizeRoutePath(
      `/${params.product.organisation.shortName}/${params.product.accessURL}`
    );

    const routeResponse = await axios.post<KongRouteConfig>(
      `${KONG_ADMIN_URL}/routes`,
      {
        paths: [routePath],
        service: { id: serviceResponse.data.id },
      },
      {
        headers: getKongHeaders(),
        timeout: 10000,
      }
    );

    return {
      service: serviceResponse.data,
      route: routeResponse.data,
    };
  } catch (error) {
    console.error("Kong service creation failed:", error);
    throw new Error(
      `Kong configuration failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

export const deleteKongServiceByID = async (serviceId: string): Promise<void> => {
  try {
    // Validate input
    if (!serviceId?.trim()) {
      throw new Error('Invalid service ID provided');
    }

    // Check environment configuration
    const { KONG_ADMIN_URL } = process.env;
    if (!KONG_ADMIN_URL) {
      throw new Error('KONG_ADMIN_URL environment variable not configured');
    }

    // Make API call with timeout
    const response = await axios.delete(
      `${KONG_ADMIN_URL}/services/${encodeURIComponent(serviceId)}`,
      {
        headers: getKongHeaders(),
        timeout: 5000 // 5-second timeout
      }
    );

    // Verify successful deletion (2xx status)
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Unexpected response status: ${response.status}`);
    }

    // Optional: Add debug logging
    console.debug(`Successfully deleted Kong service ${serviceId}`);

  } catch (error) {
    // Enhanced error handling
    const errorMessage = axios.isAxiosError(error)
      ? `Kong API Error: ${error.response?.status} - ${error.response?.data?.message}`
      : error instanceof Error
      ? error.message
      : 'Unknown error occurred';

    console.error(`Failed to delete Kong service ${serviceId}: ${errorMessage}`);
    
    // Preserve original error stack while adding context
    throw new Error(`Failed to delete Kong service: ${errorMessage}`, { cause: error });
  }
};
