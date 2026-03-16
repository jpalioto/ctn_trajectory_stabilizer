import { describe, it, expect } from 'vitest';
import { sendText } from '../src/tools/sendText.js';
import { ObjectStore } from '../src/store/objectStore.js';
import { validateProvenance } from '../src/engine/provenance.js';
import { transitions } from '../src/engine/controlFlow.js';

const FIXED_CREATED_AT = '2024-01-01T00:00:00.000Z';

describe('Provenance Validation', () => {
  it('should fail for ungrounded literal phone number', () => {
    const store = new ObjectStore();
    const args = { phoneNumber: '+15551234567', message: 'Hello' };
    
    const diagnostic = validateProvenance(sendText, args, store, 'PHONE_RESOLVED', transitions);
    
    expect(diagnostic).not.toBeNull();
    expect(diagnostic?.code).toBe('UNGROUNDED_INPUT');
    expect(diagnostic?.kind).toBe('provenance');
    expect(diagnostic?.provenanceIssues[0]?.field).toBe('phoneNumber');
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
      createdAt: FIXED_CREATED_AT
    });
    
    const args = { phoneNumber, message: 'Hello' };
    const diagnostic = validateProvenance(sendText, args, store, 'PHONE_RESOLVED', transitions);
    
    expect(diagnostic).toBeNull();
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
      createdAt: FIXED_CREATED_AT
    });
    
    const args = { phoneNumber, message: 'Hello' };
    const diagnostic = validateProvenance(sendText, args, store, 'PHONE_RESOLVED', transitions);
    
    expect(diagnostic).not.toBeNull();
    expect(diagnostic?.code).toBe('PROVENANCE_MISMATCH');
    expect(diagnostic?.kind).toBe('provenance');
    expect(diagnostic?.provenanceIssues[0]?.requiredProducer).toBe('get_phone_number');
  });
});
