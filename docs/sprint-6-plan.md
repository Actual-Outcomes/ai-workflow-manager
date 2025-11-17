# Sprint 6 Plan — Workflow Authoring & Advanced Execution

**Sprint Goal**: Enable users to create, edit, and execute complex workflows with a visual designer, advanced triggers/validators, and real-time execution monitoring.

## Current State Analysis

### ✅ Completed (Sprint 5)
- LLM Connectors (Claude & ChatGPT) with API integration
- Workflow Run Persistence (workflow_runs, workflow_run_events tables)
- Basic Workflow Execution Engine (WorkflowRuntime, ActionExecutor, WorkflowExecutionService)
- Node Actions Framework (LLM, Document, Variable, Conditional actions)
- Basic Workflow Execution UI (Run button, run history)
- CLI Workflow Execution commands

### ⚠️ Partially Complete
- Trigger & Validator Framework (basic structure exists, needs full implementation)
- Workflow Execution UI (needs real-time updates, better visualization)
- Error handling and retry logic (basic error handling, no retry)

### ❌ Missing Core Components
1. **Visual Workflow Designer** - No drag-and-drop interface for creating workflows
2. **Advanced Triggers** - Only basic triggers implemented (manual, immediate)
3. **Advanced Validators** - Only basic validators (expression evaluation)
4. **Real-time Execution Updates** - UI doesn't update during execution
5. **Workflow Templates** - No template library or examples
6. **Workflow Import/Export** - No way to share workflows
7. **Execution Retry Logic** - No automatic retry on failures
8. **Workflow Versioning UI** - Can't view/compare workflow versions
9. **Node Configuration UI** - Can't configure actions/triggers/validators visually
10. **Execution Logging & Debugging** - Limited visibility into execution details

## Sprint 6 Objectives

### 1. Visual Workflow Designer
**Goal**: Enable users to create and edit workflows visually with drag-and-drop

**Tasks**:
- [ ] Research and select workflow designer library (React Flow, Xyflow, or custom)
- [ ] Create `WorkflowDesigner` component in `src/renderer/components/`
- [ ] Implement node palette (Start, Action, Conditional, End nodes)
- [ ] Implement drag-and-drop node creation
- [ ] Implement connection/transition drawing between nodes
- [ ] Implement node property editor (actions, triggers, validators)
- [ ] Integrate with WorkflowDraftService for autosave
- [ ] Add validation feedback in designer (invalid connections, missing config)
- [ ] Add undo/redo support
- [ ] Add zoom/pan controls
- [ ] Add node search/filter

**Acceptance Criteria**:
- Can create new workflow visually
- Can add/remove nodes
- Can connect nodes to create transitions
- Can configure node properties (actions, triggers, validators)
- Changes autosave to draft
- Validation errors shown in designer

---

### 2. Advanced Triggers & Validators
**Goal**: Support complex workflow control flow

**Tasks**:
- [ ] Implement `ScheduledTrigger` (cron-based scheduling)
- [ ] Implement `ConditionalTrigger` (expression-based conditions)
- [ ] Implement `EventTrigger` (external event-based)
- [ ] Implement `LLMValidator` (use LLM to validate outputs)
- [ ] Implement `ExpressionValidator` (enhanced expression evaluation)
- [ ] Implement `SchemaValidator` (JSON schema validation)
- [ ] Create `TriggerEvaluator` service
- [ ] Create `ValidatorExecutor` service
- [ ] Add trigger/validator configuration UI
- [ ] Add unit tests for all trigger/validator types

**Acceptance Criteria**:
- Can schedule workflows to run on cron schedule
- Can add conditional triggers to transitions
- Can add validators that block transitions
- LLM validators can validate workflow outputs
- Expression validators support complex conditions

---

### 3. Real-time Execution Monitoring
**Goal**: Show live execution progress in UI

**Tasks**:
- [ ] Implement IPC event streaming for workflow execution
- [ ] Create `WorkflowExecutionView` component
- [ ] Add real-time node highlighting (current executing node)
- [ ] Add execution log viewer with filtering
- [ ] Add context variables viewer (live updates)
- [ ] Add LLM response viewer (streaming responses)
- [ ] Add execution timeline visualization
- [ ] Add pause/resume controls in execution view
- [ ] Add cancel execution button
- [ ] Add execution metrics (duration, tokens used, etc.)

