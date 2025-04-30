// __mocks__/kong.ts
interface MockService {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

interface MockRoute {
  id: string;
  service: { id: string };
  paths: string[];
}

let mockServices: MockService[] = [];
let mockRoutes: MockRoute[] = [];
let circuitBreakerState = {
  isOpen: false,
  lastTripped: 0,
  cooldown: 30000,
};

export const mockManageKongService = jest
  .fn()
  .mockImplementation(
    async (
      method: "GET" | "POST" | "PATCH" | "DELETE",
      serviceId?: string,
      data?: any
    ) => {
      // Simulate circuit breaker check
      if (circuitBreakerState.isOpen) {
        const now = Date.now();
        if (
          now - circuitBreakerState.lastTripped <
          circuitBreakerState.cooldown
        ) {
          return;
        }
        circuitBreakerState.isOpen = false;
      }

      // Validate service ID for PATCH/DELETE
      if (
        (method === "PATCH" || method === "DELETE") &&
        (!serviceId || !serviceId.trim())
      ) {
        throw new Error("Invalid service ID");
      }

      // Validate data for POST/PATCH
      if ((method === "POST" || method === "PATCH") && !data) {
        throw new Error("Data is required for POST and PATCH methods");
      }

      try {
        switch (method) {
          case "GET": {
            if (serviceId) {
              const service = mockServices.find((s) => s.id === serviceId);
              if (!service) throw new Error("Service not found");
              return { data: service };
            }
            return { data: mockServices };
          }

          case "POST": {
            const newService = {
              id: `service-${mockServices.length + 1}`,
              ...data,
              enabled: data.enabled ?? true,
            };
            mockServices.push(newService);
            return { data: newService };
          }

          case "PATCH": {
            const index = mockServices.findIndex((s) => s.id === serviceId);
            if (index === -1) throw new Error("Service not found");
            mockServices[index] = { ...mockServices[index], ...data };
            return { data: mockServices[index] };
          }

          case "DELETE": {
            // Simulate route cleanup
            mockRoutes = mockRoutes.filter((r) => r.service.id !== serviceId);

            // Delete service
            mockServices = mockServices.filter((s) => s.id !== serviceId);
            return;
          }

          default:
            throw new Error(`Unsupported method: ${method}`);
        }
      } catch (error) {
        // Simulate circuit breaker tripping
        if (error instanceof Error && !error.message.includes("not found")) {
          circuitBreakerState.isOpen = true;
          circuitBreakerState.lastTripped = Date.now();
        }
        throw error;
      }
    }
  );

// Mock utilities
export const mockKongUtils = {
  reset: () => {
    mockServices = [];
    mockRoutes = [];
    circuitBreakerState.isOpen = false;
    circuitBreakerState.lastTripped = 0;
    mockManageKongService.mockClear();
  },
  setServices: (services: MockService[]) => {
    mockServices = services;
  },
  setRoutes: (routes: MockRoute[]) => {
    mockRoutes = routes;
  },
  setCircuitBreaker: (state: { isOpen: boolean; lastTripped?: number }) => {
    circuitBreakerState.isOpen = state.isOpen;
    if (state.lastTripped) {
      circuitBreakerState.lastTripped = state.lastTripped;
    }
  },
};

export const addServiceAclPlugin = jest.fn();
export const upsertKongService = jest
  .fn()
  .mockImplementation(async (product: any) => {
    const service = await mockManageKongService("POST", undefined, {
      name: product.name,
      url: product.upstreamURL,
      enabled: product.status === "LIVE",
    });
    return { service: service.data };
  });

// Circuit breaker mock
export const kongCircuitBreaker = circuitBreakerState;
