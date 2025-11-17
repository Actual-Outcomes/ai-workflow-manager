# Product Backlog — AI Workflow Manager

This document tracks planned features and enhancements for future sprints.

---

## 🎯 Feature: UICard Step

**Status**: Backlog  
**Priority**: High  
**Estimated Effort**: Large (Multi-sprint feature)  
**Added**: 2025-01-27

### Overview

The **UICard Step** is a new node type that enables human-in-the-loop workflows by allowing creators to:
1. **Present data** visually to end-users during workflow execution
2. **Collect data** from end-users through customizable inputs
3. **Define the layout and behavior** of the card in a dedicated editor

This makes the workflow manager capable of hybrid AI + human-in-the-loop processes.

### Goals

- Enable users to insert UICard nodes into workflow diagrams
- Provide a UICard Editor to visually design cards
- Support both display elements (text, images, tables) and input elements (fields, selectors, toggles)
- Allow downstream steps to use data captured by the card

### Success Criteria

- Users can design a fully functional card without touching code
- 100% of UICard-defined data is accessible to later steps in the flow
- UICards render consistently across desktop and mobile
- Flow creators report that UICards reduce manual intervention and increase clarity

---

## Functional Requirements

### 3.1 UICard Node Features

- Node can be added from the left-side palette
- Node displays:
  - Card name
  - Summary of fields used in the card
  - Link/button to edit the card
- Node supports:
  - Inputs (connections from data sources)
  - Outputs (captured values handed to subsequent steps)

### 3.2 UICard Editor

A separate editor panel or modal used to design the card.

#### Layout System
- Drag-and-drop block-based layout
- Stack/grid or section-based structure
- Resizing and reordering of components

#### Visual Elements (Static or AI-fetched)
- Title text
- Paragraph/body text
- Bullet lists
- Images (upload or dynamic URL)
- Tables (manual or data-bound)
- Divider lines
- Highlight boxes / callouts

#### Input Components (Data Collection)
- Text input (single line)
- Text area (multiline)
- Dropdown (single/multi-select)
- Radio buttons
- Checkboxes
- Toggle switches
- Date/time pickers
- File upload
- Signature block (optional phase 2)

All inputs generate a **field key** available later in the flow.

#### Dynamic Data Binding

Cards must support pulling in data from:
- Previous steps
- Workflow variables
- API responses
- AI model outputs

Binding method:
- Click any dynamic text area → "Bind Data" menu appears

#### Card Settings
- Card name / internal key
- Visibility rules (optional phase 2)
- Validation rules:
  - Required fields
  - Regex
  - Min/Max character length
- Default values for inputs
- Conditional display rules (phase 2)

### 3.3 Runtime Behavior

#### Rendering
When the workflow reaches a UICard:
- The card is displayed to the user
- Dynamic data placeholders are filled
- Required validations prevent advancing until satisfied

#### User Interaction Logging
For audit & analytics:
- Rendered timestamp
- Submission timestamp
- Field-level values
- Validation errors (optional)
- User identity/session info

#### Output
On submission, card outputs:
```json
{
  "cardKey": "customer_review_card",
  "values": {
    "name": "John Doe",
    "approval": "approved",
    "notes": "Looks great."
  }
}
```

This payload becomes available to:
- Next nodes
- AI prompts
- API calls
- Conditional routing nodes

---

## Technical Requirements

### Data Model

`UICard` object includes:
```json
{
  "id": "uuid",
  "name": "string",
  "layout": [ ...blocks ],
  "fields": [
    {
      "key": "string",
      "type": "string",
      "label": "string",
      "validation": { ... }
    }
  ],
  "bindings": {
    "textComponents": { ... },
    "inputDefaults": { ... }
  }
}
```

### Editor Architecture
- React component registry for drag-and-drop blocks
- JSON-based configuration for layout
- Autosave to workflow draft
- Preview mode

### Execution Engine Requirements
- Must pause workflow until the card is completed
- Must store card results in workflow context
- Must support resumable sessions
- Must push card renders through front-end or embedding SDK

### Security & Compliance
- Field-level permissions (phase 2)
- Sanitized input (XSS protection)
- Secure file upload pipeline
- Role-based access for who may design/edit cards

