import { State } from './core.js';

export type ErrorCode =
  | 'INVALID_TRANSITION'
  | 'SCHEMA_VALIDATION_FAILED'
  | 'RESULT_SCHEMA_VALIDATION_FAILED'
  | 'MISSING_REQUIRED_FIELD'
  | 'TYPE_MISMATCH'
  | 'SEMANTIC_TYPE_MISMATCH'
  | 'ENTITY_CLASS_MISMATCH'
  | 'PROVENANCE_MISMATCH'
  | 'UNGROUNDED_INPUT'
  | 'CUSTOMER_NOT_FOUND'
  | 'PHONE_NUMBER_NOT_AVAILABLE'
  | 'TOOL_EXECUTION_FAILED';

export class ToolExecutionError extends Error {
  constructor(
    public readonly code:
      | 'CUSTOMER_NOT_FOUND'
      | 'PHONE_NUMBER_NOT_AVAILABLE'
      | 'TOOL_EXECUTION_FAILED',
    message: string,
  ) {
    super(message);
    this.name = 'ToolExecutionError';
  }
}

export interface StabilizingError {
  code: ErrorCode;
  message: string;
  currentState: State;
  attemptedTool: string;
  allowedNextTools?: string[];
  field?: string;
  expected?: string;
  observed?: string;
  expectedFrom?: string;
  repairHint?: string;
  suggestedRepair?: Array<{
    tool: string;
    argsHint?: Record<string, unknown>;
    argsFromResultOf?: string;
  }>;
}
