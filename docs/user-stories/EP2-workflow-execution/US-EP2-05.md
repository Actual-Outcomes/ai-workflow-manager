# Story: Pause and resume workflow run

- **Epic**: EP2 — Workflow Execution & Monitoring
- **Persona**: Operations Analyst
- **Priority**: P0
- **Status**: Implemented

## Context

Operators must safely pause long-running workflows (e.g., awaiting approvals) and resume later. Pause should snapshot state, quiesce connectors, and surface consequences before action.

## User Story

As an operations analyst, I want to pause and resume workflow runs so that I can temporarily halt execution during reviews or outages.

## Acceptance Criteria

```
Given a workflow run is active
When I call pauseRun via WorkflowExecutionService or CLI `workflow run runs pause <runId>`
Then the run status is updated to "paused" and pause events are published

Given a run is paused
When I view the run via CLI `workflow run runs show <runId>`
Then the status shows "paused" and the run can be resumed

Given I resume a paused run
When I call resumeRun via WorkflowExecutionService or CLI `workflow run runs resume <runId> <draftId>`
Then the run status is updated to "running" and execution continues from the current node

Given I pause or resume a run
When the operation completes
Then workflow events are published (workflow-paused, workflow-resumed) and the execution view updates in real-time
```

## UX References

- `docs/ux/narratives/execution-console.md`
- `docs/ux/wireframes/execution-console.md`

## Technical Notes

- Backend must snapshot state to allow safe resume; connectors should support pause hooks.
- CLI parity: `aiwm runs pause <runId> --reason`.
- Need guardrails for max pause duration; optionally auto-resume or expire runs.
- Open questions: Should we allow scheduled resumes?
