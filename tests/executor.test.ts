import { describe, it, expect, beforeEach } from 'vitest';
import { StabilizingExecutor } from '../src/engine/executor.js';
import { toolRegistry } from '../src/tools/registry.js';
import { transitions } from '../src/engine/controlFlow.js';
import { ObjectStore } from '../src/store/objectStore.js';
import { State } from '../src/types/core.js';

describe('StabilizingExecutor End-to-End', () => {
  let store: ObjectStore;
  let executor: StabilizingExecutor;

  beforeEach(() => {
    store = new ObjectStore();
    executor = new StabilizingExecutor(toolRegistry, transitions, store);
  });

  it('should block an invalid starting transition', async () => {
    const result = await executor.executeStep('START', {
      toolName: 'send_text',
      args: { phoneNumber: '+15551234567', message: 'Hello' }
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TRANSITION');
      expect(result.error.allowedNextTools).toContain('lookup_customer');
    }
  });

  it('should succeed with a valid full chain', async () => {
    let currentState: State = 'START';

    // Step 1: lookup_customer
    const res1 = await executor.executeStep(currentState, {
      toolName: 'lookup_customer',
      args: { name: 'John Smith' }
    });
    expect(res1.ok).toBe(true);
    if (res1.ok) {
      currentState = res1.nextState;
      expect(currentState).toBe('CUSTOMER_IDENTIFIED');
      expect(store.findByType('CUSTOMER_ID')).toHaveLength(1);
    }

    // Step 2: get_phone_number
    const res2 = await executor.executeStep(currentState, {
      toolName: 'get_phone_number',
      args: { customerId: 'cust_1' }
    });
    expect(res2.ok).toBe(true);
    if (res2.ok) {
      currentState = res2.nextState;
      expect(currentState).toBe('PHONE_RESOLVED');
      expect(store.findByType('PHONE_NUMBER')).toHaveLength(1);
    }

    // Step 3: send_text
    const res3 = await executor.executeStep(currentState, {
      toolName: 'send_text',
      args: { phoneNumber: '+15551234567', message: 'Appointment confirmed' }
    });
    expect(res3.ok).toBe(true);
    if (res3.ok) {
      currentState = res3.nextState;
      expect(currentState).toBe('DONE');
    }
  });

  it('should block ungrounded inputs in a partial chain', async () => {
    // lookup_customer
    await executor.executeStep('START', {
      toolName: 'lookup_customer',
      args: { name: 'John Smith' }
    });

    // skip get_phone_number and try send_text with literal number
    const res = await executor.executeStep('CUSTOMER_IDENTIFIED', {
      toolName: 'send_text',
      args: { phoneNumber: '+15551234567', message: 'Hello' }
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      // In this case, control flow blocks it first because send_text is not allowed from CUSTOMER_IDENTIFIED
      expect(res.error.code).toBe('INVALID_TRANSITION');
      expect(res.error.allowedNextTools).toContain('get_phone_number');
    }
  });

  it('should block semantic mismatch even if control flow is correct', async () => {
    // setup store with a PERSON_NAME object to simulate state
    store.add({
      objectId: 'obj1',
      typeName: 'PERSON_NAME',
      value: 'John Smith',
      producedBy: 'lookup_customer',
      sourceObjectIds: [],
      createdAt: new Date().toISOString()
    });

    // Attempt send_text from PHONE_RESOLVED state but with a name string
    const res = await executor.executeStep('PHONE_RESOLVED', {
      toolName: 'send_text',
      args: { phoneNumber: 'John Smith', message: 'Hello' }
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe('SEMANTIC_TYPE_MISMATCH');
      expect(res.error.message).toContain('PERSON_NAME');
    }
  });
});
