// __tests__/kong.test.ts
import axios, { AxiosError } from "axios";
import { jest } from "@jest/globals";
import {
  addUserToProductACL,
  batchACLOperation,
  createKongConsumer,
  createUserAPIKeyInKong,
  getUserAPIKeyFromKong,
  kongCircuitBreaker,
  manageKongService,
  upsertKongService,
} from "../../utils/kong";
import { mockPrisma } from "../../__mocks__/prisma";
import { DataProductStatus } from "@prisma/client";

jest.mock("axios");
jest.mock("@prisma/client");

const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
  process.env.KONG_ADMIN_URL = "http://mock-kong-admin";
  process.env.KONG_API_KEY = "mock-api-key";
  // Reset circuit breaker state before each test
  kongCircuitBreaker.isOpen = false;
  kongCircuitBreaker.lastTripped = 0;
  mockPrisma.user.findMany.mockClear();
  mockedAxios.post.mockReset();
  // Reset all mocks
  jest.clearAllMocks();
});

describe("createKongConsumer", () => {
  it("should create a new consumer successfully", async () => {
    const mockResponse = { data: { id: "123", username: "user_test" } };
    mockedAxios.post.mockResolvedValue(mockResponse);

    const result = await createKongConsumer("test-user");

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/consumers"),
      {
        username: "user_test-user",
        custom_id: "test-user",
      },
      { headers: expect.objectContaining({ apikey: "mock-api-key" }) }
    );
    expect(result).toEqual(mockResponse.data);
  });

  it("should handle circuit breaker opening on failure", async () => {
    const mockError = new Error("API down") as any;
    mockError.isAxiosError = true;
    mockError.response = undefined;

    (
      axios.isAxiosError as jest.MockedFunction<typeof axios.isAxiosError>
    ).mockImplementation(
      (error): error is AxiosError<any, any> => !!error?.isAxiosError
    );

    mockedAxios.post.mockRejectedValue(mockError);

    try {
      await createKongConsumer("test-user");
    } catch (e) {
      // Ignore the error to test circuit breaker state
    }

    expect(kongCircuitBreaker.isOpen).toBe(true);
  });
});

describe("manageKongService", () => {
  const mockService = { id: "svc123", name: "test-service" };

  test("successfully creates service", async () => {
    mockedAxios.post.mockResolvedValue({ data: mockService });
    const result = await manageKongService("POST", undefined, mockService);
    expect(result).toEqual(mockService);
  });

  test("throws on invalid PATCH operation", async () => {
    await expect(manageKongService("PATCH", " ", {})).rejects.toThrow(
      "Invalid service ID"
    );
  });

  test("deletes service with routes", async () => {
    mockedAxios.get.mockResolvedValue({ data: { data: [{ id: "route1" }] } });
    mockedAxios.delete.mockResolvedValue({});

    await manageKongService("DELETE", "svc123");
    expect(mockedAxios.delete).toHaveBeenCalledTimes(2); // routes + service
  });
});

describe("upsertKongService", () => {
  const mockProduct = {
    id: "prod123",
    name: "test-product",
    description: null,
    accessURL: "http://access.url",
    kongServiceID: "fake-id",
    status: "LIVE" as DataProductStatus, // assuming "LIVE" is a valid value of DataProductStatus
    upstreamURL: "http://upstream",
    price: null,
    organisationID: "org123",
    organisation: { name: "test-org", logoUrl: "img.com", shortName: "org" },
  };

  test("creates new service when no ID exists", async () => {
    mockProduct.kongServiceID = "";
    mockedAxios.post.mockResolvedValue({
      data: {
        id: "svc123",
        name: "test-service",
        url: "http://upstream",
        enabled: true,
      },
    });
    mockedAxios.get.mockResolvedValue({ data: { data: [] } }); // No routes

    await upsertKongService(mockProduct);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "http://mock-kong-admin/services",
      expect.objectContaining({
        name: "test-product_org",
        url: "http://upstream",
        enabled: true,
      }),
      expect.anything()
    );

    expect(mockPrisma.dataProduct.update).toHaveBeenCalledWith({
      where: { id: "prod123" },
      data: { kongServiceID: "svc123" },
    });
  });

  test("updates existing service", async () => {
    const existingService = { id: "existing123", name: "old-name" };
    mockProduct.kongServiceID = "existing123";

    mockedAxios.get.mockResolvedValue({ data: existingService });
    mockedAxios.patch.mockResolvedValue({ data: existingService });

    await upsertKongService(mockProduct);
    expect(mockedAxios.patch).toHaveBeenCalled();
  });
});

describe("API Key Management", () => {
  test("getUserAPIKeyFromKong returns first key", async () => {
    const mockKeys = [{ id: "key1" }];
    jest.spyOn(axios, "get").mockResolvedValue({ data: { data: mockKeys } });

    const result = await getUserAPIKeyFromKong("consumer123");
    expect(result).toEqual(mockKeys[0]);
  });

  test("createUserAPIKeyInKong throws on existing key", async () => {
    jest
      .spyOn(axios, "get")
      .mockResolvedValue({ data: { data: [{ id: "key1" }] } });

    await expect(createUserAPIKeyInKong("user123", 3600)).rejects.toThrow(
      "already has an API key"
    );
  });
});

describe("ACL Operations", () => {
  test("addUserToProductACL creates consumer if needed", async () => {
    const mockConsumer = { id: "consumer123" };
    jest
      .spyOn(mockPrisma.user, "findUnique")
      .mockResolvedValue({ id: "user123" });
    jest.spyOn(axios, "post").mockResolvedValue({ data: mockConsumer });

    await addUserToProductACL("user123", "prod123");
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/acls"),
      {
        group: "data_product_prod123_group",
      },
      {
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          apikey: "mock-api-key",
        }),
      }
    );
  });

  test("batchACLOperation processes in batches", async () => {
    // Set up mock sequence
    let callCount = 0;

    mockPrisma.user.findMany.mockImplementation(() => {
      // First call: return 2 users
      if (callCount++ === 0) {
        return [{ id: "user1" }, { id: "user2" }];
      }
      // Subsequent calls: return empty array
      return [];
    });

    jest.spyOn(axios, "post").mockResolvedValue({});

    await batchACLOperation("prod123", "add");

    // Verify batch processing
    expect(mockPrisma.user.findMany).toHaveBeenCalledTimes(2);
    expect(mockPrisma.user.findMany).toHaveBeenNthCalledWith(1, {
      skip: 0,
      take: 100,
      select: { id: true },
    });
    expect(mockPrisma.user.findMany).toHaveBeenNthCalledWith(2, {
      skip: 100,
      take: 100,
      select: { id: true },
    });

    expect(axios.post).toHaveBeenCalledTimes(2);
  });
});
