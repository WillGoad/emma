import axios from "axios";
import { prisma } from "..";
import { sanitizeKongName, sanitizeRoutePath } from "./helpers";
import {
  KeyAuth,
  KongDataProductDetails,
  PrivateDataProductWithOrganization,
} from "./types";

interface KongConsumer {
  id: string;
  username: string;
  custom_id: string;
}

interface KeyAuthResponse {
  data: KeyAuth[];
}

interface CircuitBreaker {
  isOpen: boolean;
  lastTripped: number;
  cooldown: number;
}

export const kongCircuitBreaker: CircuitBreaker = {
  isOpen: false,
  lastTripped: 0,
  cooldown: 30 * 1000,
};

const checkCircuitBreaker = (): boolean => {
  if (!kongCircuitBreaker.isOpen) return true;

  const now = Date.now();
  if (now - kongCircuitBreaker.lastTripped >= kongCircuitBreaker.cooldown) {
    kongCircuitBreaker.isOpen = false; // Reset after cooldown
    return true; // Allow one attempt
  }
  return false;
};

const handleCircuitBreakerState = (error: unknown): void => {
  const isNetworkError = axios.isAxiosError(error) && !error.response;

  const isServerError =
    axios.isAxiosError(error) && error.response && error.response.status >= 500;

  if (isNetworkError || isServerError || !(error instanceof Error)) {
    kongCircuitBreaker.isOpen = true;
    kongCircuitBreaker.lastTripped = Date.now();
  }
};

const BATCH_SIZE = 100;

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

const validateKongConfig = () => {
  const { KONG_ADMIN_URL, KONG_API_KEY } = process.env;
  if (!KONG_ADMIN_URL || !KONG_API_KEY) {
    throw new Error("Kong configuration missing");
  }
  const KONG_HEADERS = {
    "Content-Type": "application/json",
    apikey: KONG_API_KEY as string,
  };
  return { KONG_ADMIN_URL, KONG_HEADERS };
};

// ----------------------------
// Core Kong API Utilities
// ----------------------------
const fetchKongConsumerByCustomId = async (userId: string) => {
  const { KONG_ADMIN_URL, KONG_HEADERS } = validateKongConfig();
  if (!checkCircuitBreaker()) return;
  try {
    const response = await axios.get(`${KONG_ADMIN_URL}/consumers`, {
      params: { custom_id: userId },
      headers: KONG_HEADERS,
    });
    return response.data.data;
  } catch (error) {
    handleCircuitBreakerState(error);
    handleKongError(error, "Kong admin API usage failed");
  }
};

export const createKongConsumer = async (userId: string) => {
  const { KONG_ADMIN_URL, KONG_HEADERS } = validateKongConfig();
  if (!checkCircuitBreaker()) return;
  try {
    const response = await axios.post(
      `${KONG_ADMIN_URL}/consumers`,
      {
        username: `user_${userId}`,
        custom_id: userId,
      },
      { headers: KONG_HEADERS }
    );
    return response.data;
  } catch (error) {
    handleCircuitBreakerState(error);
    handleKongError(error, "Kong admin API usage failed");
  }
};

const manageKongACL = async (
  consumerId: string,
  group: string,
  method: "POST" | "DELETE"
) => {
  const { KONG_ADMIN_URL, KONG_HEADERS } = validateKongConfig();
  if (!checkCircuitBreaker()) return;
  try {
    const url = `${KONG_ADMIN_URL}/consumers/${consumerId}/acls`;

    if (method === "DELETE") {
      const aclResponse = await axios.get(url, { headers: KONG_HEADERS });
      const targetACL = aclResponse.data.data.find(
        (acl: any) => acl.group === group
      );
      if (!targetACL) return;
      await axios.delete(`${url}/${targetACL.id}`, { headers: KONG_HEADERS });
    } else {
      await axios.post(url, { group }, { headers: KONG_HEADERS });
    }
  } catch (error) {
    handleCircuitBreakerState(error);
    handleKongError(error, "Kong admin API usage failed");
  }
};

