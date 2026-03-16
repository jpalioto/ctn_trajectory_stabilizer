import { RuntimeToolSpec, toRuntimeToolSpec } from '../types/tools.js';
import { lookupCustomer } from './lookupCustomer.js';
import { getPhoneNumber } from './getPhoneNumber.js';
import { sendText } from './sendText.js';

export const toolRegistry = new Map<string, RuntimeToolSpec>([
  [lookupCustomer.name, toRuntimeToolSpec(lookupCustomer)],
  [getPhoneNumber.name, toRuntimeToolSpec(getPhoneNumber)],
  [sendText.name, toRuntimeToolSpec(sendText)],
]);
