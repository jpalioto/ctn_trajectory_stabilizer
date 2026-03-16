import { ToolSpec } from '../types/tools.js';
import { ToolExecutionError } from '../types/errors.js';
import { LookupCustomerArgsSchema, LookupCustomerResultSchema } from '../schemas/toolSchemas.js';
import { CUSTOMERS } from './dataset.js';
import { nextCreatedAt, nextObjectId } from '../utils/ids.js';

export const lookupCustomer: ToolSpec<typeof LookupCustomerArgsSchema, typeof LookupCustomerResultSchema> = {
  name: 'lookup_customer',
  argsSchema: LookupCustomerArgsSchema,
  resultSchema: LookupCustomerResultSchema,
  execute: async (args) => {
    const customer = CUSTOMERS.find((c) => c.name.toLowerCase() === args.name.toLowerCase());
    if (!customer) {
      throw new ToolExecutionError(
        'CUSTOMER_NOT_FOUND',
        `Customer '${args.name}' not found.`,
      );
    }
    return {
      customerId: customer.customerId,
      matchedName: customer.name,
    };
  },
  materializeObjects: (result) => {
    const createdAt = nextCreatedAt();
    return [
      {
        objectId: nextObjectId('person'),
        typeName: 'PERSON_NAME',
        value: result.matchedName,
        producedBy: 'lookup_customer',
        sourceObjectIds: [],
        createdAt,
      },
      {
        objectId: nextObjectId('customer'),
        typeName: 'CUSTOMER_ID',
        value: result.customerId,
        producedBy: 'lookup_customer',
        sourceObjectIds: [],
        createdAt,
      },
    ];
  },
};