export const manageKongService = async (
  method: "GET" | "POST" | "PATCH" | "DELETE",
  serviceId?: string,
  data?: any
) => {
  if (!checkCircuitBreaker()) return;
  if (
    !serviceId?.trim() &&
    (method === "PATCH" || method === "DELETE" || method === "GET")
  ) {
    throw new Error("Invalid service ID");
  }
  if ((method === "POST" || method === "PATCH") && !data) {
    throw new Error("Data is required for POST and PATCH methods");
  }
  const { KONG_ADMIN_URL, KONG_HEADERS } = validateKongConfig();
  const baseUrl = `${KONG_ADMIN_URL}/services`;
  const url = serviceId ? `${baseUrl}/${serviceId}` : baseUrl;
  try {
    switch (method) {
      case "GET":
        return (await axios.get(url, { headers: KONG_HEADERS })).data;
      case "POST":
        return (await axios.post(url, data, { headers: KONG_HEADERS })).data;
      case "PATCH":
        return (await axios.patch(url, data, { headers: KONG_HEADERS })).data;
      case "DELETE":
        await axios.delete(url, { headers: KONG_HEADERS });
        return;
    }
  } catch (error) {
    handleCircuitBreakerState(error);
    handleKongError(error, "Kong admin API usage failed");
  }
};

const fetchRoutesForService = async (serviceId: string) => {
  const { KONG_ADMIN_URL, KONG_HEADERS } = validateKongConfig();
  if (!checkCircuitBreaker()) return null;
  try {
    const response = await axios.get(
      `${KONG_ADMIN_URL}/services/${serviceId}/routes`,
      { headers: KONG_HEADERS }
    );
    return response.data.data;
  } catch (error) {
    handleCircuitBreakerState(error);
    return null;
  }
};

const createKongRoute = async (routeData: any) => {
  if (!checkCircuitBreaker()) return;
  const { KONG_ADMIN_URL, KONG_HEADERS } = validateKongConfig();
  try {
    const response = await axios.post(`${KONG_ADMIN_URL}/routes`, routeData, {
      headers: KONG_HEADERS,
    });
    return response.data;
  } catch (error) {
    handleCircuitBreakerState(error);
    handleKongError(error, "Kong admin API usage failed");
  }
};

const updateKongRoute = async (routeId: string, routeData: any) => {
  if (!checkCircuitBreaker()) return;
  const { KONG_ADMIN_URL, KONG_HEADERS } = validateKongConfig();
  try {
    const response = await axios.patch(
      `${KONG_ADMIN_URL}/routes/${routeId}`,
      routeData,
      {
        headers: KONG_HEADERS,
      }
    );
    return response.data;
  } catch (error) {
    handleCircuitBreakerState(error);
    handleKongError(error, "Kong admin API usage failed");
  }
};

const manageKeyAuth = async (
  consumerId: string,
  method: "GET" | "POST" | "DELETE",
  keyId?: string,
  data?: any
) => {
  if (!checkCircuitBreaker()) return;
  const { KONG_ADMIN_URL, KONG_HEADERS } = validateKongConfig();
  try {
    const baseUrl = `${KONG_ADMIN_URL}/consumers/${consumerId}/key-auth`;
    const url = keyId ? `${baseUrl}/${keyId}` : baseUrl;

    switch (method) {
      case "GET":
        return (
          await axios.get<KeyAuthResponse>(url, { headers: KONG_HEADERS })
        ).data.data;
      case "POST":
        return (await axios.post<KeyAuth>(url, data, { headers: KONG_HEADERS }))
          .data;
      case "DELETE":
        await axios.delete(url, { headers: KONG_HEADERS });
        return;
    }
  } catch (error) {
    handleCircuitBreakerState(error);
    handleKongError(error, "Kong admin API usage failed");
  }
};

// ----------------------------
// Business Logic Functions
// ----------------------------

export const addUserToProductACL = async (
  userId: string,
  productId: string
): Promise<void> => {
  const consumer = await getOrCreateConsumer(userId);
  await manageKongACL(consumer.id, `data_product_${productId}_group`, "POST");
};

export const removeUserFromProductACL = async (
  userId: string,
  productId: string
): Promise<void> => {
  try {
    const consumer = await getConsumerById(userId);
    await manageKongACL(
      consumer.id,
      `data_product_${productId}_group`,
      "DELETE"
    );
  } catch (error) {
    console.error("Failed to remove ACL group:", error);
    throw new Error("Failed to update access controls");
  }
};

