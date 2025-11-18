# Story: Add and connect nodes via drag-and-drop

- **Epic**: EP1 — Workflow Authoring
- **Persona**: Workflow Architect
- **Priority**: P0
- **Status**: Implemented

## Context

After creating a blank workflow, architects must rapidly assemble nodes and transitions. The drag-and-drop experience should be smooth with visual feedback, snapping, and accessible alternatives (keyboard-based placement). This story defines the core interaction for building the workflow graph.

## User Story

As a workflow architect, I want to drag nodes from the palette onto the canvas and connect them so that I can outline the control flow of my automation.

## Acceptance Criteria

```
Given the designer canvas is open
When I click a node type button (Start, Action, Conditional, End) in the toolbar
Then the node is placed at a default location with a default label and selected state

Given a node is selected on the canvas
When I edit the node label in the properties panel
Then the label updates immediately and auto-saves to the workflow definition

Given two nodes exist on the canvas
When I drag from the source node's connector handle to a target node
Then a transition line (edge) appears connecting the nodes, and the connection is saved

Given a transition line (edge) is selected
When I press Delete or choose "Delete" from the right-click context menu
Then a confirmation dialog appears, and upon confirmation, the connection is removed and the workflow definition updates

Given multiple nodes exist on the canvas
When I hold Ctrl/Cmd and click nodes or drag a selection box
Then multiple nodes are selected and show visual selection indicators

Given 2 or more nodes are selected
When I use the alignment toolbar buttons (Left, Center, Right, Top, Middle, Bottom)
Then the selected nodes align according to the chosen operation and positions auto-save after 500ms

Given a node is selected
When I right-click on the node
Then a context menu appears with options: Copy, Cut, Paste, Duplicate, Delete, and Align (when multiple selected)

Given a node is selected
When I drag the corner resize handles
Then the node resizes with size constraints (min/max width/height) and aspect ratio constraints (for Conditional/End nodes), and dimensions are saved to metadata

Given I start dragging a node
Then the node automatically becomes selected

Given I move a node on the canvas
Then the position is auto-saved after a 500ms debounce delay

Given I use keyboard shortcuts
When I press Ctrl/Cmd+A
Then all nodes are selected

Given I use keyboard shortcuts
When I press Escape
Then all nodes are deselected

Given I have nodes selected
When I press Delete or Backspace
Then a confirmation dialog appears, and upon confirmation, selected nodes are deleted

Given the properties panel is open
When I resize it by dragging the left edge
Then the panel width adjusts between 250px and 800px and the new width persists

Given the properties panel is open
When I click the pin button
Then the panel remains open even when no node is selected

Given the properties panel is open and unpinned
When I click the close button (×)
Then the panel closes and no node is selected
```

## UX References

- `docs/ux-flows.md#A.-Designing-a-New-Workflow`
- Upcoming narrative spec: `docs/ux/narratives/designer.md`

## Technical Notes

- Impacts modules: `renderer` (canvas rendering, drag/drop handlers), `main` (persisting draft updates), `core` (workflow graph model).
- Dependencies: Workflow state schema, trigger configuration UI story.
- Open Questions:
  - What library or custom implementation handles drag/drop and snapping? (Consider React Flow, custom Canvas)
  - How do we represent transitions in the underlying data structure to support undo/redo efficiently?
