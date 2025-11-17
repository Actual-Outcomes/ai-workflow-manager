# Sprint 8 Plan — Automation & Configuration

**Sprint Goal**: Enable scheduled workflow execution and provide comprehensive settings UI for configuration management.

## Current State Analysis

### ✅ Completed (Sprint 7)
- ✅ Event System & Real-time Execution Monitoring
- ✅ Workflow Export/Import Services
- ✅ Basic Workflow Templates (3 templates)
- ✅ Template Selection UI
- ✅ Export/Import UI Integration
- ✅ Enhanced Execution View with real-time updates

### ⚠️ Partially Complete
- **SchedulerService** - Cron parsing exists, but needs UI and WorkflowExecutionService integration
- **Settings/Configuration** - Services exist (ConfigService, NotificationPreferenceService) but no UI
- **Workflow Execution** - Works but needs better pause/resume with state snapshots

### ❌ Missing for Production Readiness
1. **Scheduled Workflow Execution** - Cron parsing exists, but `SchedulerRunner` uses old `WorkflowRuntime` instead of `WorkflowExecutionService`, and no UI
2. **Settings UI** - No way to configure connectors, paths, notifications via GUI
3. **RunStateSnapshotService** - Pause/resume doesn't persist full state
4. **FileSandboxGuard** - No security enforcement for file operations
5. **Trigger & Validator Engine** - Basic execution but triggers/validators need enhancement

## Sprint 8 Objectives

### 1. Scheduler Integration ⭐ CRITICAL
**Goal**: Enable scheduled workflow execution with cron support

**Tasks**:
- [ ] Update `SchedulerRunner` to use `WorkflowExecutionService` instead of old `WorkflowRuntime` (currently uses `WorkflowRuntime.start()`)
- [ ] Update `SchedulerRunner` to use `WorkflowDraftService` to get drafts instead of parsing workflow versions
- [ ] Add cron expression builder UI (common patterns: daily, weekly, monthly)
- [ ] Add scheduler UI in renderer (list schedules, add/edit/delete, enable/disable)
- [ ] Add schedule status indicators (next run time, last run time, run count)
- [ ] Add IPC handlers for scheduler operations (list, add, edit, delete, pause, resume)
- [ ] Add preload API for scheduler operations
- [ ] Add notification integration (alert when scheduled runs start/complete/fail) - partially exists
- [ ] Add CLI commands for schedule management (`schedule add`, `schedule list`, `schedule remove`)
- [ ] Add schedule execution logging and error handling - partially exists
- [ ] Test scheduled execution with various cron patterns

**Acceptance Criteria**:
- Can create schedules with cron expressions (e.g., "0 9 * * *" for daily at 9 AM)
- Schedules automatically trigger workflow executions at specified times
- Can view all schedules with next run time displayed
- Can enable/disable schedules without deleting them
- Scheduled runs appear in workflow run history
- Notifications sent when scheduled runs start/complete/fail
- CLI commands work for all schedule operations

**Technical Decisions**:
- Use `node-cron` library for cron parsing and scheduling
- Store cron expressions as strings in `workflow_schedules` table
- Use Node.js `setInterval` or `node-cron` scheduler for execution
- Schedule execution runs in main process (not renderer)

---

### 2. Settings & Configuration UI ⭐ HIGH PRIORITY
**Goal**: Provide comprehensive settings UI for all configuration options

**Tasks**:
- [ ] Create Settings component/section in renderer
- [ ] Add Connector Settings panel
  - [ ] List all registered connectors
  - [ ] Edit connector configuration
  - [ ] Test connector connectivity
  - [ ] View connector health status
- [ ] Add Document Settings panel
  - [ ] Configure default document output path
  - [ ] View/change document storage location
  - [ ] Set default document format preferences
- [ ] Add Notification Settings panel
  - [ ] Configure quiet hours
  - [ ] Select notification channels (toast, system, log)
  - [ ] Enable/disable notification types (workflow events, errors, scheduled runs)
- [ ] Add Workflow Settings panel
  - [ ] Configure default workflow templates
  - [ ] Set workflow execution defaults
  - [ ] Configure autosave interval
- [ ] Add File Sandbox Settings panel
  - [ ] Configure allowed directories (read/write)
  - [ ] Add/remove directory allowlist entries
  - [ ] View current sandbox configuration
- [ ] Add General Settings panel
  - [ ] App theme preferences (future: dark/light toggle)
  - [ ] Language preferences (future: i18n)
  - [ ] Logging level configuration
  - [ ] Telemetry opt-in/out
- [ ] Add Settings navigation/sidebar
- [ ] Add settings search/filter
- [ ] Add settings validation and error messages
- [ ] Add settings import/export (backup configuration)
- [ ] Integrate with existing `ConfigService` and `NotificationPreferenceService`

**Acceptance Criteria**:
- All configuration options accessible via Settings UI
- Changes persist immediately
- Validation prevents invalid configurations
- Settings organized in logical panels
- Can search/filter settings
- Can export/import settings as backup

**Technical Decisions**:
- Create new `SettingsView` component in renderer
- Use existing `ConfigService` for persistence
- Add IPC handlers for all settings operations
- Use form validation for user inputs

