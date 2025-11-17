# Sprint 5 Plan — Core Workflow Execution & LLM Integration

**Sprint Goal**: Enable workflows to actually execute by implementing the workflow runtime engine and LLM connector integrations.

## Current State Analysis

### ✅ Completed (Sprints 1-4)
- Workflow CRUD operations
- Workflow drafts and publishing
- Document workspace
- Logging/telemetry infrastructure
- Scheduler service
- Connector registry framework
- Credential vault (stores API keys)
- Template registry
- Retention policies
- Diagnostics UI

### ❌ Missing Core Components
1. **LLM Connector Implementations** - Registry exists, but no actual API-calling connectors
2. **Workflow Execution Engine** - `WorkflowRuntime` is skeleton (just state management)
3. **Node Actions & Triggers** - No entry/exit actions, triggers, or validators
4. **Workflow Run Persistence** - No `workflow_runs` table or run state snapshots
5. **Event System** - No event bus for workflow events
6. **State Machine Execution** - No actual workflow execution logic

## Sprint 5 Objectives

### 1. Implement LLM Connectors (Claude & ChatGPT)
**Goal**: Make LLM connectors actually call APIs, not just store credentials

**Tasks**:
- [ ] Create `LLMConnector` interface in `src/core/connectors/llm/`
  - Methods: `chat(messages, options)`, `stream(messages, options)`, `getUsage()`
  - Return types: `LLMResponse`, `LLMStreamEvent`, `TokenUsage`
- [ ] Implement `ClaudeConnector` using `@anthropic-ai/sdk`
  - Initialize with API key from vault
  - Handle rate limits and errors
  - Support streaming responses
- [ ] Implement `ChatgptConnector` using `openai` SDK
  - Initialize with API key from vault
  - Handle rate limits and errors
  - Support streaming responses
- [ ] Register connectors in `ConnectorRegistry` as actual adapters (not just metadata)
- [ ] Add health checks that actually test API connectivity
- [ ] Add unit tests with mocked API responses

**Acceptance Criteria**:
- Can call Claude API with stored credentials
- Can call ChatGPT API with stored credentials
- Health checks verify actual API connectivity
- Errors are handled gracefully (rate limits, invalid keys, network failures)

---

### 2. Workflow Run Persistence
**Goal**: Track workflow executions in database

**Tasks**:
- [ ] Extend `WorkflowDatabase` with run tables:
  - `workflow_runs` (id, workflow_version_id, status, started_at, completed_at, current_node_id, context_json)
  - `workflow_run_events` (timestamp, run_id, type, payload_json, emitter)
- [ ] Create `WorkflowRunRepository` for run CRUD operations
- [ ] Add run state snapshot support (pause/resume)
- [ ] Add migration for new tables
- [ ] Add unit tests for repository

**Acceptance Criteria**:
- Can create workflow runs
- Can update run state
- Can query run history
- Can save/restore run snapshots

---

### 3. Workflow Execution Engine
**Goal**: Make `WorkflowRuntime` actually execute workflows

**Tasks**:
- [ ] Enhance `WorkflowRuntime` with execution logic:
  - `executeNode(nodeId, context)` - Execute a single node
  - `executeAction(action, context)` - Execute entry/exit actions
  - `evaluateTrigger(trigger, context)` - Evaluate transition triggers
  - `validateTransition(transition, context)` - Run validators
- [ ] Implement node execution flow:
  1. Execute entry actions
  2. Wait for triggers/validators
  3. Execute exit actions
  4. Transition to next node
- [ ] Add context management (variables, state)
- [ ] Integrate with LLM connectors for LLM actions
- [ ] Add error handling and recovery
- [ ] Emit events for each step
- [ ] Add unit tests

**Acceptance Criteria**:
- Can start a workflow execution
- Executes nodes in sequence
- Handles transitions correctly
- Calls LLM connectors when needed
- Persists run state

---

### 4. Node Actions Framework
**Goal**: Support entry/exit actions in workflow nodes

**Tasks**:
- [ ] Define action types in `workflowTypes.ts`:
  - `LLMAction` - Call LLM with prompt
  - `DocumentAction` - Generate/update document
  - `VariableAction` - Set workflow variables
  - `ConditionalAction` - Branch logic
- [ ] Create `ActionExecutor` service:
  - `execute(action, context)` - Execute any action type
  - Integrate with LLM connectors
  - Integrate with DocumentService
