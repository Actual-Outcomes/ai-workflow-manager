# Story: Save workflow draft and version history

- **Epic**: EP1 — Workflow Authoring
- **Persona**: Workflow Architect
- **Priority**: P1
- **Status**: Implemented

## Context

Authors need confidence that their work is saved automatically, with manual checkpoints and the ability to review or revert to earlier versions. Drafts should autosave, manual saves should capture descriptions, and publishing should increment an immutable version record.

## User Story

As a workflow architect, I want workflow drafts to autosave and maintain version history so that I can recover from crashes, compare changes, and roll back if needed.

## Acceptance Criteria

```
Given I edit a workflow draft
When I move nodes on the canvas
Then positions are auto-saved after a 500ms debounce delay

Given I edit a workflow draft
When I change node configurations (label, actions, etc.)
Then changes are auto-saved immediately

Given I publish a workflow draft
When validation passes
Then the draft is published to the workflows table and a new workflow record is created

Given I have a workflow draft
When I view it in the dashboard
Then I can see the draft status, version number, and last updated timestamp

Given I have a workflow draft
When I reopen it in the designer
Then the draft loads with all nodes, connections, positions, and configurations restored
```

## UX References

- `docs/ux/narratives/designer.md` — Save/autosave interactions
- `docs/ux/narratives/dashboard.md` — surfacing draft state on cards

## Technical Notes

- Persist drafts locally (SQLite) with conflict detection; publish pushes to `workflow_versions`.
- Version notes stored with metadata; diff uses JSON structure comparison.
- CLI commands: `aiwm workflows history <slug>`, `aiwm workflows restore <slug> --version N`.
- Open questions: retention policy for draft history; encryption for sensitive backups.
