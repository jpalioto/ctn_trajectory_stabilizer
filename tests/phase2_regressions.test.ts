import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as diagnosticsModule from '../src/engine/diagnostics.js';
import { transitions } from '../src/engine/controlFlow.js';
import { StabilizingExecutor } from '../src/engine/executor.js';
import { ObjectStore } from '../src/store/objectStore.js';
import { toolRegistry } from '../src/tools/registry.js';
import { RuntimeToolSpec } from '../src/types/tools.js';
import { resetIds } from '../src/utils/ids.js';

describe('Phase 2 regressions', () => {
  beforeEach(() => {
    resetIds();
    vi.restoreAllMocks();
  });

  const buildExecutorWithOverride = (
    toolName: string,
    override: Partial<RuntimeToolSpec>,
  ) => {
    const store = new ObjectStore();
    const tool = toolRegistry.get(toolName);
    expect(tool).toBeDefined();
    if (!tool) {
      throw new Error(`Expected tool '${toolName}' to exist`);
    }

    const registry = new Map<string, RuntimeToolSpec>(toolRegistry);
    registry.set(toolName, {
      ...tool,
      ...override,
    });

    return {
      store,
      executor: new StabilizingExecutor(registry, transitions, store),
    };
  };

  it('uses the centralized renderer for invalid transitions and does not execute the blocked tool', async () => {
    const renderSpy = vi.spyOn(diagnosticsModule, 'renderStabilizingError');
    const executeSpy = vi.fn(async () => ({ messageId: 'ignored' }));
    const { executor } = buildExecutorWithOverride('send_text', {
      execute: executeSpy,
    });

    const result = await executor.executeStep('START', {
      toolName: 'send_text',
      args: { phoneNumber: '+15551234567', message: 'Hello' },
    });

    expect(result.ok).toBe(false);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(executeSpy).not.toHaveBeenCalled();
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TRANSITION');
    }
  });

  it('uses the centralized renderer for schema failures and does not execute the blocked tool', async () => {
    const renderSpy = vi.spyOn(diagnosticsModule, 'renderStabilizingError');
    const executeSpy = vi.fn(async (_args: Record<string, unknown>) => ({
      customerId: 'cust_1',
      matchedName: 'John Smith',
    }));
    const { executor } = buildExecutorWithOverride('lookup_customer', {
      execute: executeSpy,
    });

    const result = await executor.executeStep('START', {
      toolName: 'lookup_customer',
      args: { name: '' },
    });

    expect(result.ok).toBe(false);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(executeSpy).not.toHaveBeenCalled();
    if (!result.ok) {
      expect(result.error.code).toBe('SCHEMA_VALIDATION_FAILED');
    }
  });

  it('uses the centralized renderer for semantic failures and does not execute the blocked tool', async () => {
    const renderSpy = vi.spyOn(diagnosticsModule, 'renderStabilizingError');
    const executeSpy = vi.fn(async (_args: Record<string, unknown>) => ({
      messageId: 'ignored',
    }));
    const { executor } = buildExecutorWithOverride('send_text', {
      execute: executeSpy,
    });

    const result = await executor.executeStep('PHONE_RESOLVED', {
      toolName: 'send_text',
      args: { phoneNumber: 'John Smith', message: 'Hello' },
    });

    expect(result.ok).toBe(false);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(executeSpy).not.toHaveBeenCalled();
    if (!result.ok) {
      expect(result.error.code).toBe('SEMANTIC_TYPE_MISMATCH');
      expect(result.error.observed).toBe('PERSON_NAME');
    }
  });

  it('uses the centralized renderer for provenance failures and does not execute the blocked tool', async () => {
    const renderSpy = vi.spyOn(diagnosticsModule, 'renderStabilizingError');
    const executeSpy = vi.fn(async (_args: Record<string, unknown>) => ({
      messageId: 'ignored',
    }));
    const { executor } = buildExecutorWithOverride('send_text', {
      execute: executeSpy,
    });

    const result = await executor.executeStep('PHONE_RESOLVED', {
      toolName: 'send_text',
      args: { phoneNumber: '+15559998888', message: 'Hello' },
    });

    expect(result.ok).toBe(false);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(executeSpy).not.toHaveBeenCalled();
    if (!result.ok) {
      expect(result.error.code).toBe('UNGROUNDED_INPUT');
      expect(result.error.message).toContain('not grounded in previous tool outputs');
    }
  });

  it('keeps runtime failures on non-semantic codes', async () => {
    const executeSpy = vi.fn(async (_args: Record<string, unknown>) => {
      throw new Error('unexpected failure');
    });
    const { executor } = buildExecutorWithOverride('lookup_customer', {
      execute: executeSpy,
    });

    const result = await executor.executeStep('START', {
      toolName: 'lookup_customer',
      args: { name: 'John Smith' },
    });

    expect(executeSpy).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('TOOL_EXECUTION_FAILED');
      expect(result.error.code).not.toBe('SEMANTIC_TYPE_MISMATCH');
    }
  });

  it('keeps result schema failures on RESULT_SCHEMA_VALIDATION_FAILED', async () => {
    const executeSpy = vi.fn(async (_args: Record<string, unknown>) => ({
      matchedName: 'John Smith',
    }));
    const { executor } = buildExecutorWithOverride('lookup_customer', {
      execute: executeSpy,
    });

    const result = await executor.executeStep('START', {
      toolName: 'lookup_customer',
      args: { name: 'John Smith' },
    });

    expect(executeSpy).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('RESULT_SCHEMA_VALIDATION_FAILED');
      expect(result.error.code).not.toBe('SEMANTIC_TYPE_MISMATCH');
    }
  });
});
