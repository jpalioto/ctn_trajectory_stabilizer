import { RuntimeToolSpec } from '../types/tools.js';
import { ObjectStore } from '../store/objectStore.js';
import { State } from '../types/core.js';
import { Transition } from '../types/transitions.js';
import { ProvenanceDiagnostic } from '../types/diagnostics.js';
import { allowedNextTools } from './controlFlow.js';

export function validateProvenance(
  tool: RuntimeToolSpec,
  args: Record<string, unknown>,
  objectStore: ObjectStore,
  state: State,
  transitions: Transition[]
): ProvenanceDiagnostic | null {
  if (!tool.provenanceRules) return null;

  for (const rule of tool.provenanceRules) {
    const value = args[rule.field];
    if (value === undefined || value === null) continue;

    const objects = objectStore.findByValue(rule.requiredType, value);
    
    if (objects.length === 0) {
      return {
        kind: 'provenance',
        code: 'UNGROUNDED_INPUT',
        message: `Field '${rule.field}' with value '${value}' is not grounded in previous tool outputs.`,
        context: {
          currentState: state,
          attemptedTool: tool.name,
          allowedNextTools: allowedNextTools(state, transitions),
        },
        provenanceIssues: [{
          kind: 'UNGROUNDED_INPUT',
          field: rule.field,
          value,
          requiredType: rule.requiredType,
          requiredProducer: rule.requiredProducer,
        }],
        repairHint: `Ensure the value for '${rule.field}' was returned by a preceding tool.`,
      };
    }

    const correctProducer = objects.some((obj) => obj.producedBy === rule.requiredProducer);
    
    if (!correctProducer) {
      return {
        kind: 'provenance',
        code: 'PROVENANCE_MISMATCH',
        message: `Field '${rule.field}' has correct type but was not produced by '${rule.requiredProducer}'.`,
        context: {
          currentState: state,
          attemptedTool: tool.name,
          allowedNextTools: allowedNextTools(state, transitions),
        },
        provenanceIssues: [{
          kind: 'PROVENANCE_MISMATCH',
          field: rule.field,
          value,
          requiredType: rule.requiredType,
          requiredProducer: rule.requiredProducer,
          observedProducers: objects.map((obj) => obj.producedBy),
        }],
        repairHint: `Use the output from '${rule.requiredProducer}' for the '${rule.field}' field.`,
      };
    }
  }

  return null;
}
