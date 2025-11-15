# Sprint 2 Plan — Workflow Runtime, Designer Drafts, and Document Services

## Objectives
1. Ship the Workflow Runtime + DraftService foundations so end-to-end authoring flows work (designer autosave, validation, publish).
2. Deliver baseline Document/Template services (registry, builders, workspace IO) anchored on the new FileConnector.
3. Expose runtime/draft operations over IPC/CLI to unblock automation and future Scheduler work.

## High-Level Scope
| Workstream | Key Components |
|------------|----------------|
| Workflow Domain & Drafts | WorkflowRuntime, WorkflowDraftService, ValidationService integration |
| Document & Template Services | DocumentRegistry, DocumentBuilder strategies (DOCX/PDF/Markdown), DocumentWorkspace IO |
| CLI / IPC Surfaces | Renderer preload + CLI commands for draft CRUD, validation, document export |

## Sequencing (2-week sprint)
1. **Domain Modeling & Draft API (Days 1-3)**
   - Finalize `src/core/domain/workflows.ts` types.
   - Create SQLite migrations for `workflow_versions`, `workflow_nodes`, `workflow_transitions`.
   - Implement `WorkflowDraftService` CRUD + autosave.
2. **Validation Engine & Runtime Skeleton (Days 3-6)**
   - Build ValidationService (schema validation + custom rules).
   - Stub WorkflowRuntime command bus (start/pause/resume hooks).
   - Connect draft save → validation results → designer messaging.
3. **Document & Template Foundations (Days 6-9)**
   - Implement DocumentRegistry, DocumentBuilder strategies (DOCX via `docx`, PDF via `pdf-lib`, Markdown passthrough).
   - Wire DocumentWorkspace IPC to FileConnector (load/save templates).
4. **CLI/IPC Exposure & Testing (Days 9-10)**
   - Add renderer hooks for draft CRUD/validation + document export.
   - Extend CLI (`aiwm workflow draft ...`, `aiwm doc export ...`).
   - Cover with vitest suites + Test Console entries (`workflow-drafts`, `document-builders`).
5. Buffer/Hardening (Days 11-12)
   - Integration tests, UX polish, address risk items.

## Detailed Task Lists
### Workflow Runtime & Draft Service
- [ ] Domain models/types + migrations.
- [ ] `WorkflowDraftService` with autosave/version history.
- [ ] ValidationService runner + error DTOs.
- [ ] WorkflowRuntime skeleton (subscribe to ValidationService + future Scheduler).
- [ ] IPC: `workflow:drafts:list/create/update/delete/validate`.
- [ ] CLI: `aiwm workflow draft list|create|update|validate`.
- [ ] Vitest suites for draft persistence + validation.

### Document & Template Services
- [ ] DocumentRegistry schema + repository.
- [ ] DocumentBuilder implementations (`DocxBuilder`, `PdfBuilder`, `MarkdownBuilder`).
- [ ] Renderer document workspace integration (load/save via FileConnector).
- [ ] CLI export command (`aiwm doc export <workflowId>`).
- [ ] Vitest: document builder outputs, registry CRUD.

### Shared / Ops
- [ ] Update Test Console with `workflow-drafts` and `document-builders` suites once tests exist.
- [ ] Audit logging for draft publish + document exports.
- [ ] Docs: update architecture & implementation plan with Sprint 2 status.

## Risks & Mitigations
- **Schema churn**: lock schema before sprint ends; document migrations clearly.
- **Binary document handling**: start with deterministic fixtures for doc builders to keep tests reliable.
- **Runtime complexity**: keep WorkflowRuntime minimal (state transitions + logging) until validation is stable.

## Definition of Done
- Draft designer flows can create/save/validate/publish workflows via IPC + CLI.
- Document workspace can read/write templates and export sample DOCX/PDF.
- New vitest suites run via `npm test` and appear in Test Console.
- Docs (`implementation-plan.md`, `sprint-1-plan.md`) updated with completion status and Sprint 2 goals.

