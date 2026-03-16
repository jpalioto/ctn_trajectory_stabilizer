# CTN Trajectory Stabilizer

A minimal TypeScript demonstrator for constraining LLM tool-calling with explicit control-flow, typed dataflow, and semantic blocking errors.

## Core Concepts

### Stabilization vs. Isolation
Unlike basic tool isolation which only focuses on "safe" execution, **stabilization** constrains the *trajectories* of LLM actions to prevent drift into invalid states or logical inconsistencies.

### 1. Control-Flow Stabilization
Enforces an explicit Deterministic Finite Automaton (DFA) over the tool chain:
`START` -> `lookup_customer` -> `get_phone_number` -> `send_text` -> `DONE`.

### 2. Semantic Validation
Blocks inputs that match the correct *syntax* (e.g., `string`) but the wrong *semantic class*. 
**Example**: Blocks `send_text` if `phoneNumber` resembles a `PERSON_NAME` ("John Smith").

### 3. Provenance Validation
Ensures tool inputs are grounded in previous outputs.
**Example**: `send_text` requires a `PHONE_NUMBER` produced specifically by `get_phone_number`.

## Usage

### Install
```bash
npm install
```

### Run Tests
```bash
npm test
```

### Run Demo
```bash
npm run demo
```

## Demo Scenarios
The demo script (`src/demo/scenario.ts`) showcases:
1. **Invalid Transition**: Attempting to send a text before identifying a customer.
2. **Semantic Mismatch**: Attempting to send a text to a person's name instead of their phone number.
3. **Repaired Chain**: A full valid sequence reaching the `DONE` state.
