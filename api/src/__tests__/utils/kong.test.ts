// __tests__/kong.test.ts
import axios, { AxiosError } from "axios";
import { jest } from "@jest/globals";
import { createKongConsumer, kongCircuitBreaker } from "../../utils/kong";
import { mockPrisma } from "../../_testing/__mocks__/prisma";

jest.mock("axios");
jest.mock("@prisma/client");

const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
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
      expect.any(Object)
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