**Acceptance Criteria**:
- Execution view updates in real-time
- Can see which node is currently executing
- Can see execution log as it happens
- Can pause/resume/cancel from execution view
- Can see LLM responses as they stream

---

### 4. Workflow Templates & Examples
**Goal**: Provide pre-built workflows users can start with

**Tasks**:
- [ ] Create template workflow definitions (JSON)
- [ ] Implement `WorkflowTemplateService`
- [ ] Create template library UI
- [ ] Add "Create from Template" flow
- [ ] Add template categories (Document Generation, Data Processing, etc.)
- [ ] Add template search/filter
- [ ] Add template preview
- [ ] Add ability to save workflows as templates
- [ ] Add template import/export

**Acceptance Criteria**:
- Can browse template library
- Can create workflow from template
- Can customize template-based workflow
- Can save own workflows as templates
- Can import/export templates

---

### 5. Workflow Import/Export
**Goal**: Enable workflow sharing and backup

**Tasks**:
- [ ] Implement `WorkflowExportService`
- [ ] Implement `WorkflowImportService`
- [ ] Add workflow JSON schema validation
- [ ] Add export to file (JSON)
- [ ] Add import from file (JSON)
- [ ] Add export/import UI buttons
- [ ] Add CLI commands (`workflow export`, `workflow import`)
- [ ] Handle version conflicts on import
- [ ] Add export/import validation
- [ ] Add dependency resolution (connectors, templates)

**Acceptance Criteria**:
- Can export workflow to JSON file
- Can import workflow from JSON file
- Exported workflows can be imported on different machines
- Import validates workflow structure
- Import handles missing dependencies gracefully

---

### 6. Execution Retry & Error Handling
**Goal**: Make workflows resilient to transient failures

**Tasks**:
- [ ] Implement retry policy configuration
- [ ] Add retry logic to `WorkflowExecutionService`
- [ ] Add exponential backoff for retries
- [ ] Add max retry count configuration
- [ ] Add retry on specific error types (network, rate limit, etc.)
- [ ] Add retry UI configuration
- [ ] Add retry history in execution view
- [ ] Add "Retry Failed Node" action
- [ ] Add error recovery strategies
- [ ] Add unit tests for retry logic

**Acceptance Criteria**:
- Workflows can retry failed actions
- Retry policy is configurable
- Retry history is visible
- Can manually retry failed nodes
- Retries use exponential backoff

---

### 7. Workflow Versioning UI
**Goal**: Enable users to view and manage workflow versions

**Tasks**:
- [ ] Create `WorkflowVersionView` component
- [ ] Add version history list
- [ ] Add version diff viewer
- [ ] Add "Restore Version" action
- [ ] Add version comparison UI
- [ ] Add version tags/notes
- [ ] Add "Create Branch" from version
- [ ] Add version rollback confirmation
- [ ] Integrate with WorkflowVersionRepository

**Acceptance Criteria**:
- Can view all workflow versions
- Can see what changed between versions
- Can restore previous version
- Can compare versions side-by-side
- Can tag versions with notes

---

### 8. Node Configuration UI
**Goal**: Make it easy to configure node actions, triggers, and validators

**Tasks**:
- [ ] Create `NodeConfigPanel` component
- [ ] Add action configuration form (LLM, Document, Variable, Conditional)
- [ ] Add trigger configuration form (Scheduled, Conditional, Event)
- [ ] Add validator configuration form (Expression, LLM, Schema)
- [ ] Add form validation
- [ ] Add configuration templates/presets
- [ ] Add variable reference autocomplete
- [ ] Add LLM model selector in action config
- [ ] Add expression builder for conditions
- [ ] Add configuration preview

**Acceptance Criteria**:
- Can configure all action types visually
- Can configure all trigger types visually
- Can configure all validator types visually
- Forms validate input
- Can reference workflow variables
- Can preview configuration

---

### 9. Enhanced Execution Logging & Debugging
**Goal**: Provide detailed execution insights for debugging

