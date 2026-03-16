import { RuntimeToolSpec, SemanticValidationIssue } from '../types/tools.js';
import { State } from '../types/core.js';
import { ObjectStore } from '../store/objectStore.js';

export function validateSemantics(
  tool: RuntimeToolSpec,
  args: Record<string, unknown>,
  objectStore: ObjectStore,
  state: State
): SemanticValidationIssue[] {
  if (!tool.semanticValidate) return [];
  return tool.semanticValidate(args, { state, objectStore });
}
