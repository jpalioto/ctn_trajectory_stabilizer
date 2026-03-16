import { describe, it, expect } from 'vitest';
import { lookupCustomer } from '../src/tools/lookupCustomer.js';
import { getPhoneNumber } from '../src/tools/getPhoneNumber.js';
import { sendText } from '../src/tools/sendText.js';

describe('Tool: lookup_customer', () => {
  it('should find a customer by name', async () => {
    const args = { name: 'John Smith' };
    const result = await lookupCustomer.execute(args);
    expect(result.customerId).toBe('cust_1');
    expect(result.matchedName).toBe('John Smith');

    const objects = lookupCustomer.materializeObjects?.(result, args);
    if (!objects) {
      throw new Error('lookup_customer should materialize objects');
    }
    expect(objects).toHaveLength(2);
    expect(objects[0].typeName).toBe('PERSON_NAME');
    expect(objects[1].typeName).toBe('CUSTOMER_ID');
  });

  it('should throw for unknown customer', async () => {
    const args = { name: 'Unknown' };
    await expect(lookupCustomer.execute(args)).rejects.toThrow("Customer 'Unknown' not found.");
  });

  it('should validate args schema', () => {
    expect(lookupCustomer.argsSchema.safeParse({ name: 'John' }).success).toBe(true);
    expect(lookupCustomer.argsSchema.safeParse({ name: '' }).success).toBe(false);
  });
});

describe('Tool: get_phone_number', () => {
  it('should find a phone number by customer ID', async () => {
    const args = { customerId: 'cust_1' };
    const result = await getPhoneNumber.execute(args);
    expect(result.phoneNumber).toBe('+15551234567');

    const objects = getPhoneNumber.materializeObjects?.(result, args);
    if (!objects) {
      throw new Error('get_phone_number should materialize objects');
    }
    expect(objects).toHaveLength(1);
    expect(objects[0].typeName).toBe('PHONE_NUMBER');
  });

  it('should validate args schema', () => {
    expect(getPhoneNumber.argsSchema.safeParse({ customerId: 'cust_1' }).success).toBe(true);
    expect(getPhoneNumber.argsSchema.safeParse({}).success).toBe(false);
  });
});

describe('Tool: send_text', () => {
  it('should mock sending a text', async () => {
    const args = { phoneNumber: '+15551234567', message: 'Hello' };
    const result = await sendText.execute(args);
    expect(result.messageId).toBeDefined();

    const objects = sendText.materializeObjects?.(result, args);
    if (!objects) {
      throw new Error('send_text should materialize objects');
    }
    expect(objects).toHaveLength(1);
    expect(objects[0].typeName).toBe('TEXT_MESSAGE_ID');
  });

  it('should validate args schema', () => {
    expect(sendText.argsSchema.safeParse({ phoneNumber: 'any string', message: 'Hello' }).success).toBe(true);
    expect(sendText.argsSchema.safeParse({ phoneNumber: '+1555', message: '' }).success).toBe(false);
  });
});
