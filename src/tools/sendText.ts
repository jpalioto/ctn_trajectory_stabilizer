import { ToolSpec } from '../types/tools.js';
import { SendTextArgsSchema, SendTextResultSchema } from '../schemas/toolSchemas.js';
import { classifyString } from '../utils/classify.js';
import { nextCreatedAt, nextObjectId } from '../utils/ids.js';

export const sendText: ToolSpec<typeof SendTextArgsSchema, typeof SendTextResultSchema> = {
  name: 'send_text',
  argsSchema: SendTextArgsSchema,
  resultSchema: SendTextResultSchema,
  execute: async (args) => {
    return {
      messageId: nextObjectId('message'),
    };
  },
  semanticValidate: (args) => {
    const observed = classifyString(args.phoneNumber);
    if (observed !== 'PHONE_NUMBER') {
      return [
        {
          code: 'SEMANTIC_TYPE_MISMATCH',
          field: 'phoneNumber',
          expected: 'PHONE_NUMBER',
          observed,
          message:
            observed === 'PERSON_NAME'
              ? `Field 'phoneNumber' expected PHONE_NUMBER, received probable PERSON_NAME ('${args.phoneNumber}')`
              : `Field 'phoneNumber' expected PHONE_NUMBER, received invalid string`,
          repairHint: 'Resolve the customer first, then fetch the phone number and retry send_text.',
        },
      ];
    }
    return [];
  },
  provenanceRules: [
    {
      field: 'phoneNumber',
      requiredType: 'PHONE_NUMBER',
      requiredProducer: 'get_phone_number',
    },
  ],
  materializeObjects: (result) => {
    return [
      {
        objectId: nextObjectId('message_record'),
        typeName: 'TEXT_MESSAGE_ID',
        value: result.messageId,
        producedBy: 'send_text',
        sourceObjectIds: [],
        createdAt: nextCreatedAt(),
      },
    ];
  },
};
