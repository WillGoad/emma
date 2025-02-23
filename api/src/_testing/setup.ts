import { mockPrisma } from './__mocks__/prisma';


// Mock node-cron to prevent real scheduling
jest.mock('node-cron', () => ({
  cron: {
    schedule: jest.fn(),
  },
}));

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Mock the scheduler to avoid background jobs
jest.mock('../services/scheduler.ts', () => ({
  startScheduler: jest.fn(),
  stopScheduler: jest.fn(),
  scheduledTasks: [],
}));