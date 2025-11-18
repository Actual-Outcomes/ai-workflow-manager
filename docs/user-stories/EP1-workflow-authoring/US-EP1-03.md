# Story: Configure node entry and exit actions

- **Epic**: EP1 — Workflow Authoring
- **Persona**: Workflow Architect
- **Priority**: P0
- **Status**: Implemented

## Context

After placing nodes and connections, architects need to describe what each node does. Entry actions capture the automated steps (e.g., run an LLM prompt, fetch external data) performed when the node activates, while exit actions define persistence or notifications fired on completion. This story ensures the designer UI and CLI expose structured forms for configuring those actions consistently.

## User Story

As a workflow architect, I want to configure entry and exit actions for each node so that the workflow runtime performs the right AI calls, document operations, and side effects when nodes start and finish.

## Acceptance Criteria

```
Given I have selected a node on the canvas
When the properties panel is open
Then I can configure entry actions from available types: LLM Chat, Generate Document, Set Variable

Given I select an Action Type (LLM Chat, Generate Document, Set Variable)
When I fill out the configuration fields
Then the configuration auto-saves immediately and the panel remains open

Given I configure an LLM Chat action
When I provide a prompt and output variable name
Then the action configuration is saved to the node's metadata

Given I configure a Generate Document action
When I provide document name, format (DOCX/PDF/Markdown), and content
Then the action configuration is saved to the node's metadata

Given I configure a Set Variable action
When I provide variable name and value
Then the action configuration is saved to the node's metadata

Given I change the Action Type of a node
When I select a different type from the dropdown
Then the properties panel remains open and a new action configuration is created for the selected type

Given I have a Conditional node selected
When I configure the condition field
Then the condition is saved to the node's metadata

Given the properties panel is open
When I make any configuration change
Then the change is auto-saved without requiring a "Save" button click
```

## UX References

- `docs/ux/narratives/designer.md` — Inspector tabs
- `docs/ux/wireframes/designer.md`

## Technical Notes

- Impacts modules: `renderer` (inspector UI), `main` (IPC handlers), `core` (node configuration schema).
- Requires action catalog metadata so UI and CLI can render dynamic forms.
- Persist action sequences within workflow JSON definition; order must be deterministic for undo/redo.
- Open questions:
  - How do we support custom action plugins authored by integrators?
  - Do we allow inline scripting or only declarative configuration in v1?
