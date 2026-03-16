import { describe, expect, it } from 'vitest';
import { legalNextToolsFor, stateToNextTools } from '../src/types/traversal.js';

describe('Traversal aid', () => {
  it('exposes the expected explicit state-to-next-tool mapping', () => {
    expect(stateToNextTools).toEqual({
      START: ['lookup_customer'],
      CUSTOMER_IDENTIFIED: ['get_phone_number'],
      PHONE_RESOLVED: ['send_text'],
      DONE: [],
    });
  });

  it('returns legal next tools for a given state', () => {
    expect(legalNextToolsFor('START')).toEqual(['lookup_customer']);
    expect(legalNextToolsFor('DONE')).toEqual([]);
  });
});
