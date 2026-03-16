import { State } from './core.js';

export interface Transition {
  from: State;
  toolName: string;
  to: State;
}
