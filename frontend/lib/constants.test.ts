import { USER_TOKEN } from "./constants";

describe("Constants and Config Utilities", () => {
  describe("USER_TOKEN", () => {
    it("should have the correct value", () => {
      expect(USER_TOKEN).toBe("user-token");
    });
  });

  describe("getJwtSecretKey", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it("should return JWT secret key when set", () => {
      process.env.JWT_SECRET_KEY = "test-secret-123";
      const { getJwtSecretKey } = require("./constants");
      expect(getJwtSecretKey()).toBe("test-secret-123");
    });

    it("should throw error when JWT secret key is missing", () => {
      delete process.env.JWT_SECRET_KEY;
      const { getJwtSecretKey } = require("./constants");
      expect(() => getJwtSecretKey()).toThrow(
        "The environment variable JWT_SECRET_KEY is not set."
      );
    });
  });
});
