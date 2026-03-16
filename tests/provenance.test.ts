import { describe, it, expect } from 'vitest';
import { sendText } from '../src/tools/sendText.js';
import { ObjectStore } from '../src/store/objectStore.js';
import { validateProvenance } from '../src/engine/provenance.js';
import { transitions } from '../src/engine/controlFlow.js';

describe('Provenance Validation', () => {
  it('should fail for ungrounded literal phone number', () => {
    const store = new ObjectStore();
    const args = { phoneNumber: '+15551234567', message: 'Hello' };
    
    const error = validateProvenance(sendText, args, store, 'PHONE_RESOLVED', transitions);
    
    expect(error).not.toBeNull();
    expect(error?.code).toBe('UNGROUNDED_INPUT');
    expect(error?.field).toBe('phoneNumber');
  });

  it('should pass for grounded phone number from correct producer', () => {
    const store = new ObjectStore();
    const phoneNumber = '+15551234567';
    
    store.add({
      objectId: 'obj1',
      typeName: 'PHONE_NUMBER',
      value: phoneNumber,
      producedBy: 'get_phone_number',
      sourceObjectIds: [],
      createdAt: new Date().toISOString()
    });
    
    const args = { phoneNumber, message: 'Hello' };
    const error = validateProvenance(sendText, args, store, 'PHONE_RESOLVED', transitions);
    
    expect(error).toBeNull();
  });

  it('should fail for grounded value but wrong producer', () => {
    const store = new ObjectStore();
    const phoneNumber = '+15551234567';
    
    store.add({
      objectId: 'obj1',
      typeName: 'PHONE_NUMBER',
      value: phoneNumber,
      producedBy: 'manual_entry',
      sourceObjectIds: [],
      createdAt: new Date().toISOString()
    });
    
    const args = { phoneNumber, message: 'Hello' };
    const error = validateProvenance(sendText, args, store, 'PHONE_RESOLVED', transitions);
    
    expect(error).not.toBeNull();
    expect(error?.code).toBe('PROVENANCE_MISMATCH');
    expect(error?.expectedFrom).toBe('get_phone_number');
  });
});
