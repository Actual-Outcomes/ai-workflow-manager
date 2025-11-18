# Story: Launch workflow run from dashboard

- **Epic**: EP2 — Workflow Execution & Monitoring
- **Persona**: Operations Analyst
- **Priority**: P0
- **Status**: Implemented

## Context

Operators initiate most runs directly from the dashboard cards. The experience should confirm configuration (version, credentials, documents) and provide immediate feedback (run ID, progress).

## User Story

As an operations analyst, I want to launch a workflow run from the dashboard so that I can start executions quickly without opening the designer.

## Acceptance Criteria

```
Given I have a workflow draft
When I execute it via WorkflowExecutionService
Then a workflow run is created with initial variables and execution starts asynchronously

Given I execute a workflow via CLI
When I run `workflow run start <draftId> <workflowId> --var key=value`
Then the workflow execution starts and returns a run ID

Given a workflow run starts
When execution begins
Then a run record is created in the database with status "running" and events are published

Given a workflow execution fails
When an error occurs during execution
Then the run status is updated to "failed" with an error message and failure events are published
```

## UX References

- `docs/ux/narratives/dashboard.md`
- `docs/ux/narratives/execution-console.md`

## Technical Notes

- Modal should call backend run service; handle optimistic updates on card.
- Provide API for templated run parameter forms.
- CLI hint includes `--version`, `--connector`, `--doc` flags as applicable.
- Open questions: Do we support scheduling directly from the modal?
