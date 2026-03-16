import { z } from 'zod';
import {
  PersonNameSchema,
  CustomerIdSchema,
  PhoneNumberSchema,
  MessageTextSchema,
} from './primitives.js';

export const LookupCustomerArgsSchema = z.object({
  name: PersonNameSchema,
});

export const LookupCustomerResultSchema = z.object({
  customerId: CustomerIdSchema,
  matchedName: PersonNameSchema,
});

export const GetPhoneNumberArgsSchema = z.object({
  customerId: CustomerIdSchema,
});

export const GetPhoneNumberResultSchema = z.object({
  customerId: CustomerIdSchema,
  phoneNumber: PhoneNumberSchema,
});

export const SendTextArgsSchema = z.object({
  phoneNumber: z.string(), // Intentionally generic string for semantic validation demo
  message: MessageTextSchema,
});

export const SendTextResultSchema = z.object({
  messageId: z.string().min(1),
});
