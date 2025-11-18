# Story: Create workflow from blank canvas

- **Epic**: EP1 — Workflow Authoring
- **Persona**: Workflow Architect
- **Priority**: P0
- **Status**: Implemented

## Context

Workflow architects need a fast path to spin up new automations without starting from templates. The blank canvas experience should feel approachable yet powerful, guiding users to define core metadata (name, description) and providing visual affordances for the first nodes. This story ensures the foundational “create workflow” capability exists before more advanced authoring features (templates, duplication).

## User Story

As a workflow architect, I want to create a new workflow from a blank canvas so that I can start mapping a custom agentic process tailored to my team’s needs.

## Acceptance Criteria

```
Given I am on the dashboard
When I click "Create Workflow" and provide a name and description
Then a new workflow draft is created and I am taken to the visual designer canvas

Given the blank canvas is open
When no nodes exist yet
Then the UI displays a toolbar with node type buttons (Start, Action, Conditional, End) and I can click to add nodes

Given the blank workflow draft is open
When I edit the workflow name and description
Then the draft metadata is saved automatically to the database

Given I close the designer
When I return to the dashboard
Then the workflow draft appears in the list with the last edited timestamp and can be reopened

Given I have a workflow draft open
When I make changes to nodes, connections, or configurations
Then changes are auto-saved (positions after 500ms debounce, configurations immediately)
```

## UX References

- `docs/ux-flows.md#A.-Designing-a-New-Workflow` (narrative flow)
- Wireframe placeholder: `docs/ux/wireframes/designer.md` (to be added)

## Technical Notes

- Impacts modules: `renderer` (dashboard, designer), `main` (workflow draft IPC handlers), `core` (workflow draft persistence)
- Dependencies: Workflow state & persistence model (`workflows`, `workflow_drafts` tables)
- Open Questions:
  - Should the onboarding hints include interactive tooltips or static text?
  - Do we auto-create a first node stub or leave the canvas empty?
