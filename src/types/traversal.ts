import { State } from './core.js';

export const stateToNextTools = {
  START: ['lookup_customer'],
  CUSTOMER_IDENTIFIED: ['get_phone_number'],
  PHONE_RESOLVED: ['send_text'],
  DONE: [],
} as const satisfies Record<State, readonly string[]>;

export type StateToNextTools = typeof stateToNextTools;
export type TraversalState = keyof StateToNextTools;
export type NextToolFor<TState extends TraversalState> =
  StateToNextTools[TState][number];

export const legalNextToolsFor = <TState extends TraversalState>(
  state: TState,
): readonly NextToolFor<TState>[] => stateToNextTools[state];
