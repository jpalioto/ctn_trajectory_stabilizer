import { State } from '../types/core.js';
import { Transition } from '../types/transitions.js';
import { ToolExecutionError } from '../types/errors.js';
import { RuntimeToolSpec, ToolCallProposal, StepResult } from '../types/tools.js';
import { ObjectStore } from '../store/objectStore.js';
import { allowedNextTools, nextStateFor } from './controlFlow.js';
import { validateSemantics } from './semanticValidation.js';
import { validateProvenance } from './provenance.js';

export class StabilizingExecutor {
  constructor(
    private readonly tools: Map<string, RuntimeToolSpec>,
    private readonly transitions: Transition[],
    private readonly objectStore: ObjectStore
  ) {}

  async executeStep(state: State, proposal: ToolCallProposal): Promise<StepResult> {
    const tool = this.tools.get(proposal.toolName);

    // 1. Tool exists
    if (!tool) {
      return {
        ok: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Unknown tool '${proposal.toolName}'`,
          currentState: state,
          attemptedTool: proposal.toolName,
          allowedNextTools: allowedNextTools(state, this.transitions),
        },
      };
    }

    // 2. Transition allowed from current state
    const nextState = nextStateFor(state, proposal.toolName, this.transitions);
    if (!nextState) {
      return {
        ok: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Tool '${proposal.toolName}' is not allowed from state '${state}'`,
          currentState: state,
          attemptedTool: proposal.toolName,
          allowedNextTools: allowedNextTools(state, this.transitions),
          repairHint: `Choose one of the allowed next tools: ${allowedNextTools(state, this.transitions).join(', ')}`,
        },
      };
    }

    // 3. Zod arg schema valid
    const parsed = tool.argsSchema.safeParse(proposal.args);
    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: 'SCHEMA_VALIDATION_FAILED',
          message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
          currentState: state,
          attemptedTool: proposal.toolName,
          allowedNextTools: allowedNextTools(state, this.transitions),
        },
      };
    }

    // 4. Semantic validators pass
    const semanticIssues = validateSemantics(tool, parsed.data, this.objectStore, state);
    if (semanticIssues.length > 0) {
      const issue = semanticIssues[0];
      return {
        ok: false,
        error: {
          code: issue.code,
          message: issue.message,
          currentState: state,
          attemptedTool: proposal.toolName,
          allowedNextTools: allowedNextTools(state, this.transitions),
          field: issue.field,
          expected: issue.expected,
          observed: issue.observed,
          repairHint: issue.repairHint,
        },
      };
    }

    // 5. Provenance rules pass
    const provError = validateProvenance(tool, parsed.data, this.objectStore, state, this.transitions);
    if (provError) {
      return { ok: false, error: provError };
    }

    let rawResult: unknown;
    try {
      // 6. Execute tool
      rawResult = await tool.execute(parsed.data);
    } catch (error: unknown) {
      const executionError = error instanceof ToolExecutionError
        ? error
        : new ToolExecutionError(
            'TOOL_EXECUTION_FAILED',
            error instanceof Error ? error.message : 'Tool execution failed',
          );

      return {
        ok: false,
        error: {
          code: executionError.code,
          message: executionError.message,
          currentState: state,
          attemptedTool: proposal.toolName,
          allowedNextTools: allowedNextTools(state, this.transitions),
        },
      };
    }

    const parsedResult = tool.resultSchema.safeParse(rawResult);
    if (!parsedResult.success) {
      return {
        ok: false,
        error: {
          code: 'RESULT_SCHEMA_VALIDATION_FAILED',
          message: parsedResult.error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('; '),
          currentState: state,
          attemptedTool: proposal.toolName,
          allowedNextTools: allowedNextTools(state, this.transitions),
        },
      };
    }

    // 7. Materialize and persist typed objects
    const newObjects = tool.materializeObjects?.(parsedResult.data, parsed.data) ?? [];
    this.objectStore.addMany(newObjects);

    // 8. Advance state
    return {
      ok: true,
      nextState,
      toolName: proposal.toolName,
      rawResult: parsedResult.data,
      newObjects,
    };
  }
}
