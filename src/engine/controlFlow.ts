import { State } from '../types/core.js';
import { Transition } from '../types/transitions.js';

export const transitions: Transition[] = [
  { from: 'START', toolName: 'lookup_customer', to: 'CUSTOMER_IDENTIFIED' },
  { from: 'CUSTOMER_IDENTIFIED', toolName: 'get_phone_number', to: 'PHONE_RESOLVED' },
  { from: 'PHONE_RESOLVED', toolName: 'send_text', to: 'DONE' },
];

export function allowedNextTools(state: State, transitionsTable: Transition[]): string[] {
  return transitionsTable.filter((t) => t.from === state).map((t) => t.toolName);
}

export function nextStateFor(
  state: State,
  toolName: string,
  transitionsTable: Transition[],
): State | null {
  const match = transitionsTable.find((t) => t.from === state && t.toolName === toolName);
  return match?.to ?? null;
}
