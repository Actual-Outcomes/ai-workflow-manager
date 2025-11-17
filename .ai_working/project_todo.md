# Project TODO — AI Workflow Manager

## Baseline Build & Packaging

- [ ] Validate `npm run dev` end-to-end (renderer launch, preload bridge checks).
- [ ] Package Windows installer via `npm run package:win`, document results.
- [ ] Smoke test packaged app (GUI + CLI) and capture findings in wrap-up notes.

## Architecture & Documentation

- [ ] Expand `docs/architecture.md` with sequence diagrams or component illustrations.
- [ ] Draft `docs/connector-interface.md` detailing `WorkflowDataConnector` contract, configuration schema, and testing requirements.
- [ ] Add configuration management guidelines (env vars, settings UI) to docs.
- [ ] Document workflow engine concepts (nodes, triggers, validators, actions) and CLI interaction flow.
- [ ] Document state machine execution model and persistence strategy for workflows.

## Connector Implementation Roadmap

- [ ] Formalize connector factory/registry module in `src/core/connectors/`.
- [ ] Refactor existing SQLite access into `LocalSqliteConnector` implementing the shared interface.
- [ ] Scaffold test harness for connector contract verification (unit + integration).
- [ ] Design LLM connector interface and shared SDK abstractions for ChatGPT/Claude.
- [ ] Implement `ChatgptConnector` and `ClaudeConnector` adhering to the shared LLM interface.
- [ ] Add configuration schema for selecting active LLM connector and storing API credentials securely.
- [ ] Provide settings UI for capturing/editing ChatGPT and Claude API keys.
- [ ] Add CLI commands for managing LLM connectors and keys (list/select/test).
- [ ] Create mock adapters for offline/testing scenarios to avoid hitting external APIs.
- [ ] Document LLM connector contract, rate-limit considerations, and error handling guidelines in `docs/connector-interface.md`.
- [ ] Evaluate document-generation libraries for DOCX and PDF outputs (e.g., `docx`, `pdf-lib`) and select preferred stack.
- [ ] Prototype workflow action that generates DOCX files using the chosen library.
- [ ] Prototype workflow action that generates PDF files (direct or via HTML-to-PDF pipeline).
- [ ] Implement secure credential vault (OS keychain or encrypted local store) for API keys and secrets.

## UX & Settings

- [ ] Design GUI settings panel for selecting and configuring connectors.
- [ ] Provide CLI commands for listing, adding, and switching connectors.
- [ ] Document connector deployment steps for third-party integrations.
- [ ] Build visual workflow designer with drag-and-drop node palette, entry/exit action configuration, and transition editors.
- [ ] Create CLI tooling for invoking node actions and testing triggers/validators.
- [ ] Define node action catalog per node type and document usage patterns.
- [ ] Implement file editors: syntax-highlighted text/Markdown/JSON/YAML, table view for CSV, HTML preview and editor.
- [ ] Add settings/UI to manage document templates and output locations.
- [ ] Provide wizard for setting up default workflow templates and connector selections.

## Operations & Quality

- [ ] Automate lint/format enforcement (Prettier, ESLint) in CI.
- [ ] Set up packaging CI job to produce installers per release branch.
- [ ] Define telemetry/logging approach for connector health (opt-in by default).
- [ ] Establish testing strategy for workflow triggers/validators (unit + integration).
- [ ] Build workflow engine state machine runtime with persistence of node state and transition history.
- [ ] Create integration tests covering connector interactions, document generation, and workflow execution paths.
- [ ] Add vulnerability remediation workflow (monitor `npm audit`, patch schedule).
- [ ] Implement centralized logging/telemetry pipeline across main, renderer, and connectors.

## Sprint 4 (Completed)

- [x] Finalize ConfigService schema updates (connectors, vault, diagnostics, retention).
- [x] Implement ConnectorRegistry interfaces, vault adapters, and health checks.
- [x] Wire SchedulerService to WorkflowRuntime with cron parsing + NotificationService alerts.
- [x] Build renderer diagnostics/settings panels (logs, telemetry, notifications, schedules).
- [x] Add TemplateRegistry permissions plus export/import manifest tooling.
- [x] Implement retention policies + automated cleanup for logs, telemetry, backups, security scans.

## Sprint 5 (Completed)

- [x] Implement LLM Connectors (Claude & ChatGPT) with API integration
- [x] Add workflow run persistence (workflow_runs, workflow_run_events tables)
- [x] Enhance WorkflowRuntime with execution logic
- [x] Implement ActionExecutor service (LLM, Document, Variable, Conditional actions)
- [x] Add workflow execution UI (Run button, run history)
- [x] Add workflow execution CLI commands
- [x] Fix connector initialization and model listing

## Sprint 6 (Completed)

**Focus**: Workflow Authoring & Advanced Execution

### Must Have (MVP)
- [x] Visual Workflow Designer (basic drag-and-drop)
- [x] Real-time Execution Monitoring
- [x] Node Configuration UI
- [x] Workflow Templates (basic library)

### Should Have
- [ ] Advanced Triggers & Validators
- [x] Workflow Import/Export
- [x] Execution Retry & Error Handling

### Nice to Have
- [ ] Workflow Versioning UI
- [x] Enhanced Execution Logging & Debugging
- [ ] Performance & Quality Improvements

## Sprint 7 (Completed)

**Focus**: Final MVP Sprint - Real-time Monitoring, Sharing, Templates

- [x] Event System & Real-time Execution Monitoring
- [x] Workflow Export/Import Services
- [x] Basic Workflow Templates (3 templates)
- [x] Template Selection UI
- [x] Export/Import UI Integration
- [x] Enhanced Execution View

See `docs/sprint-7-plan.md` for detailed plan.

## Product Backlog

### UICard Step Feature
**Status**: Backlog  
**Priority**: High  
**Estimated Effort**: Large (Multi-sprint)

A new node type that enables human-in-the-loop workflows by allowing creators to present data visually and collect user input during workflow execution.

**Key Features**:
- Visual card designer with drag-and-drop layout
- Display elements (text, images, tables)
- Input components (text, dropdowns, checkboxes, file upload, etc.)
- Dynamic data binding from workflow context
- Runtime card rendering and submission
- Data available to downstream workflow steps

**See**: `docs/product-backlog.md` for full Product Requirements Document (PRD)

**Phases**:
- Phase 1: Core MVP (card node, basic editor, runtime rendering)
- Phase 2: Enhancements (conditional fields, templates, AI-assisted creation)
- Phase 3: Enterprise (permissions, versioning, embeddable SDK)

### File System Actions Feature
**Status**: Backlog  
**Priority**: Medium  
**Estimated Effort**: Medium (1-2 sprints)

Workflow actions for common file system operations to enable file management in workflows.

**Key Features**:
- List files in folder (with pattern matching and recursive search)
- Move files (with overwrite option)
- Delete files (with error handling)
- Rename files (with overwrite option)
- Variable support for paths
- Integration with FileSandboxGuard for security

**See**: `docs/product-backlog.md` for full details

**Dependencies**:
- ✅ FileConnector (exists, needs extension)
- ❌ FileSandboxGuard (needs implementation)
- ✅ ActionExecutor (exists, needs extension)
- ✅ Workflow Designer (exists, needs UI updates)
