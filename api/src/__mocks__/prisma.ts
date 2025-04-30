export const mockPrisma = {
  user: {
    findMany: jest.fn().mockResolvedValue([]), // Mock user queries
    findUnique: jest.fn(),
  },
  dataProduct: {
    update: jest.fn(), // Mock dataProduct.update
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  organisation: {
    findUnique: jest.fn(),
  },
  subscription: {
    findMany: jest.fn().mockResolvedValue([]), // Mock subscription queries
  },
};
