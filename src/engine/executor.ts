import { State } from '../types/core.js';
import { Transition } from '../types/transitions.js';
import { ToolExecutionError } from '../types/errors.js';
import { StabilizationDiagnostic } from '../types/diagnostics.js';
import { MaterializationContext } from '../types/tools.js';
import { RuntimeToolSpec, ToolCallProposal, StepResult } from '../types/tools.js';
import { ObjectStore } from '../store/objectStore.js';
import { allowedNextTools, nextStateFor } from './controlFlow.js';
import { renderStabilizingError } from './diagnostics.js';
import { validateSemantics } from './semanticValidation.js';
import { validateProvenance } from './provenance.js';

export class StabilizingExecutor {
  constructor(
    private readonly tools: Map<string, RuntimeToolSpec>,
    private readonly transitions: Transition[],
    private readonly objectStore: ObjectStore
  ) {}

  private buildContext(state: State, attemptedTool: string) {
    return {
      currentState: state,
      attemptedTool,
      allowedNextTools: allowedNextTools(state, this.transitions),
    };
  }

  private fail(diagnostic: StabilizationDiagnostic): StepResult {
    return {
      ok: false,
      error: renderStabilizingError(diagnostic),
    };
  }

  private buildMaterializationContext(
    tool: RuntimeToolSpec,
    args: Record<string, unknown>,
  ): MaterializationContext {
    const sourceObjectIdsByField: Record<string, string[]> = {};

    for (const rule of tool.provenanceRules ?? []) {
      const value = args[rule.field];
      if (value === undefined || value === null) {
        sourceObjectIdsByField[rule.field] = [];
        continue;
      }

      const matchedObject = this.objectStore
        .findByValue(rule.requiredType, value)
        .find((object) => object.producedBy === rule.requiredProducer);

      sourceObjectIdsByField[rule.field] = matchedObject
        ? [matchedObject.objectId]
        : [];
    }

    return {
      objectStore: this.objectStore,
      sourceObjectIdsByField,
    };
  }

  async executeStep(state: State, proposal: ToolCallProposal): Promise<StepResult> {
    const tool = this.tools.get(proposal.toolName);
    const context = this.buildContext(state, proposal.toolName);

    // 1. Tool exists
    if (!tool) {
      return this.fail({
        kind: 'transition',
        code: 'INVALID_TRANSITION',
        message: `Unknown tool '${proposal.toolName}'`,
        context,
      });
    }

    // 2. Transition allowed from current state
    const nextState = nextStateFor(state, proposal.toolName, this.transitions);
    if (!nextState) {
      return this.fail({
        kind: 'transition',
        code: 'INVALID_TRANSITION',
        message: `Tool '${proposal.toolName}' is not allowed from state '${state}'`,
        context,
        repairHint: `Choose one of the allowed next tools: ${context.allowedNextTools.join(', ')}`,
      });
    }

    // 3. Zod arg schema valid
    const parsed = tool.argsSchema.safeParse(proposal.args);
    if (!parsed.success) {
      const schemaIssues = parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      return this.fail({
        kind: 'schema',
        code: 'SCHEMA_VALIDATION_FAILED',
        message: schemaIssues.map((issue) => `${issue.path}: ${issue.message}`).join('; '),
        context,
        schemaIssues,
      });
    }

    // 4. Semantic validators pass
    const semanticIssues = validateSemantics(tool, parsed.data, this.objectStore, state);
    if (semanticIssues.length > 0) {
      const issue = semanticIssues[0];
      return this.fail({
        kind: 'semantic',
        code: issue.code,
        message: issue.message,
        context,
        semanticIssues,
        repairHint: issue.repairHint,
      });
    }

    // 5. Provenance rules pass
    const provenanceDiagnostic = validateProvenance(
      tool,
      parsed.data,
      this.objectStore,
      state,
      this.transitions,
    );
    if (provenanceDiagnostic) {
      return this.fail(provenanceDiagnostic);
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

      return this.fail({
        kind: 'execution',
        code: executionError.code,
        message: executionError.message,
        context,
      });
    }

    const parsedResult = tool.resultSchema.safeParse(rawResult);
    if (!parsedResult.success) {
      const schemaIssues = parsedResult.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      return this.fail({
        kind: 'schema',
        code: 'RESULT_SCHEMA_VALIDATION_FAILED',
        message: schemaIssues
          .map((issue) => `${issue.path}: ${issue.message}`)
          .join('; '),
        context,
        schemaIssues,
      });
    }

    // 7. Materialize and persist typed objects
    const materializationContext = this.buildMaterializationContext(tool, parsed.data);
    const newObjects = tool.materializeObjects?.(
      parsedResult.data,
      parsed.data,
      materializationContext,
    ) ?? [];
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