---

## User Experience Requirements

### Workflow Designer UX
- Adding a card should feel like adding any other step
- Card editor opens in a modal or side panel
- Inputs must show live sample data where possible
- Clear mapping of UICard outputs to next-step inputs

### Runtime UX
- Clean, readable layout
- Mobile responsive
- Progress indicator showing that this is a step in a longer flow
- Error messages are clear and human-friendly

---

## Non-Functional Requirements

- **Performance:** Card render time < 200 ms
- **Scalability:** Must support large flows with many cards
- **Localization:** All text and labels must support i18n
- **Auditability:** All user submissions logged securely
- **Accessibility:** WCAG 2.1 compliance

---

## Open Questions

1. Should UICards support **branching logic** (show/hide fields based on user choices)?
2. Do cards need a **template system** (e.g., "Approval Card," "Form Card," "Review Card")?
3. Must cards support **AI auto-generated layouts** based on prompts?
4. Will users eventually embed these UICards externally (via iframe / widget)?
5. Should cards support **versioning** so updates don't break running flows?

---

## Phase Breakdown

### Phase 1 (Core MVP)
- Add UICard node
- Card editor with text + basic inputs
- Dynamic data binding
- Runtime submission and routing
- Data exposed to downstream steps

### Phase 2 (Enhancements)
- Conditional fields
- Card templates
- AI-assisted card creation
- Media uploads
- Advanced layout controls

### Phase 3 (Enterprise)
- Permissions & roles
- Versioning & draft states
- Embeddable UICard runtime SDK
- Analytics dashboards

---

## Dependencies

- Workflow Designer (✅ Complete)
- Workflow Execution Engine (✅ Complete)
- Real-time Event System (✅ Complete)
- Workflow Context/Variables (✅ Complete)

## Related Features

- Workflow Designer - Visual node editor
- Workflow Execution - Runtime engine
- Action Executor - Node action execution
- Workflow Templates - Template library

---

## Notes

- This is a significant feature that will require multiple sprints
- Consider starting with Phase 1 MVP to validate the concept
- May require new database tables for card definitions and submissions
- Runtime rendering will need a new UI component separate from the designer

---

## 🎯 Feature: File System Actions

**Status**: Backlog  
**Priority**: Medium  
**Estimated Effort**: Medium (1-2 sprints)  
**Added**: 2025-01-27

### Overview

Add workflow actions for common file system operations to enable workflows to interact with files and folders. These actions will allow workflows to:
1. **List files in a folder** - Search for documents/files in a directory
2. **Move files** - Move files from one location to another
3. **Delete files** - Remove files from the filesystem
4. **Rename files** - Change file names

This enables workflows to manage documents, organize files, and automate file-based processes.

### Goals

- Enable workflows to perform file system operations as part of automation
- Support file operations in workflow actions (similar to LLM, Document, Variable actions)
- Integrate with existing `FileConnector` infrastructure
- Respect file sandbox security (when implemented)

### Success Criteria

- Can add file system actions to workflow nodes
- Actions execute file operations correctly
- File operations respect sandbox restrictions
- Operations can use workflow variables for paths
- Error handling for file not found, permission errors, etc.

---

## Functional Requirements

### File System Action Types

#### 1. List Files in Folder
- **Action Type**: `file.list`
- **Configuration**:
  - `folderPath` (string) - Directory path to search
  - `pattern` (string, optional) - File pattern/glob (e.g., "*.pdf", "*.docx")
  - `recursive` (boolean, optional) - Search subdirectories
  - `outputVariable` (string) - Variable name to store results array
- **Output**: Array of file objects with:
  - `path` (string) - Full file path
  - `name` (string) - File name
  - `size` (number) - File size in bytes
  - `modified` (string) - Last modified timestamp
  - `type` (string) - File extension/type

#### 2. Move File
- **Action Type**: `file.move`
- **Configuration**:
  - `sourcePath` (string) - Source file path
  - `destinationPath` (string) - Destination file path
  - `overwrite` (boolean, optional) - Overwrite if destination exists
- **Output**: Success/failure status, new file path

