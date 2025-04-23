export const mockPrisma = {
    user: {
      findMany: jest.fn().mockResolvedValue([]), // Mock user queries
    },
    dataProduct: {
      update: jest.fn(), // Mock dataProduct.update
    },
    subscription: {
      findMany: jest.fn().mockResolvedValue([]), // Mock subscription queries
    },
  };