const getOrCreateConsumer = async (userId: string): Promise<KongConsumer> => {
  try {
    return await getConsumerById(userId);
  } catch (error) {
    return createKongConsumer(userId);
  }
};

export const getConsumerById = async (
  userId: string
): Promise<KongConsumer> => {
  const consumers = await fetchKongConsumerByCustomId(userId);
  if (!consumers?.length) {
    throw new Error(`No Kong consumer found for user ID: ${userId}`);
  }
  if (consumers.length > 1) {
    throw new Error(`Multiple consumers found for user ID: ${userId}`);
  }

  return consumers[0];
};

export const upsertKongService = async (
  product: PrivateDataProductWithOrganization
): Promise<{ service: KongServiceConfig; route: KongRouteConfig }> => {
  try {
    const serviceName = sanitizeKongName(
      `${product.name}_${product.organisation.shortName}`
    );
    const routePath = sanitizeRoutePath(
      `/${product.organisation.shortName}/${product.accessURL}`
    );

    let service: KongServiceConfig;
    if (product.kongServiceID) {
      const existingService = await manageKongService(
        "GET",
        product.kongServiceID
      );
      service = existingService
        ? await manageKongService("PATCH", existingService.id, {
            name: serviceName,
            url: product.upstreamURL,
            enabled: product.status === "LIVE",
          })
        : await manageKongService("POST", undefined, {
            name: serviceName,
            url: product.upstreamURL,
            enabled: product.status === "LIVE",
          });
    } else {
      service = await manageKongService("POST", undefined, {
        name: serviceName,
        url: product.upstreamURL,
        enabled: product.status === "LIVE",
      });
    }

    // Update Prisma if new service created
    if (!product.kongServiceID) {
      await prisma.dataProduct.update({
        where: { id: product.id },
        data: { kongServiceID: service.id },
      });
    }

    let routes = await fetchRoutesForService(service.id);
    if (!routes?.length) {
      const newRoute = await createKongRoute({
        paths: [routePath],
        service: { id: service.id },
      });
      return { service, route: newRoute };
    }

    const updatedRoute = await updateKongRoute(routes[0].id, {
      paths: [routePath],
    });

    return { service, route: updatedRoute };
  } catch (error) {
    throw handleKongError(error, "Data product service configuration failed");
  }
};

interface PluginConfig {
  name: string;
  config: {
    whitelist: string[];
  };
}

export const addServiceAclPlugin = async (
  pluginConfig: PluginConfig,
  serviceId: string
) => {
  if (!checkCircuitBreaker()) return;

  const { KONG_ADMIN_URL, KONG_HEADERS } = validateKongConfig();

  if (!pluginConfig?.name || !pluginConfig?.config) {
    throw new Error("Invalid plugin configuration");
  }

  if (!serviceId?.trim()) {
    throw new Error("Service ID is required");
  }

  try {
    const url = `${KONG_ADMIN_URL}/services/${serviceId}/plugins`;
    return await axios.post(url, pluginConfig, { headers: KONG_HEADERS });
  } catch (error) {
    handleCircuitBreakerState(error);
    handleKongError(error, "Failed to add ACL plugin");
    throw error;
  }
};

export const batchACLOperation = async (
  productId: string,
  operation: "add" | "remove"
) => {
  try {
    let skip = 0;
    while (true) {
      const users = await prisma.user.findMany({
        skip,
        take: BATCH_SIZE,
        select: { id: true },
      });

      if (users.length === 0) break;

      await Promise.allSettled(
        users.map(async (user) => {
          try {
            const consumer = await getOrCreateConsumer(user.id);
            await manageKongACL(
              consumer.id,
              `data_product_${productId}_group`,
              operation === "add" ? "POST" : "DELETE"
            );
          } catch (error) {
            console.error(`Failed ${operation} for user ${user.id}:`, error);
          }
        })
      );

      skip += BATCH_SIZE;
    }
  } catch (error) {
    throw handleKongError(error, `Batch ${operation} operation failed`);
  }
};

