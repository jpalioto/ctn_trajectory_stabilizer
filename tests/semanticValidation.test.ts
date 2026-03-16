import { describe, it, expect } from 'vitest';
import { sendText } from '../src/tools/sendText.js';
import { ObjectStore } from '../src/store/objectStore.js';
import { validateSemantics } from '../src/engine/semanticValidation.js';

describe('Semantic Validation', () => {
  const store = new ObjectStore();

  it('should block PERSON_NAME where PHONE_NUMBER is expected', () => {
    const args = { phoneNumber: 'John Smith', message: 'Hello' };
    const issues = validateSemantics(sendText, args, store, 'PHONE_RESOLVED');
    
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe('SEMANTIC_TYPE_MISMATCH');
    expect(issues[0].observed).toBe('PERSON_NAME');
    expect(issues[0].message).toContain("received probable PERSON_NAME ('John Smith')");
  });

  it('should pass for valid-looking phone number', () => {
    const args = { phoneNumber: '+15551234567', message: 'Hello' };
    const issues = validateSemantics(sendText, args, store, 'PHONE_RESOLVED');
    
    expect(issues).toHaveLength(0);
  });

  it('should block invalid strings that are neither names nor numbers', () => {
    const args = { phoneNumber: 'not-a-number', message: 'Hello' };
    const issues = validateSemantics(sendText, args, store, 'PHONE_RESOLVED');
    
    expect(issues).toHaveLength(1);
    expect(issues[0].observed).toBe('UNKNOWN');
  });
});
