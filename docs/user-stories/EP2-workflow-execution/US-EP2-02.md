# Story: View current node status and timeline

- **Epic**: EP2 — Workflow Execution & Monitoring
- **Persona**: Operations Analyst
- **Priority**: P0
- **Status**: Implemented

## Context

During execution, operators rely on an updated view of the active node, pending actions, and historical events. The console should show where the workflow is, what happened, and what’s next.

## User Story

As an operations analyst, I want to view the current node status and timeline so that I can understand workflow progress and troubleshoot issues in real time.

## Acceptance Criteria

```
Given I open the WorkflowExecutionView for a running workflow
When the workflow is active
Then the view displays run status, current node ID, execution context (variables), and a log of execution events

Given a workflow run is executing
When events are published (workflow-started, node-entered, action-executed, workflow-completed, etc.)
Then the execution view receives real-time updates via IPC subscriptions and displays them in the log

Given I view the execution console
When events occur
Then each event shows timestamp, type, formatted message, and payload data

Given I access run details via CLI
When I run `workflow run runs show <runId>`
Then I see run status, start/completion times, current node, error (if any), and all events with timestamps

Given the execution view is open
When new events arrive
Then the log automatically scrolls to show the latest entries
```

## UX References

- `docs/ux/narratives/execution-console.md`
- `docs/ux/wireframes/execution-console.md`

## Technical Notes

- Timeline events should be structured data with IDs, timestamps, severity.
- Live updates via IPC/subscriptions; console should degrade gracefully if offline (pause updates, show stale notice).
- CLI shares same event feed.
- Open questions: do we offer filtering on timeline (actions only, validators only)?