- [ ] Update `WorkflowRuntime` to call actions
- [ ] Add action validation
- [ ] Add unit tests

**Acceptance Criteria**:
- Can define LLM actions in workflow nodes
- Actions execute during workflow run
- LLM actions call appropriate connector
- Results stored in workflow context

---

### 5. Trigger & Validator Framework
**Goal**: Support triggers and validators for transitions

**Tasks**:
- [ ] Define trigger types:
  - `ImmediateTrigger` - Fire immediately
  - `ConditionalTrigger` - Fire on condition
  - `ScheduledTrigger` - Fire on schedule
- [ ] Define validator types:
  - `ExpressionValidator` - Evaluate expression
  - `LLMValidator` - Use LLM to validate
- [ ] Create `TriggerEvaluator` service
- [ ] Create `ValidatorExecutor` service
- [ ] Integrate with `WorkflowRuntime`
- [ ] Add unit tests

**Acceptance Criteria**:
- Transitions can have triggers
- Transitions can have validators
- Validators can block transitions
- Triggers fire at correct times

---

### 6. Workflow Execution UI
**Goal**: Allow users to start/stop/monitor workflow runs

**Tasks**:
- [ ] Add "Run Workflow" button to workflow cards
- [ ] Create workflow execution view:
  - Show current node
  - Show execution log
  - Show context variables
  - Show LLM responses
- [ ] Add run history view
- [ ] Add pause/resume controls
- [ ] Wire IPC handlers for execution commands
- [ ] Add real-time updates via IPC events

**Acceptance Criteria**:
- Can start workflow from UI
- See execution progress
- See LLM responses
- Can pause/resume runs
- Can view run history

---

### 7. CLI Workflow Execution
**Goal**: Execute workflows from CLI

**Tasks**:
- [ ] Add `workflow run <id>` command
- [ ] Add `workflow runs list` command
- [ ] Add `workflow runs show <runId>` command
- [ ] Add `workflow runs pause/resume <runId>` commands
- [ ] Stream execution output to console
- [ ] Add JSON output option

**Acceptance Criteria**:
- Can start workflow from CLI
- See execution output
- Can list/view runs
- Can pause/resume from CLI

---

## Technical Decisions

### LLM Connector Interface
```typescript
interface LLMConnector {
  chat(messages: Message[], options?: LLMOptions): Promise<LLMResponse>
  stream(messages: Message[], options?: LLMOptions): AsyncIterable<LLMStreamEvent>
  getUsage(): TokenUsage
}

interface LLMResponse {
  content: string
  usage: TokenUsage
  model: string
}
```

### Workflow Execution Context
```typescript
interface WorkflowContext {
  variables: Record<string, unknown>
  currentNode: string
  history: ExecutionEvent[]
  metadata: Record<string, unknown>
}
```

### Action Types
```typescript
type Action = 
  | { type: 'llm', prompt: string, connector: string, model?: string }
  | { type: 'document', template: string, format: string }
  | { type: 'variable', name: string, value: unknown }
  | { type: 'conditional', condition: string, then: Action[], else?: Action[] }
```

## Dependencies

- `@anthropic-ai/sdk` - Already in package.json ✅
- `openai` - Already in package.json ✅
- No new dependencies needed

## Testing Strategy

- Unit tests for each connector (mocked API calls)
- Unit tests for WorkflowRuntime execution
- Integration tests for full workflow runs
- Test Console integration for execution tests

## Success Metrics

- ✅ Can execute a simple workflow with LLM node
- ✅ LLM responses are captured and stored
- ✅ Workflow runs are persisted
- ✅ Can pause/resume workflow execution
- ✅ UI shows execution progress
- ✅ CLI can execute workflows

## Open Questions

1. Should we support streaming LLM responses in real-time UI updates?
2. How do we handle long-running workflows (background execution)?
3. Should workflow runs be automatically cleaned up after X days?
4. How do we handle workflow failures (retry logic)?

## Estimated Effort

- LLM Connectors: 2-3 days
- Run Persistence: 1 day
- Execution Engine: 3-4 days
- Actions Framework: 2 days
- Triggers/Validators: 2 days
- UI Integration: 2 days
- CLI Integration: 1 day
- Testing: 2 days

**Total: ~15-17 days** (3-4 week sprint)

