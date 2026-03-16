import { describe, it, expect } from 'vitest';
import { transitions, allowedNextTools, nextStateFor } from '../src/engine/controlFlow.js';

describe('Control Flow', () => {
  it('should identify allowed next tools from START', () => {
    const tools = allowedNextTools('START', transitions);
    expect(tools).toEqual(['lookup_customer']);
  });

  it('should identify allowed next tools from CUSTOMER_IDENTIFIED', () => {
    const tools = allowedNextTools('CUSTOMER_IDENTIFIED', transitions);
    expect(tools).toEqual(['get_phone_number']);
  });

  it('should determine next state correctly', () => {
    expect(nextStateFor('START', 'lookup_customer', transitions)).toBe('CUSTOMER_IDENTIFIED');
    expect(nextStateFor('CUSTOMER_IDENTIFIED', 'get_phone_number', transitions)).toBe('PHONE_RESOLVED');
    expect(nextStateFor('PHONE_RESOLVED', 'send_text', transitions)).toBe('DONE');
  });

  it('should return null for invalid transitions', () => {
    expect(nextStateFor('START', 'send_text', transitions)).toBeNull();
    expect(nextStateFor('DONE', 'lookup_customer', transitions)).toBeNull();
  });
});