#### 3. Delete File
- **Action Type**: `file.delete`
- **Configuration**:
  - `filePath` (string) - Path to file to delete
  - `failIfMissing` (boolean, optional) - Throw error if file doesn't exist
- **Output**: Success/failure status

#### 4. Rename File
- **Action Type**: `file.rename`
- **Configuration**:
  - `filePath` (string) - Current file path
  - `newName` (string) - New file name (or full path)
  - `overwrite` (boolean, optional) - Overwrite if new name exists
- **Output**: Success/failure status, new file path

### Integration Points

- **ActionExecutor**: Add new action types to `execute()` method
- **Workflow Designer**: Add file action options to action type dropdown
- **FileConnector**: Extend with new methods (listFiles, moveFile, deleteFile, renameFile)
- **FileSandboxGuard**: Enforce sandbox restrictions (when implemented)
- **Error Handling**: Handle file not found, permission errors, path validation

### Variable Support

All file actions should support:
- Variable interpolation in paths (e.g., `{{documentPath}}/output.pdf`)
- Storing results in workflow context variables
- Using variables from previous steps

---

## Technical Requirements

### FileConnector Extensions

Extend `FileConnector` class with:
```typescript
listFiles(folderPath: string, options?: {
  pattern?: string
  recursive?: boolean
}): FileInfo[]

moveFile(sourcePath: string, destinationPath: string, options?: {
  overwrite?: boolean
}): string

deleteFile(filePath: string, options?: {
  failIfMissing?: boolean
}): void

renameFile(filePath: string, newName: string, options?: {
  overwrite?: boolean
}): string
```

### ActionExecutor Integration

Add to `ActionExecutor.execute()`:
- `case 'file.list'`: Execute list files action
- `case 'file.move'`: Execute move file action
- `case 'file.delete'`: Execute delete file action
- `case 'file.rename'`: Execute rename file action

### Security Considerations

- All file operations must respect `FileSandboxGuard` restrictions
- Path validation to prevent directory traversal attacks
- Permission checks before file operations
- Audit logging for file operations (delete, move)

### Error Handling

- File not found errors
- Permission denied errors
- Invalid path errors
- Disk full errors
- File in use errors

---

## User Experience Requirements

### Workflow Designer

- File actions appear in action type dropdown alongside LLM, Document, Variable
- Configuration UI for each file action type
- Path input fields with variable binding support
- Validation feedback for invalid paths
- Preview of resolved paths (with variables interpolated)

### Runtime Execution

- Clear error messages for file operation failures
- Progress indicators for long-running operations (large file moves)
- Logging of file operations in execution view

---

## Non-Functional Requirements

- **Performance**: File operations should complete quickly (< 1s for typical operations)
- **Security**: All operations must respect sandbox restrictions
- **Reliability**: Handle edge cases (file locked, network drives, etc.)
- **Auditability**: Log all file operations to audit log

---

## Dependencies

- ✅ `FileConnector` (exists, needs extension)
- ❌ `FileSandboxGuard` (needs implementation - Sprint 8)
- ✅ `ActionExecutor` (exists, needs extension)
- ✅ Workflow Designer (exists, needs UI updates)
- ✅ Workflow Context/Variables (exists)

---

## Implementation Phases

### Phase 1 (Core Actions)
- Implement `listFiles`, `moveFile`, `deleteFile`, `renameFile` in `FileConnector`
- Add action types to `ActionExecutor`
- Add UI configuration in Workflow Designer
- Basic error handling

### Phase 2 (Enhancements)
- Recursive file listing
- File pattern matching (glob support)
- Batch operations (move/delete multiple files)
- File metadata extraction (size, modified date, etc.)

### Phase 3 (Advanced)
- File watching/monitoring
- File compression/decompression
- File comparison/diff
- File permissions management

---

## Related Features

- Document Generation - Often needs to move/rename generated documents
- File Sandbox - Security enforcement for file operations
- Workflow Templates - Templates may include file operations
- Audit Logging - Track file operations for compliance

---

## Notes

- Consider adding file copy action as well (similar to move)
- May want to add folder operations (create folder, delete folder) in future
- Integration with document registry for tracking file operations on registered documents

