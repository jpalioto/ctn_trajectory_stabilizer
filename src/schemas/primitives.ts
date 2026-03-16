import { z } from 'zod';

export const PersonNameSchema = z.string().min(1);
export const CustomerIdSchema = z.string().min(1);
export const MessageTextSchema = z.string().min(1);

export const PhoneNumberSchema = z
  .string()
  .regex(/^\+?[1-9]\d{7,14}$/, 'Expected E.164-like phone number');
