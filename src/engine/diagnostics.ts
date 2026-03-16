import { StabilizingError } from '../types/errors.js';
import {
  DiagnosticContext,
  ProvenanceDiagnosticIssue,
  RepairCandidate,
  SchemaDiagnosticIssue,
  SemanticDiagnosticIssue,
  StabilizationDiagnostic,
} from '../types/diagnostics.js';

const formatSchemaIssues = (issues: SchemaDiagnosticIssue[]): string =>
  issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ');

const formatProvenanceMessage = (issue: ProvenanceDiagnosticIssue): string =>
  issue.kind === 'UNGROUNDED_INPUT'
    ? `Field '${issue.field}' with value '${String(issue.value)}' is not grounded in previous tool outputs.`
    : `Field '${issue.field}' has correct type but was not produced by '${issue.requiredProducer}'.`;

const contextError = (
  context: DiagnosticContext,
  code: StabilizationDiagnostic['code'],
  message: string,
  repairHint?: string,
  suggestedRepair?: RepairCandidate[],
): StabilizingError => ({
  code,
  message,
  currentState: context.currentState,
  attemptedTool: context.attemptedTool,
  allowedNextTools: context.allowedNextTools,
  repairHint,
  suggestedRepair,
});

export const renderStabilizingError = (
  diagnostic: StabilizationDiagnostic,
): StabilizingError => {
  if (diagnostic.kind === 'schema') {
    return {
      ...contextError(
        diagnostic.context,
        diagnostic.code,
        diagnostic.message || formatSchemaIssues(diagnostic.schemaIssues),
        diagnostic.repairHint,
        diagnostic.repairCandidates,
      ),
    };
  }

  if (diagnostic.kind === 'semantic') {
    const primaryIssue: SemanticDiagnosticIssue | undefined =
      diagnostic.semanticIssues[0];

    return {
      ...contextError(
        diagnostic.context,
        diagnostic.code,
        diagnostic.message,
        diagnostic.repairHint ?? primaryIssue?.repairHint,
        diagnostic.repairCandidates,
      ),
      field: primaryIssue?.field,
      expected: primaryIssue?.expected,
      observed: primaryIssue?.observed,
    };
  }

  if (diagnostic.kind === 'provenance') {
    const primaryIssue: ProvenanceDiagnosticIssue | undefined =
      diagnostic.provenanceIssues[0];

    return {
      ...contextError(
        diagnostic.context,
        diagnostic.code,
        diagnostic.message || (primaryIssue ? formatProvenanceMessage(primaryIssue) : ''),
        diagnostic.repairHint,
        diagnostic.repairCandidates,
      ),
      field: primaryIssue?.field,
      expectedFrom:
        primaryIssue?.kind === 'PROVENANCE_MISMATCH'
          ? primaryIssue.requiredProducer
          : undefined,
    };
  }

  return contextError(
    diagnostic.context,
    diagnostic.code,
    diagnostic.message,
    diagnostic.repairHint,
    diagnostic.repairCandidates,
  );
};
