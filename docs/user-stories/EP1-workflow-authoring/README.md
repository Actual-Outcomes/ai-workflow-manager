# Epic EP1 — Workflow Authoring

## Epic Statement

Enable workflow architects to design, validate, and manage agentic workflows through a visual canvas and supporting CLI commands without writing code.

## Goals

- ✅ Provide intuitive tooling for creating nodes (Start, Action, Conditional, End) via toolbar buttons.
- ✅ Surface property inspectors for configuring entry actions (LLM Chat, Generate Document, Set Variable).
- ✅ Ensure validation feedback guides users to resolve issues before publishing or running workflows.
- ⏳ Support template creation and duplication to jump-start new workflows (in progress).

## Completed Features (Sprint 9)

- ✅ Multi-selection (Ctrl/Cmd+Click, drag selection)
- ✅ Alignment toolbar (6 operations: Left, Center, Right, Top, Middle, Bottom)
- ✅ Right-click context menu (Copy, Cut, Paste, Duplicate, Delete, Align)
- ✅ Node resizing with corner grabbers, size constraints, and aspect ratio
- ✅ Resizable and pinnable properties panel
- ✅ Node selection on drag
- ✅ Auto-save for positions (500ms debounce) and configurations (immediate)
- ✅ ShadCN UI components integrated (AlertDialog, ContextMenu, etc.)

## User Stories

| ID        | Title                                         | Persona            | Priority | Status       | Architecture Components                                                                                        |
| --------- | --------------------------------------------- | ------------------ | -------- | ------------ | -------------------------------------------------------------------------------------------------------------- |
| US-EP1-01 | Create workflow from blank canvas             | Workflow Architect | P0       | ✅ Implemented | Renderer (dashboard/designer), Preload IPC bridge, WorkflowDraftService, WorkflowRepository, ValidationService |
| US-EP1-02 | Add and connect nodes via drag-and-drop       | Workflow Architect | P0       | ✅ Implemented | Renderer designer canvas, WorkflowDraftService, WorkflowGraphModel, ValidationService                          |
| US-EP1-03 | Configure node entry/exit actions             | Workflow Architect | P0       | ✅ Implemented | Renderer inspector, ActionCatalog metadata, WorkflowDraftService, ConnectorRegistry                            |
| US-EP1-04 | Define triggers and validators on transitions | Workflow Architect | P0       | Draft        | Renderer transition inspector, TriggerConfigService, ValidationService, WorkflowDraftService                   |
| US-EP1-05 | View and resolve validation messages          | Workflow Architect | P0       | ✅ Implemented | ValidationService, Renderer validation panel, NotificationService, CLI validation command                      |
| US-EP1-06 | Save workflow draft and version history       | Workflow Architect | P1       | ✅ Implemented | WorkflowDraftService, WorkflowVersionRepository, LocalSqliteConnector, Autosave engine                         |
| US-EP1-07 | Duplicate workflow from template              | Workflow Architect | P1       | Draft        | WorkflowRepository, TemplateRegistry, Renderer/CLI duplication flows                                           |
| US-EP1-08 | Export workflow definition to JSON            | Integrator         | P1       | ✅ Implemented | WorkflowExportService, WorkflowRepository, CLI export command                                                  |
| US-EP1-09 | Undo/redo canvas actions                      | Workflow Architect | P1       | Draft        | Renderer command stack, WorkflowDraftService, EventStore                                                       |
| US-EP1-10 | CLI command to scaffold workflow              | Integrator         | P2       | Draft        | CLI scaffolding command set, WorkflowDraftService, TemplateRegistry                                            |

## Implementation Status

**Completed Stories**: 6 of 10 (60%)
- ✅ Core workflow authoring features implemented
- ✅ Visual designer with multi-selection, alignment, context menu, resizing
- ✅ Resizable and pinnable properties panel
- ✅ Auto-save for positions and configurations
- ✅ Node configuration (LLM Chat, Generate Document, Set Variable)
- ✅ Workflow export/import

**In Progress / Draft Stories**: 4 of 10 (40%)
- ⏳ Triggers and validators on transitions (US-EP1-04)
- ⏳ Workflow duplication from templates (US-EP1-07)
- ⏳ Undo/redo functionality (US-EP1-09)
- ⏳ CLI scaffolding commands (US-EP1-10)

## Dependencies

- Architecture: Workflow state & persistence model, trigger engine design.
- UX: Wireframes for designer canvas, node inspector, validation overlays.
- Connectors: Node configuration references available connectors/actions.

## Notes & Open Questions

- Determine versioning scope for initial release (full history vs recent snapshot).
- Clarify how templates are stored and shared (local vs team library).
- Align CLI scaffolding commands with UI workflow schema.
