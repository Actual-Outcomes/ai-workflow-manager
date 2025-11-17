# Architecture Gap Analysis

## ✅ What We Have (Implemented)

### Core Services
- ✅ WorkflowDraftService - Draft creation, autosave, versioning
- ✅ WorkflowExecutionService - Basic workflow execution with pause/resume
- ✅ WorkflowRunRepository - Run persistence
- ✅ ValidationService - Node/transition validation
- ✅ ConnectorRegistry - LLM connector registration
- ✅ CredentialVault - Encrypted credential storage
- ✅ DocumentService - Document export (DOCX, PDF, Markdown)
- ✅ DocumentRegistry - Document metadata storage
- ✅ TemplateRegistry - Template storage
- ✅ SchedulerService - Basic scheduling (hourly placeholder)
- ✅ LoggingService - Structured JSON logging
- ✅ TelemetryService - Event queuing
- ✅ BackupService - SQLite snapshot backup/restore
- ✅ SecurityScanner - npm audit wrapper
- ✅ AuditLogService - Append-only audit logging
- ✅ NotificationPreferenceService - Quiet hours/channels
- ✅ FileConnector - Basic file operations
- ✅ LLM Connectors - Claude, ChatGPT with model selection
- ✅ ActionExecutor - LLM, Document, Variable, Conditional actions

### UI Components
- ✅ Workflow Designer - Visual node editor (React Flow) with drag-and-drop
- ✅ Node property editor - Action/conditional configuration
- ✅ Node deletion - Delete nodes with confirmation
- ✅ Custom confirmation modal - Reusable modal component
- ✅ Connector Health UI - Registration, testing, model selection
- ✅ Document Workspace UI - Document listing
- ✅ Test Console UI - Test suite runner
- ✅ Workflow execution UI - Basic run management (real-time monitoring planned Sprint 7)

### Infrastructure
- ✅ Database schema - workflows, drafts, runs, events, schedules, connectors, documents, audit_logs
- ✅ IPC communication - Preload bridge
- ✅ CLI commands - Workflows, connectors, documents, drafts, execution

## ❌ What's Missing (Critical Gaps)

### 1. Workflow Export/Import Services
**Priority: High**
- `WorkflowExportService` - Bundle workflows with dependencies
- `WorkflowImportService` - Validate and import workflows
- JSON schema validation
- Dependency resolution (connectors, documents)

### 2. Template Export/Import with Signing
**Priority: Medium**
- `TemplateExportService` - Create signed template packages
- `TemplateImportService` - Verify signatures and import
- Template dependency manifest
- Permission metadata

### 3. Event System & Real-time Updates
**Priority: High**
- `WorkflowEventPublisher` - Central event bus (Observer pattern)
- IPC event streaming for execution updates
- Real-time execution monitoring UI
- Event replay for debugging

### 4. Advanced Workflow Runtime Features
**Priority: High**
- `RunStateSnapshotService` - Pause/resume with state snapshots
- Trigger evaluation engine (immediate, scheduled, external)
- Validator execution (beyond placeholder)
- Loop management (iteration counters, break conditions)
- Error handling with severity levels

### 5. File Security
**Priority: Medium**
- `FileSandboxGuard` - Enforce directory allowlist
- ConfigService integration for sandbox settings
- Path validation before file operations

### 6. Document Revision History
**Priority: Low**
- `DocumentRevisionRepository` - Store document versions
- Diff utilities (textual, structural)
- Revision restore functionality
- CLI commands for revision management

### 7. Scheduler Integration
**Priority: High**
- Cron parsing (replace hourly placeholder)
- Integration with WorkflowRuntime command bus
- NotificationService alerts for scheduled runs
- Scheduler UI in renderer

### 8. Settings & Configuration UI
**Priority: Medium**
- Settings panels for connectors
- Credential management UI
- Document path configuration
- Workflow defaults
- Notification preferences UI
- File sandbox configuration

### 9. Advanced UI Features
**Priority: Medium**
- Document preview/editing (syntax highlighting)
- Template gallery/library UI
- Backup/restore UI
- Security dashboard (vulnerability reports)
- Audit log viewer UI
- Notification UI integration (toasts, alerts)

### 10. Advanced Connector Features
**Priority: Low**
- Storage connectors (beyond local SQLite)
- Document connectors
- Rate limiting and circuit breakers
- Retry with exponential backoff
- Streaming protocol support

### 11. Migration & Upgrade
**Priority: Medium**
- `MigrationService` - Schema migrations with rollback
- Pre-backup hooks
- Dry-run mode
- Version compatibility checks

### 12. Telemetry Export
**Priority: Low**
- `TelemetryExporter` - Opt-in telemetry upload
- Anonymization helpers
- Diagnostic payload preview
- CLI command for manual upload

## 📊 Implementation Priority

### Sprint 7 (Next Priority)
1. **WorkflowEventPublisher** - Unblocks real-time UI and event-driven features
2. **IPC Event Streaming** - Real-time execution updates
3. **RunStateSnapshotService** - Pause/resume functionality
4. **Trigger & Validator Engine** - Complete workflow execution

### Sprint 8
5. **WorkflowExport/Import** - Sharing workflows
6. **Scheduler Integration** - Cron parsing + WorkflowRuntime hooks
7. **Settings UI** - Configuration management
8. **FileSandboxGuard** - Security hardening

### Sprint 9
9. **Template Export/Import** - Template sharing with signing
10. **Document Revision History** - Version control for documents
11. **Advanced UI Features** - Previews, galleries, dashboards
12. **Migration Service** - Upgrade path

### Future
13. **Telemetry Export** - Optional diagnostics
14. **Advanced Connectors** - Storage, document connectors
15. **Multi-user Sync** - Cloud integration (future)

## 🔗 Dependencies

- **EventPublisher** → Unblocks: Real-time UI, Event replay, Notification integration
- **RunStateSnapshotService** → Unblocks: Pause/resume, Workflow debugging
- **Trigger Engine** → Unblocks: Scheduled workflows, External triggers
- **Export/Import** → Unblocks: Workflow sharing, Template library
- **Settings UI** → Unblocks: User configuration, Connector management

## 📝 Notes

- Many core services exist but need UI integration
- Event system is critical for real-time features
- Export/Import needed for workflow sharing
- Settings UI needed for user configuration
- Scheduler needs proper cron parsing and WorkflowRuntime integration

## 🚀 Future Features (Product Backlog)

### UICard Step Feature
**Status**: Backlog  
**Priority**: High  
**Description**: Human-in-the-loop workflow node that presents data to users and collects input during execution.

**Key Components Needed**:
- UICard node type in workflow designer
- UICard Editor (visual card designer)
- UICard Runtime Renderer (displays cards during execution)
- Card submission handler
- Card data storage and retrieval

**See**: `docs/product-backlog.md` for full PRD

**Dependencies**: 
- ✅ Workflow Designer (complete)
- ✅ Workflow Execution Engine (complete)
- ✅ Real-time Event System (complete)
- ❌ Card rendering runtime (new)
- ❌ Card editor UI (new)
- ❌ Card submission workflow (new)

