import { addMonths, addYears, addWeeks, addDays } from 'date-fns';
import { PayInterval } from "@prisma/client";

// Function to replace spaces with underscores
export const replaceSpacesWithUnderscores = (str: string): string => {
  return str.replace(/\s/g, "_");
};

export const sanitizeKongName = (name: string): string => {
  return name
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toLowerCase();
};

export const sanitizeRoutePath = (path: string): string => {
  return path
    .replace(/\/+/g, '/') // Remove duplicate slashes
    .replace(/\/$/, '') // Remove trailing slash
    .toLowerCase();
};

export const calculateEndTime = (startTime: Date, interval: PayInterval): Date => {
  switch (interval) {
    case 'DAILY': return addDays(startTime, 1);
    case 'WEEKLY': return addWeeks(startTime, 1);
    case 'MONTHLY': return addMonths(startTime, 1);
    case 'YEARLY': return addYears(startTime, 1);
    default: throw new Error(`Unsupported interval: ${interval}`);
  }
};