# Component Library Documentation

This document describes the reusable component library for the AI Workflow Manager application.

## Component Categories

### 1. Primitive Components (ShadCN Wrappers)

These are direct wrappers around ShadCN UI components with minimal customization:

- **Button** (`components/ui/button.tsx`)
  - Variants: default, destructive, outline, secondary, ghost, link
  - Sizes: default, sm, lg, icon
  - Full ShadCN Button API

- **Input** (`components/ui/input.tsx`)
  - Standard text input with ShadCN styling
  - Supports all HTML input attributes

- **Label** (`components/ui/label.tsx`)
  - Accessible label component
  - Works with form inputs

- **Textarea** (`components/ui/textarea.tsx`)
  - Multi-line text input
  - ShadCN styling

- **Select** (`components/ui/select.tsx`)
  - Full Radix UI Select implementation
  - Includes all sub-components (Trigger, Content, Item, etc.)

- **Dialog** (`components/ui/dialog.tsx`)
  - Modal dialog component
  - Full Radix UI Dialog implementation

- **AlertDialog** (`components/ui/alert-dialog.tsx`)
  - Confirmation dialogs
  - Built on Radix UI AlertDialog

### 2. Enhanced Primitive Components

These are enhanced wrappers that add application-specific functionality:

#### FormField (`components/ui/form-field.tsx`)

A composite form field component that combines Label + Input/Select/Textarea with error handling and hints.

**Usage:**
```tsx
<FormField label="Name" htmlFor="name" required hint="Enter your full name">
  <FormFieldInput id="name" placeholder="John Doe" />
</FormField>

<FormField label="Status" error="This field is required">
  <FormFieldSelect
    value={status}
    onValueChange={setStatus}
    options={[
      { value: 'active', label: 'Active' },
      { value: 'paused', label: 'Paused' }
    ]}
  />
</FormField>
```

**Props:**
- `label`: Field label text
- `htmlFor`: ID of the input element
- `error`: Error message to display
- `hint`: Helper text
- `required`: Show required indicator
- `inline`: Use inline layout
- `className`: Additional CSS classes

#### StatusBadge (`components/ui/status-badge.tsx`)

A status indicator badge with automatic color mapping.

**Usage:**
```tsx
<StatusBadge status="ready">READY</StatusBadge>
<StatusBadge status="error">ERROR</StatusBadge>
<StatusBadge variant="success">CUSTOM</StatusBadge>
```

**Props:**
- `status`: Auto-maps to variant ('ready' → success, 'error' → error, etc.)
- `variant`: Explicit variant override (default, success, error, warning, info, idle)
- `children`: Badge content (defaults to uppercased status if status prop provided)

#### EmptyState (`components/ui/empty-state.tsx`)

Displays an empty state message with optional icon and action.

**Usage:**
```tsx
<EmptyState
  title="No workflows yet"
  description="Create your first workflow to get started"
  action={<Button onClick={handleCreate}>Create Workflow</Button>}
/>

<EmptyState compact>
  <p>No items found</p>
</EmptyState>
```

**Props:**
- `title`: Main heading
- `description`: Supporting text
- `icon`: Optional icon element
- `action`: Optional action button/component
- `compact`: Use compact styling
- `children`: Custom content

#### LoadingState (`components/ui/loading-state.tsx`)

Displays a loading spinner with optional message.

**Usage:**
```tsx
<LoadingState message="Loading workflows..." />
<LoadingState small message="Refreshing..." />
<LoadingState fullScreen message="Initializing..." />
```

**Props:**
- `message`: Loading message text
- `small`: Use smaller spinner
- `fullScreen`: Full screen overlay
- `className`: Additional CSS classes

### 3. Composite Components

These are higher-level components built from primitives:

#### Card (`components/ui/card.tsx`)

A flexible card container with header, content, and footer sections.

**Usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Workflow Settings</CardTitle>
    <CardDescription>Configure your workflow preferences</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Card content */}
  </CardContent>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

**Sub-components:**
- `CardHeader`: Header section with title and description
- `CardTitle`: Main heading
- `CardDescription`: Supporting text
- `CardContent`: Main content area
- `CardFooter`: Footer with actions

#### SectionHeader (`components/ui/section-header.tsx`)

A section header with title, description, and action buttons.

**Usage:**
```tsx
<SectionHeader
  title="Workflow Drafts"
  description="Validate and publish drafts before activating workflows"
  actions={
    <>
      <Button>Create Draft</Button>
      <Button variant="secondary">Refresh</Button>
    </>
  }
/>
```

**Props:**
- `title`: Section title
- `description`: Optional description text
- `actions`: Optional action buttons/components

## Composite Components to Extract from Application

The following patterns appear multiple times in the application and should be extracted as reusable components:

### 1. DiagnosticCard

**Current Pattern:**
```tsx
<section className="diagnostic-card">
  <div className="diagnostic-card-header">
    <div>
      <h3>Title</h3>
      <p>Description</p>
    </div>
    <div className="diagnostic-actions">
      <Button>Action</Button>
    </div>
  </div>
  {/* Content */}
</section>
```

**Proposed Component:**
```tsx
<DiagnosticCard
  title="Logging"
  description="Current application log destination"
  actions={<Button>Refresh</Button>}
>
  {/* Content */}
</DiagnosticCard>
```

### 2. ConnectorCard