---

### 3. RunStateSnapshotService (If Time Permits)
**Goal**: Improve pause/resume functionality with full state persistence

**Tasks**:
- [ ] Create `RunStateSnapshotService` class
- [ ] Implement state snapshot creation (capture full workflow context)
- [ ] Implement state snapshot restoration (resume from exact state)
- [ ] Add snapshot storage in database (new table or JSON in `workflow_runs`)
- [ ] Integrate with `WorkflowExecutionService.pauseRun()` and `resumeRun()`
- [ ] Add snapshot versioning (handle workflow changes between pause/resume)
- [ ] Add snapshot cleanup (remove old snapshots)
- [ ] Test pause/resume with complex workflows
- [ ] Add snapshot UI indicators (show paused state, resume option)

**Acceptance Criteria**:
- Can pause workflow at any point
- Can resume workflow from exact paused state
- All context variables preserved
- Node state preserved (which node was executing)
- Works with complex workflows (loops, conditionals)

**Technical Decisions**:
- Store snapshots as JSON in `workflow_runs.context_json`
- Include full context, current node, execution history
- Validate workflow hasn't changed before resume (warn user)

---

### 4. FileSandboxGuard (If Time Permits)
**Goal**: Enforce security for file operations

**Tasks**:
- [ ] Create `FileSandboxGuard` class
- [ ] Implement directory allowlist checking
- [ ] Add path validation before file operations
- [ ] Integrate with `DocumentService` and `FileConnector`
- [ ] Add sandbox configuration to `ConfigService`
- [ ] Add default allowlist (user documents folder, app data folder)
- [ ] Add sandbox violation logging
- [ ] Add sandbox UI in Settings (see Settings UI above)
- [ ] Test file operations with allowlist enforcement

**Acceptance Criteria**:
- File operations only allowed in configured directories
- Attempts to access disallowed paths are blocked
- Violations logged to audit log
- Can configure allowlist via Settings UI

**Technical Decisions**:
- Use path normalization and validation
- Check allowlist before any file read/write
- Log violations to `AuditLogService`

---

## Sprint 8 Task Breakdown

### Must Have (MVP)
1. **Scheduler Integration** (8-10 tasks)
   - Cron parsing library integration
   - Scheduler UI
   - WorkflowRuntime integration
   - Notification integration

2. **Settings UI** (10-12 tasks)
   - Settings component structure
   - Connector settings panel
   - Document settings panel
   - Notification settings panel
   - File sandbox settings panel

### Should Have
3. **RunStateSnapshotService** (6-8 tasks)
   - State snapshot implementation
   - Pause/resume integration
   - UI indicators

### Nice to Have
4. **FileSandboxGuard** (5-6 tasks)
   - Security enforcement
   - Settings integration

---

## Dependencies

- **Scheduler Integration** depends on:
  - ✅ `WorkflowExecutionService` (complete)
  - ✅ `NotificationService` (complete)
  - ✅ `SchedulerService` (exists, needs enhancement)
  - ❌ Cron parsing library (new dependency)

- **Settings UI** depends on:
  - ✅ `ConfigService` (complete)
  - ✅ `NotificationPreferenceService` (complete)
  - ✅ `ConnectorRegistry` (complete)
  - ❌ `FileSandboxGuard` (if implementing sandbox settings)

---

## Testing Strategy

### Unit Tests
- Cron expression parsing and validation
- SchedulerService cron integration
- RunStateSnapshotService state capture/restore
- FileSandboxGuard path validation

### Integration Tests
- Scheduled workflow execution end-to-end
- Settings persistence and retrieval
- Pause/resume with state snapshots
- File operations with sandbox enforcement

### Manual Testing
- Create schedules with various cron patterns
- Verify scheduled runs execute at correct times
- Test all settings panels and persistence
- Test pause/resume with complex workflows

---

## Success Metrics

- ✅ Can schedule workflows to run automatically
- ✅ All configuration accessible via Settings UI
- ✅ Scheduled runs execute reliably
- ✅ Settings persist and load correctly
- ✅ Pause/resume works with full state preservation (if implemented)

---

## Risks & Mitigations

### Risk 1: Cron parsing complexity
- **Mitigation**: Use well-tested library (`node-cron`), provide UI for common patterns

### Risk 2: Settings UI scope creep
- **Mitigation**: Focus on core settings first, defer advanced options

### Risk 3: State snapshot compatibility
- **Mitigation**: Version snapshots, validate workflow hasn't changed before resume

### Risk 4: File sandbox breaking existing workflows
- **Mitigation**: Set permissive defaults, allow user configuration

---

## Estimated Effort

- **Scheduler Integration**: 3-4 days
- **Settings UI**: 3-4 days
- **RunStateSnapshotService**: 2-3 days (if time permits)
- **FileSandboxGuard**: 1-2 days (if time permits)

**Total Sprint 8**: ~8-10 days of focused development

---

## Next Steps After Sprint 8

- Sprint 9: Advanced features (Template Export/Import, Document Revision History, Advanced UI Features)
- Future: UICard Step implementation (large feature, multi-sprint)

