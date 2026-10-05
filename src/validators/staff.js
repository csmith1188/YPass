import { z } from 'zod';

const id = z.string().uuid();
const studentNumber = z.string().trim().min(1).max(64);
const studentName = z.string().trim().min(1).max(120);

export const passActionSchema = z.object({
  passId: id,
  action: z.enum(['approve', 'cancel']),
  _csrf: z.string().optional(),
});

export const appointmentSchema = z.object({
  studentNumber,
  studentName,
  originLocationId: id,
  destinationLocationId: id,
  scheduledAt: z.string().trim().min(1).max(40),
  notes: z.string().trim().max(500).optional(),
  _csrf: z.string().optional(),
});

export const managerFilterSchema = z.object({
  status: z.string().trim().max(32).optional(),
  appointmentStatus: z.string().trim().max(32).optional(),
  studentNumber: z.string().trim().max(64).optional(),
});