**Current Pattern:**
```tsx
<div className="connector-card">
  <div className="connector-card-header">
    <div>
      <h4>{name}</h4>
      <small>{kind} · v{version}</small>
    </div>
    <StatusBadge status={status} />
  </div>
  {/* Content */}
  <div className="connector-actions">
    <Button>Test</Button>
    <Button variant="destructive">Remove</Button>
  </div>
</div>
```

**Proposed Component:**
```tsx
<ConnectorCard
  name={connector.name}
  kind={connector.kind}
  version={connector.version}
  status={connector.status}
  description={connector.description}
  healthCheck={connector.lastHealthCheck}
  onTest={() => handleTest(connector.id)}
  onRemove={() => handleRemove(connector.id)}
/>
```

### 3. DraftCard

**Current Pattern:**
```tsx
<div className="draft-card">
  <div className="draft-card-header">
    <div>
      <h4>{draft.name}</h4>
      <small>v{draft.version} · {draft.status}</small>
    </div>
    <span className="draft-updated">
      Updated {formatDate(draft.updatedAt)}
    </span>
  </div>
  <div className="draft-actions">
    <Button>Open Designer</Button>
    <Button variant="secondary">Validate</Button>
    <Button variant="secondary">Publish</Button>
    <Button variant="destructive">Delete</Button>
  </div>
</div>
```

**Proposed Component:**
```tsx
<DraftCard
  draft={draft}
  onOpenDesigner={() => handleOpen(draft.id)}
  onValidate={() => handleValidate(draft.id)}
  onPublish={() => handlePublish(draft.id)}
  onDelete={() => handleDelete(draft.id)}
  disabled={draftActionId === draft.id}
/>
```

### 4. WorkflowCard

**Current Pattern:**
```tsx
<div className="workflow-card">
  <div className="workflow-header">
    <h3>{workflow.name}</h3>
    <StatusBadge status={workflow.status} />
  </div>
  <p className="workflow-description">{workflow.description}</p>
  <div className="workflow-meta">
    <small>Created: {formatDate(workflow.created_at)}</small>
  </div>
  <div className="workflow-actions">
    <Button>Run</Button>
    <Select value={workflow.status} onValueChange={...} />
    <Button variant="secondary">Export</Button>
    <Button variant="destructive">Delete</Button>
  </div>
</div>
```

**Proposed Component:**
```tsx
<WorkflowCard
  workflow={workflow}
  onRun={() => handleRun(workflow.id)}
  onStatusChange={(status) => handleStatusChange(workflow.id, status)}
  onExport={() => handleExport(workflow.id)}
  onDelete={() => handleDelete(workflow.id)}
  runs={workflowRuns[workflow.id]}
/>
```

### 5. ScheduleForm

**Current Pattern:**
Large form with cron pattern selection, time pickers, timezone selector, etc.

**Proposed Component:**
```tsx
<ScheduleForm
  workflowId={scheduleForm.workflowId}
  cron={scheduleForm.cron}
  timezone={scheduleForm.timezone}
  pattern={scheduleForm.cronPattern}
  onPatternChange={setCronPattern}
  onWorkflowChange={setWorkflowId}
  onCronChange={setCron}
  onTimezoneChange={setTimezone}
  onSubmit={handleSubmit}
  editing={editingScheduleId !== null}
/>
```

### 6. ConnectorForm

**Current Pattern:**
Two-step form: connector type selection → API key + model selection

**Proposed Component:**
```tsx
<ConnectorForm
  onSelectType={setSelectedConnectorType}
  selectedType={selectedConnectorType}
  apiKey={connectorApiKey}
  onApiKeyChange={setConnectorApiKey}
  selectedModel={connectorSelectedModel}
  onModelChange={setConnectorSelectedModel}
  availableModels={connectorAvailableModels}
  loading={connectorLoadingModels}
  onSubmit={handleRegisterConnector}
  error={connectorError}
/>
```

## Usage Guidelines

### Importing Components

Use the barrel export from `components/ui`:

```tsx
import {
  Button,
  FormField,
  FormFieldInput,
  StatusBadge,
  EmptyState,
  LoadingState,
  Card,
  CardHeader,
  CardTitle,
  SectionHeader,
} from '@/components/ui'
```

### Styling

All components use Tailwind CSS classes and support the `className` prop for custom styling. The design system uses CSS variables defined in `src/renderer/index.css`.

### Accessibility

All components follow WCAG guidelines:
- Form fields are properly labeled
- Buttons have appropriate ARIA attributes
- Dialogs manage focus correctly
- Status indicators use semantic colors

## Future Enhancements

1. **DataTable Component**: For displaying tabular data (schedules, workflows, etc.)
2. **Tabs Component**: Replace custom tab switcher
3. **Badge Component**: General-purpose badge (separate from StatusBadge)
4. **Tooltip Component**: For help text and hints
5. **Popover Component**: For contextual actions
6. **Command Palette**: For keyboard navigation
7. **Toast/Notification Component**: For user feedback

## Migration Guide

When migrating existing code to use these components:

1. Replace `className="form-group"` with `<FormField>`
2. Replace `className="empty-state"` with `<EmptyState>`
3. Replace `className="loading small"` with `<LoadingState small>`
4. Replace status badges with `<StatusBadge>`
5. Replace card patterns with `<Card>` and sub-components
6. Replace section headers with `<SectionHeader>`

