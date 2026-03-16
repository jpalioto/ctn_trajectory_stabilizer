import { RuntimeToolSpec } from '../types/tools.js';
import { ObjectStore } from '../store/objectStore.js';
import { State } from '../types/core.js';
import { Transition } from '../types/transitions.js';
import { StabilizingError } from '../types/errors.js';
import { allowedNextTools } from './controlFlow.js';

export function validateProvenance(
  tool: RuntimeToolSpec,
  args: Record<string, unknown>,
  objectStore: ObjectStore,
  state: State,
  transitions: Transition[]
): StabilizingError | null {
  if (!tool.provenanceRules) return null;

  for (const rule of tool.provenanceRules) {
    const value = args[rule.field];
    if (value === undefined || value === null) continue;

    const objects = objectStore.findByValue(rule.requiredType, value);
    
    if (objects.length === 0) {
      return {
        code: 'UNGROUNDED_INPUT',
        message: `Field '${rule.field}' with value '${value}' is not grounded in previous tool outputs.`,
        currentState: state,
        attemptedTool: tool.name,
        allowedNextTools: allowedNextTools(state, transitions),
        field: rule.field,
        repairHint: `Ensure the value for '${rule.field}' was returned by a preceding tool.`,
      };
    }

    const correctProducer = objects.some(obj => obj.producedBy === rule.requiredProducer);
    
    if (!correctProducer) {
      return {
        code: 'PROVENANCE_MISMATCH',
        message: `Field '${rule.field}' has correct type but was not produced by '${rule.requiredProducer}'.`,
        currentState: state,
        attemptedTool: tool.name,
        allowedNextTools: allowedNextTools(state, transitions),
        field: rule.field,
        expectedFrom: rule.requiredProducer,
        repairHint: `Use the output from '${rule.requiredProducer}' for the '${rule.field}' field.`,
      };
    }
  }

  return null;
}
