import { State, TypeName } from './core.js';
import { ErrorCode } from './errors.js';

export interface DiagnosticContext {
  currentState: State;
  attemptedTool: string;
  allowedNextTools: string[];
}

export interface SchemaDiagnosticIssue {
  path: string;
  message: string;
}

export interface SemanticDiagnosticIssue {
  code: ErrorCode;
  field: string;
  expected: string;
  observed: string;
  message: string;
  repairHint?: string;
}

export interface ProvenanceDiagnosticIssue {
  field: string;
  value: unknown;
  requiredType: TypeName;
  requiredProducer: string;
  observedProducers?: string[];
  kind: 'UNGROUNDED_INPUT' | 'PROVENANCE_MISMATCH';
}

export interface RepairCandidate {
  tool: string;
  argsHint?: Record<string, unknown>;
  argsFromResultOf?: string;
}

interface DiagnosticBase {
  code: ErrorCode;
  message: string;
  context: DiagnosticContext;
  repairHint?: string;
  repairCandidates?: RepairCandidate[];
}

export interface TransitionDiagnostic extends DiagnosticBase {
  kind: 'transition';
}

export interface SchemaDiagnostic extends DiagnosticBase {
  kind: 'schema';
  schemaIssues: SchemaDiagnosticIssue[];
}

export interface SemanticDiagnostic extends DiagnosticBase {
  kind: 'semantic';
  semanticIssues: SemanticDiagnosticIssue[];
}

export interface ProvenanceDiagnostic extends DiagnosticBase {
  kind: 'provenance';
  provenanceIssues: ProvenanceDiagnosticIssue[];
}

export interface ExecutionDiagnostic extends DiagnosticBase {
  kind: 'execution';
}

export type StabilizationDiagnostic =
  | TransitionDiagnostic
  | SchemaDiagnostic
  | SemanticDiagnostic
  | ProvenanceDiagnostic
  | ExecutionDiagnostic;