const subsetACLOperation = async (
  productId: string,
  operation: "add" | "remove",
  userIds: string[]
) => {
  try {
    await Promise.allSettled(
      userIds.map(async (userId) => {
        try {
          const consumer = await getOrCreateConsumer(userId);
          await manageKongACL(
            consumer.id,
            `data_product_${productId}_group`,
            operation === "add" ? "POST" : "DELETE"
          );
        } catch (error) {
          console.error(`Failed ${operation} for user ${userId}:`, error);
        }
      })
    );
  } catch (error) {
    throw handleKongError(error, `Batch ${operation} operation failed`);
  }
};

export const addAllUsersToProductACL = (productId: string) =>
  batchACLOperation(productId, "add");

export const addSomeUsersToProductACL = (
  productId: string,
  userIds: string[]
) => subsetACLOperation(productId, "add", userIds);

export const removeAllUsersFromProductACL = (productId: string) =>
  batchACLOperation(productId, "remove");

export async function addUserToFreeProducts(userId: string): Promise<void> {
  try {
    const freeProducts = await prisma.dataProduct.findMany({
      where: { pricingMode: "FREE", status: "LIVE" },
      select: { id: true },
    });

    await Promise.allSettled(
      freeProducts.map((product) =>
        manageKongACL(userId, `data_product_${product.id}_group`, "POST")
      )
    );
  } catch (error) {
    throw handleKongError(error, "Failed to add user to free products");
  }
}

export const getAdminDataProductDetailsFromKong = async (
  serviceId: string
): Promise<KongDataProductDetails> => {
  try {
    const service = await manageKongService("GET", serviceId);
    const routes = await fetchRoutesForService(serviceId);

    return {
      serviceResponseBody: service,
      routeResponseBody: routes,
    };
  } catch (error) {
    throw handleKongError(error, "Failed to fetch service details");
  }
};

export const getUserAPIKeyFromKong = async (
  kongId: string
): Promise<KeyAuth | null> => {
  try {
    const keys = await manageKeyAuth(kongId, "GET");
    if (Array.isArray(keys) && keys.length > 0) {
      return keys[0];
    }
    return null;
  } catch (error) {
    throw handleKongError(error, "Failed to retrieve API key");
  }
};

export const createUserAPIKeyInKong = async (
  userId: string,
  ttl: number
): Promise<KeyAuth> => {
  try {
    const consumer = await getConsumerById(userId);
    const existingKey = await getUserAPIKeyFromKong(consumer.id);

    if (existingKey) {
      throw new Error("User already has an API key"); // Handle this as 400 in your route
    }

    const keyAuth = await manageKeyAuth(consumer.id, "POST", undefined, {
      ttl,
    });
    if (!keyAuth || Array.isArray(keyAuth)) {
      throw new Error("Failed to create API key");
    }
    return keyAuth;
  } catch (error) {
    throw handleKongError(error, "Failed to create API key");
  }
};

export const deleteUserAPIKeyInKong = async (userId: string, keyId: string) => {
  try {
    const consumer = await getConsumerById(userId);
    const existingKey = await getUserAPIKeyFromKong(consumer.id);
    if (!existingKey) {
      throw new Error("User doesn't have an API key"); // Handle this as 400 in your route
    }

    await manageKeyAuth(consumer.id, "DELETE", keyId);
  } catch (error) {
    throw handleKongError(error, "Failed to delete API key");
  }
};

export const rotateUserAPIKey = async (userId: string, ttl?: number) => {
  try {
    const consumer = await getConsumerById(userId);
    const existingKey = await getUserAPIKeyFromKong(consumer.id);

    if (existingKey) {
      await manageKeyAuth(consumer.id, "DELETE", existingKey.id);
    }

    return manageKeyAuth(consumer.id, "POST", undefined, { ttl });
  } catch (error) {
    throw handleKongError(error, "API key rotation failed");
  }
};

// ----------------------------
// Error Handling Utilities
// ----------------------------
const handleKongError = (error: unknown, defaultMessage: string): Error => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || error.message;
    return new Error(`${defaultMessage}: ${message}`);
  }
  return error instanceof Error ? error : new Error(defaultMessage);
};
