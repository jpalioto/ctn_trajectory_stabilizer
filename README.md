# CTN Trajectory Stabilizer

A small TypeScript demonstrator for constraining LLM tool-calling with explicit control flow, typed dataflow, and fail-fast rejection paths.

## What Phase 1 Added

Phase 1 stabilizes execution with ordered runtime validation:
1. tool exists
2. transition is allowed from the current state
3. input schema parses
4. semantic validation passes
5. provenance validation passes
6. tool executes
7. result schema parses

This order is intentional and fail-fast. Blocked steps do not execute tools, and later checks never mask earlier failures.

## What Phase 2 Added

Phase 2 moves error assembly behind a typed diagnostic layer:
- rejection paths first produce structured failure context
- a centralized renderer converts that context into the outward-facing `StabilizingError`
- runtime failures keep runtime-specific codes such as `TOOL_EXECUTION_FAILED` and `RESULT_SCHEMA_VALIDATION_FAILED`

This keeps rejection handling consistent without changing the DFA, validation order, or runtime semantics.

## Runtime vs Compile Time

Runtime stabilization still does the real enforcement. Even if a caller has type information, runtime validation is required because proposals and tool outputs are dynamic.

Compile-time help is lightweight and optional. [`src/types/traversal.ts`](./src/types/traversal.ts) exposes an explicit state-to-next-tool mapping so a framework user can ask for legal continuations from a known state and get narrowed tool names in TypeScript.

## Core Flow

The demonstrator enforces a simple DFA:
`START` -> `lookup_customer` -> `get_phone_number` -> `send_text` -> `DONE`

It also blocks:
- semantic mismatches such as passing a probable `PERSON_NAME` where `PHONE_NUMBER` is expected
- provenance mismatches such as using a valid-looking phone number that was not produced by `get_phone_number`

## Usage

```bash
npm install
npm test
npm run demo
```

The demo in [`src/demo/scenario.ts`](./src/demo/scenario.ts) shows an invalid transition, a semantic mismatch, and a repaired valid chain.
