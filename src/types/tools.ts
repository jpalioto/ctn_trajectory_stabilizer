import { z, type ZodTypeAny } from 'zod';
import { State, TypeName, TypedObject } from './core.js';
import { StabilizingError, ErrorCode } from './errors.js';
import { ObjectStore } from '../store/objectStore.js';

export interface ToolCallProposal {
  toolName: string;
  args: Record<string, unknown>;
}

export type StepResult =
  | {
      ok: true;
      nextState: State;
      toolName: string;
      rawResult: unknown;
      newObjects: TypedObject[];
    }
  | {
      ok: false;
      error: StabilizingError;
    };

export interface SemanticValidationContext {
  state: State;
  objectStore: ObjectStore;
}

export interface SemanticValidationIssue {
  code: ErrorCode;
  field: string;
  expected: string;
  observed: string;
  message: string;
  repairHint?: string;
}

export interface ProvenanceRule {
  field: string;
  requiredType: TypeName;
  requiredProducer: string;
}

export interface ToolSpec<
  TArgs extends ZodTypeAny = ZodTypeAny,
  TResult extends ZodTypeAny = ZodTypeAny,
> {
  name: string;
  argsSchema: TArgs;
  resultSchema: TResult;
  execute: (args: z.infer<TArgs>) => Promise<z.infer<TResult>> | z.infer<TResult>;
  semanticValidate?: (
    args: z.infer<TArgs>,
    ctx: SemanticValidationContext,
  ) => SemanticValidationIssue[];
  provenanceRules?: ProvenanceRule[];
  materializeObjects?: (
    result: z.infer<TResult>,
    args: z.infer<TArgs>,
  ) => TypedObject[];
}

export interface RuntimeToolSpec {
  name: string;
  argsSchema: ZodTypeAny;
  resultSchema: ZodTypeAny;
  execute: (args: Record<string, unknown>) => Promise<unknown> | unknown;
  semanticValidate?: (
    args: Record<string, unknown>,
    ctx: SemanticValidationContext,
  ) => SemanticValidationIssue[];
  provenanceRules?: ProvenanceRule[];
  materializeObjects?: (
    result: unknown,
    args: Record<string, unknown>,
  ) => TypedObject[];
}

export const toRuntimeToolSpec = <
  TArgs extends ZodTypeAny,
  TResult extends ZodTypeAny,
>(
  tool: ToolSpec<TArgs, TResult>,
): RuntimeToolSpec => ({
  name: tool.name,
  argsSchema: tool.argsSchema,
  resultSchema: tool.resultSchema,
  execute: (args) => tool.execute(args as z.infer<TArgs>),
  semanticValidate: tool.semanticValidate
    ? (args, ctx) => tool.semanticValidate?.(args as z.infer<TArgs>, ctx) ?? []
    : undefined,
  provenanceRules: tool.provenanceRules,
  materializeObjects: tool.materializeObjects
    ? (result, args) =>
        tool.materializeObjects?.(
          result as z.infer<TResult>,
          args as z.infer<TArgs>,
        ) ?? []
    : undefined,
});
