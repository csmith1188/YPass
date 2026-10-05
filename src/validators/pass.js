import { z } from 'zod';

const kioskCode = z.string().trim().min(1).max(64);
const studentNumber = z.string().trim().min(1).max(64);

export const kioskScanSchema = z.object({
  kioskCode,
  studentNumber,
  _csrf: z.string().optional(),
});

export const createPassRequestSchema = z.object({
  kioskCode,
  studentNumber,
  studentName: z.string().trim().min(1).max(120),
  destinationLocationId: z.string().uuid(),
  _csrf: z.string().optional(),
});