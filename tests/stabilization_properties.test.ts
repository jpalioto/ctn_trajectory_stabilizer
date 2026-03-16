import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StabilizingExecutor } from '../src/engine/executor.js';
import { toolRegistry } from '../src/tools/registry.js';
import { transitions } from '../src/engine/controlFlow.js';
import { ObjectStore } from '../src/store/objectStore.js';
import { RuntimeToolSpec } from '../src/types/tools.js';
import { resetIds } from '../src/utils/ids.js';

describe('Core Stabilization Properties Verification', () => {
  let store: ObjectStore;
  let executor: StabilizingExecutor;

  beforeEach(() => {
    resetIds();
    store = new ObjectStore();
    executor = new StabilizingExecutor(toolRegistry, transitions, store);
  });

  const buildExecutorWithSpy = () => {
    const sendTextTool = toolRegistry.get('send_text');
    expect(sendTextTool).toBeDefined();
    if (!sendTextTool) {
      throw new Error('send_text tool must exist for stabilization tests');
    }

    const executeSpy = vi.fn(sendTextTool.execute);
    const spyRegistry = new Map<string, RuntimeToolSpec>(toolRegistry);
    spyRegistry.set('send_text', {
      ...sendTextTool,
      execute: executeSpy,
    });

    return {
      executeSpy,
      executor: new StabilizingExecutor(spyRegistry, transitions, store),
    };
  };

  it('1. Should fail with SEMANTIC_TYPE_MISMATCH (not schema failure) when PERSON_NAME is provided as phoneNumber', async () => {
    // We use PHONE_RESOLVED state to bypass transition checks and trigger semantic validation
    const result = await executor.executeStep('PHONE_RESOLVED', {
      toolName: 'send_text',
      args: { phoneNumber: 'John Smith', message: 'Hello' }
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('SEMANTIC_TYPE_MISMATCH');
      expect(result.error.observed).toBe('PERSON_NAME');
      expect(result.error.message).toContain("received probable PERSON_NAME ('John Smith')");
    }
  });

  it('2. Should fail with INVALID_TRANSITION when calling send_text from START', async () => {
    const { executor: instrumentedExecutor, executeSpy } = buildExecutorWithSpy();
    const result = await instrumentedExecutor.executeStep('START', {
      toolName: 'send_text',
      args: { phoneNumber: '+15551234567', message: 'Hello' }
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TRANSITION');
      expect(result.error.currentState).toBe('START');
      expect(result.error.allowedNextTools).toEqual(['lookup_customer']);
    }
    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('3. Should fail provenance for valid-looking literal phone numbers not produced by get_phone_number', async () => {
    const { executor: instrumentedExecutor, executeSpy } = buildExecutorWithSpy();
    const result = await instrumentedExecutor.executeStep('PHONE_RESOLVED', {
      toolName: 'send_text',
      args: { phoneNumber: '+15559998888', message: 'Hello' }
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('UNGROUNDED_INPUT');
      expect(result.error.message).toContain("is not grounded in previous tool outputs");
    }
    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('4. Should return structured StepResult errors instead of throwing for validation failures', async () => {
    // Tool doesn't exist
    const result = await executor.executeStep('START', {
      toolName: 'non_existent_tool',
      args: {}
    });

    expect(result.ok).toBe(false);
    expect(result).toHaveProperty('error');
    if (!result.ok) {
      expect(typeof result.error.message).toBe('string');
    }
  });

  it('5. Should follow the strict validation order (Transition check before Semantic check)', async () => {
    const { executor: instrumentedExecutor, executeSpy } = buildExecutorWithSpy();
    // If we call send_text from START with a PERSON_NAME, it should fail with INVALID_TRANSITION (step 2),
    // not SEMANTIC_TYPE_MISMATCH (step 4).
    const result = await instrumentedExecutor.executeStep('START', {
      toolName: 'send_text',
      args: { phoneNumber: 'John Smith', message: 'Hello' }
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TRANSITION');
    }
    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('6. Should not execute send_text when semantic validation fails', async () => {
    const { executor: instrumentedExecutor, executeSpy } = buildExecutorWithSpy();
    const result = await instrumentedExecutor.executeStep('PHONE_RESOLVED', {
      toolName: 'send_text',
      args: { phoneNumber: 'John Smith', message: 'Hello' }
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('SEMANTIC_TYPE_MISMATCH');
    }
    expect(executeSpy).not.toHaveBeenCalled();
  });
});
