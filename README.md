# CTN Trajectory Stabilizer

A small TypeScript demonstrator for **trajectory stabilization** in tool-calling systems.

It shows how to constrain a simple business-process workflow with:

- explicit DFA-based control-flow ordering
- ordered, fail-fast runtime validation
- semantic validation distinct from schema validation
- value-based provenance checks on selected intermediate values
- structured diagnostics with centralized rendering
- modest compile-time traversal typing that improves ergonomics without replacing runtime enforcement

## What it demonstrates

This repo demonstrates a constrained tool-calling pipeline:

1. `lookup_customer`
2. `get_phone_number`
3. `send_text`

The executor validates each proposed step in a fixed order:

1. tool exists
2. transition allowed from current state
3. schema valid
4. semantic validation
5. provenance validation
6. execute tool
7. persist typed outputs
8. advance state

Invalid steps fail fast and do **not** execute tools.

## What Phase 1 established

Phase 1 built the minimal stabilizer:

- DFA-constrained step ordering
- semantic blocking for cases like passing a name where a phone number is expected
- provenance blocking for ungrounded terminal values
- structured outward `StepResult` errors

## What Phase 2 added

Phase 2 tightened the demonstrator:

- structured internal diagnostics
- centralized rendering of stabilization errors
- more accurate runtime error taxonomy
- deterministic demo/test behavior
- modest compile-time traversal typing

## What the hardening patch improves

The hardening patch closes an important continuity gap:

- `get_phone_number.customerId` must now be grounded in a `CUSTOMER_ID` produced by `lookup_customer`
- output objects now carry simple lineage through `sourceObjectIds`

This makes the repo stronger on **object continuity across the chain**, not just step ordering.

## What this repo does **not** claim

This is still an MVP demonstrator. It does **not** yet provide:

- full chain-of-custody provenance
- trajectory-scoped object-store isolation
- object-id-based provenance instead of value-based matching
- branching/cyclic workflow stabilization
- universal semantic validation on every possible tool
- a generic workflow platform or policy engine

The current provenance model is intentionally simple:

- it is value-based
- it is local to the demonstrator
- it should not be mistaken for full lineage closure

## Why runtime validation still matters

The compile-time traversal helpers are ergonomic only. They help a framework user see legal continuations from a known state, but they do not enforce anything at runtime.

Actual enforcement happens at the executor boundary, where proposals and tool outputs are still dynamic.

## Running

Install dependencies:

```bash
npm install