import { ToolSpec } from '../types/tools.js';
import { ToolExecutionError } from '../types/errors.js';
import { GetPhoneNumberArgsSchema, GetPhoneNumberResultSchema } from '../schemas/toolSchemas.js';
import { CUSTOMERS } from './dataset.js';
import { nextCreatedAt, nextObjectId } from '../utils/ids.js';

export const getPhoneNumber: ToolSpec<typeof GetPhoneNumberArgsSchema, typeof GetPhoneNumberResultSchema> = {
  name: 'get_phone_number',
  argsSchema: GetPhoneNumberArgsSchema,
  resultSchema: GetPhoneNumberResultSchema,
  execute: async (args) => {
    const customer = CUSTOMERS.find((c) => c.customerId === args.customerId);
    if (!customer) {
      throw new ToolExecutionError(
        'PHONE_NUMBER_NOT_AVAILABLE',
        `Customer ID '${args.customerId}' not found.`,
      );
    }
    return {
      customerId: customer.customerId,
      phoneNumber: customer.phoneNumber,
    };
  },
  materializeObjects: (result) => {
    return [
      {
        objectId: nextObjectId('phone'),
        typeName: 'PHONE_NUMBER',
        value: result.phoneNumber,
        producedBy: 'get_phone_number',
        sourceObjectIds: [],
        createdAt: nextCreatedAt(),
      },
    ];
  },
};