**Tasks**:
- [ ] Enhance execution event logging
- [ ] Add execution trace viewer
- [ ] Add variable state snapshots at each step
- [ ] Add execution performance metrics
- [ ] Add execution error details with stack traces
- [ ] Add execution search/filter
- [ ] Add execution export (JSON, CSV)
- [ ] Add execution replay (step through execution)
- [ ] Add breakpoints for debugging
- [ ] Add execution profiling

**Acceptance Criteria**:
- Can see detailed execution trace
- Can see variable state at each step
- Can search/filter execution logs
- Can export execution data
- Can replay execution step-by-step
- Can set breakpoints for debugging

---

### 10. Performance & Quality Improvements
**Goal**: Improve application performance and reliability

**Tasks**:
- [ ] Optimize workflow execution performance
- [ ] Add execution caching for repeated operations
- [ ] Add lazy loading for large workflows
- [ ] Optimize database queries
- [ ] Add connection pooling
- [ ] Improve error messages
- [ ] Add comprehensive error handling
- [ ] Add performance monitoring
- [ ] Add memory leak detection
- [ ] Add unit test coverage improvements

**Acceptance Criteria**:
- Workflows execute faster
- UI is more responsive
- No memory leaks
- Better error messages
- Improved test coverage

---

## Technical Decisions

### Workflow Designer Library
**Decision**: Use React Flow (reactflow.dev) for workflow designer
**Rationale**: 
- Mature, well-maintained library
- Good TypeScript support
- Customizable nodes and edges
- Built-in zoom/pan
- Active community

### Real-time Updates
**Decision**: Use IPC event emitters for real-time updates
**Rationale**:
- Already have IPC infrastructure
- No need for WebSockets in desktop app
- Simple event-based architecture
- Works with Electron's IPC

### Template Format
**Decision**: Use JSON schema for workflow templates
**Rationale**:
- Human-readable
- Easy to version control
- Easy to validate
- Easy to import/export

### Retry Strategy
**Decision**: Exponential backoff with configurable max retries
**Rationale**:
- Standard approach for API retries
- Prevents overwhelming APIs
- Configurable per workflow
- Works well with rate limits

## Dependencies

- `reactflow` - Workflow designer (new dependency)
- `cron-parser` - Already in package.json ✅
- `ajv` - JSON schema validation (new dependency)
- No other new major dependencies needed

## Testing Strategy

- Unit tests for all new services (TriggerEvaluator, ValidatorExecutor, etc.)
- Integration tests for workflow execution with retries
- E2E tests for workflow designer
- Visual regression tests for UI components
- Performance tests for large workflows

## Success Metrics

- ✅ Can create workflow visually in designer
- ✅ Can configure all node types visually
- ✅ Workflows execute with real-time updates
- ✅ Can retry failed executions
- ✅ Can import/export workflows
- ✅ Can use workflow templates
- ✅ Execution is debuggable with detailed logs
- ✅ UI is responsive and performant

## Open Questions

1. Should we support workflow branching/merging?
2. How do we handle workflow dependencies (workflows that call other workflows)?
3. Should we support workflow variables with types (string, number, boolean, etc.)?
4. How do we handle workflow execution timeouts?
5. Should we support parallel node execution?

## Estimated Effort

- Visual Workflow Designer: 5-6 days
- Advanced Triggers & Validators: 3-4 days
- Real-time Execution Monitoring: 3-4 days
- Workflow Templates & Examples: 2-3 days
- Workflow Import/Export: 2 days
- Execution Retry & Error Handling: 2-3 days
- Workflow Versioning UI: 2 days
- Node Configuration UI: 3-4 days
- Enhanced Execution Logging: 2-3 days
- Performance & Quality: 2-3 days
- Testing: 3-4 days

**Total: ~29-36 days** (6-7 week sprint)

## Sprint 6 Priorities

### Must Have (MVP)
1. Visual Workflow Designer (basic)
2. Real-time Execution Monitoring
3. Node Configuration UI
4. Workflow Templates (basic)

### Should Have
5. Advanced Triggers & Validators
6. Workflow Import/Export
7. Execution Retry & Error Handling

### Nice to Have
8. Workflow Versioning UI
9. Enhanced Execution Logging & Debugging
10. Performance & Quality Improvements

