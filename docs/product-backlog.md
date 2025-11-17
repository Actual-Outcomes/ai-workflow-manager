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

---

## 🎯 Feature: Right-Click Context Menu for Nodes and Connectors

**Status**: Backlog  
**Priority**: Medium  
**Estimated Effort**: Small-Medium (1 sprint)  
**Added**: 2025-01-27

### Overview

Add right-click context menus to workflow nodes and edge connectors (connections between nodes) to provide quick access to common operations without navigating through the property panel or toolbar.

### Goals

- Provide intuitive right-click access to node and connector operations
- Reduce clicks needed for common actions
- Improve workflow designer efficiency
- Maintain consistency with existing UI patterns

### Success Criteria

- Right-click on any node shows a context menu with relevant actions
- Right-click on any connector/edge shows a context menu with edge-specific actions
- Context menu actions work identically to toolbar/property panel actions
- Menu appears at cursor position and closes on selection or outside click

---

## Functional Requirements

### Node Context Menu

When right-clicking on a workflow node, show a menu with:

- **Configure** - Opens the property panel for this node (same as left-click)
- **Delete** - Delete the node (with confirmation)
- **Duplicate** - Create a copy of the node (future enhancement)
- **Copy** - Copy node configuration to clipboard (future enhancement)
- **Paste** - Paste node from clipboard (future enhancement)

### Connector/Edge Context Menu

When right-clicking on a connection (edge) between nodes, show a menu with:

- **Delete** - Remove the connection (with confirmation)
- **Configure** - Open edge properties/configuration (if edge configuration is added in future)
- **Reverse** - Swap source and target nodes (future enhancement)

### Menu Behavior

- Menu appears at cursor position (or near the node/edge if cursor is off-screen)
- Menu closes when:
  - An action is selected
  - User clicks outside the menu
  - User presses Escape
  - User right-clicks again
- Menu items are disabled when action is not applicable (e.g., can't delete Start node)
- Menu supports keyboard navigation (arrow keys, Enter to select)

---

## Technical Requirements

### Implementation

- Create a reusable `ContextMenu` React component
- Integrate with React Flow's `onNodeContextMenu` and `onEdgeContextMenu` events
- Position menu using cursor coordinates or node/edge position
- Handle menu state (open/closed, selected item)
- Integrate with existing action handlers (delete, configure, etc.)

### React Flow Integration

```typescript
<ReactFlow
  onNodeContextMenu={(event, node) => {
    event.preventDefault()
    showNodeContextMenu(event.clientX, event.clientY, node)
  }}
  onEdgeContextMenu={(event, edge) => {
    event.preventDefault()
    showEdgeContextMenu(event.clientX, event.clientY, edge)
  }}
  // ... other props
/>
```

### Context Menu Component

```typescript
interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

interface ContextMenuItem {
  label: string
  action: () => void
  disabled?: boolean
  icon?: string
}
```

### Styling

- Dark theme to match existing UI
- Hover effects on menu items
- Visual feedback for disabled items
- Smooth animations for open/close
- Z-index to appear above all other elements

---

## User Experience Requirements

### Visual Design

- Menu should match the existing dark theme (`#1a1a1a` background)
- Menu items should have clear hover states
- Icons (if added) should be consistent with existing iconography
- Menu should not obscure the node/edge being acted upon

### Accessibility

- Keyboard navigation support
- Screen reader announcements for menu actions
- Focus management (focus returns to canvas after menu closes)

### Performance

- Menu should appear instantly (< 50ms)
- No lag when right-clicking multiple times
- Smooth animations

---

## Non-Functional Requirements

- **Performance**: Menu appears instantly, no perceptible delay
- **Accessibility**: Full keyboard navigation and screen reader support
- **Consistency**: Matches existing UI patterns and styling
- **Reliability**: Menu always closes properly, no stuck states

---

## Dependencies

- ✅ Workflow Designer (exists)
- ✅ Node deletion functionality (exists)
- ✅ Property panel (exists)
- ✅ ConfirmationModal (exists, can be reused for delete confirmations)

---

## Implementation Phases

### Phase 1 (MVP)
- Create `ContextMenu` component
- Add right-click handlers for nodes
- Implement Delete and Configure actions
- Basic styling and positioning

### Phase 2 (Enhancements)
- Add right-click handlers for edges/connectors
- Add Duplicate, Copy, Paste actions for nodes
- Add Reverse action for edges
- Keyboard navigation
- Icons for menu items

### Phase 3 (Advanced)
- Edge configuration panel
- Batch operations (select multiple nodes, right-click)
- Custom actions via plugins/extensions

---

## Related Features

- Workflow Designer - Main component where context menus will be used
- Node Configuration - Property panel integration
- Confirmation Modal - Reuse for delete confirmations
- Workflow Templates - May benefit from copy/paste functionality

---

## Notes

- Consider using a library like `react-contextmenu` or `react-menu` if available
- May want to add context menu to other areas (workflow list, connector list) in future
- Context menu could be extended to support custom actions per node type

---

## 🎯 Feature: Node Alignment and Multi-Selection

**Status**: Backlog  
**Priority**: Medium  
**Estimated Effort**: Small-Medium (1 sprint)  
**Added**: 2025-01-27

### Overview

Add multi-selection capabilities and alignment tools to the Workflow Designer, allowing users to select multiple nodes and align them horizontally (left, center, right) or vertically (top, middle, bottom). This improves workflow diagram organization and visual consistency.

### Goals

- Enable selection of multiple nodes simultaneously
- Provide alignment tools for organizing node layouts
- Improve visual consistency of workflow diagrams
- Reduce manual positioning effort

### Success Criteria

- Users can select multiple nodes using Ctrl/Cmd+Click or drag selection
- Selected nodes are visually distinct with selection indicators
- Alignment toolbar appears when multiple nodes are selected
- All alignment operations (left, center, right, top, middle, bottom) work correctly
- Alignment operations preserve node relationships and connections

---

## Functional Requirements

### Multi-Selection

- **Selection Methods**:
  - Ctrl/Cmd + Click to add/remove nodes from selection
  - Shift + Click to select a range of nodes
  - Drag selection box to select multiple nodes
  - Ctrl/Cmd + A to select all nodes
- **Selection Indicators**:
  - Selected nodes show a visual border/highlight
  - Selection handles or indicators on selected nodes
  - Selection count displayed in toolbar
- **Deselection**:
  - Click on empty canvas to deselect all
  - Click on a selected node (without modifier) to select only that node
  - Escape key to deselect all

### Alignment Operations

When multiple nodes are selected, show an alignment toolbar with:

- **Horizontal Alignment**:
  - **Left** - Align all selected nodes to the leftmost node's X position
  - **Center** - Align all selected nodes to the center X position of the selection
  - **Right** - Align all selected nodes to the rightmost node's X position
- **Vertical Alignment**:
  - **Top** - Align all selected nodes to the topmost node's Y position
  - **Middle** - Align all selected nodes to the middle Y position of the selection
  - **Bottom** - Align all selected nodes to the bottommost node's Y position
- **Distribution** (Future Enhancement):
  - Distribute nodes evenly horizontally
  - Distribute nodes evenly vertically

### Alignment Behavior

- Alignment operations preserve node connections (edges)
- Alignment is relative to the selection bounds, not the canvas
- After alignment, nodes remain selected for further operations
- Undo/Redo support for alignment operations (if undo system exists)

---

## Technical Requirements

### React Flow Integration

React Flow provides built-in multi-selection support:
- `nodesDraggable={true}` - Allow node dragging
- `nodesConnectable={true}` - Allow connections
- `selectNodesOnDrag={false}` - Control selection behavior
- `multiSelectionKeyCode={['Meta', 'Control']}` - Multi-select modifier key
- `selectionOnDrag={true}` - Enable drag selection box
- `selectionMode={SelectionMode.Full}` - Selection mode

### Selection State Management

```typescript
const [selectedNodes, setSelectedNodes] = useState<string[]>([])
const onSelectionChange = useCallback((params: { nodes: Node[] }) => {
  setSelectedNodes(params.nodes.map(n => n.id))
}, [])
```

### Alignment Calculations

```typescript
// Horizontal alignment examples
const alignLeft = (nodes: Node[]) => {
  const leftmostX = Math.min(...nodes.map(n => n.position.x))
  return nodes.map(n => ({ ...n, position: { ...n.position, x: leftmostX } }))
}

const alignCenter = (nodes: Node[]) => {
  const bounds = getSelectionBounds(nodes)
  const centerX = bounds.left + bounds.width / 2
  return nodes.map(n => ({
    ...n,
    position: { ...n.position, x: centerX - n.width / 2 }
  }))
}

const alignRight = (nodes: Node[]) => {
  const rightmostX = Math.max(...nodes.map(n => n.position.x + n.width))
  return nodes.map(n => ({
    ...n,
    position: { ...n.position, x: rightmostX - n.width }
  }))
}
```

### Visual Selection Indicators

- Add CSS class or style to selected nodes
- Use React Flow's `selected` state on nodes
- Custom styling for selected node borders/highlights
- Selection handles or resize indicators (optional)

---

## User Experience Requirements

### Visual Design

- Selected nodes should have a clear visual indicator:
  - Border color change (e.g., bright blue or accent color)
  - Background highlight (subtle)
  - Selection handles or corner indicators
- Alignment toolbar should:
  - Appear when 2+ nodes are selected
  - Match existing toolbar styling
  - Show icons for each alignment option
  - Be positioned near selection or in main toolbar

### Interaction

- Multi-selection should feel intuitive and responsive
- Alignment operations should be instant with visual feedback
- Toolbar should auto-hide when selection is cleared
- Keyboard shortcuts for alignment (optional):
  - Ctrl/Cmd + Shift + L = Align Left
  - Ctrl/Cmd + Shift + C = Align Center
  - Ctrl/Cmd + Shift + R = Align Right
  - Ctrl/Cmd + Shift + T = Align Top
  - Ctrl/Cmd + Shift + M = Align Middle
  - Ctrl/Cmd + Shift + B = Align Bottom

### Accessibility

- Keyboard navigation for selection
- Screen reader announcements for selection changes
- Clear visual feedback for all operations

---

## Non-Functional Requirements

- **Performance**: Selection and alignment operations should be instant (< 100ms)
- **Usability**: Intuitive multi-selection that matches common design tool patterns
- **Consistency**: Alignment behavior matches standard design tools (Figma, Sketch, etc.)
- **Reliability**: Selection state is always accurate and synchronized

---

## Dependencies

- ✅ Workflow Designer (exists)
- ✅ React Flow (supports multi-selection natively)
- ✅ Node positioning system (exists)
- ❌ Undo/Redo system (optional, for future enhancement)

---

## Implementation Phases

### Phase 1 (MVP)
- Enable React Flow multi-selection
- Add visual selection indicators to nodes
- Implement basic alignment operations (left, center, right, top, middle, bottom)
- Add alignment toolbar that appears on multi-selection
- Preserve connections during alignment

### Phase 2 (Enhancements)
- Add distribution operations (even spacing)
- Keyboard shortcuts for alignment
- Selection persistence across operations
- Group selection (select all connected nodes)

### Phase 3 (Advanced)
- Snap to grid alignment
- Alignment guides/rulers
- Smart alignment (align to canvas, align to other nodes)
- Alignment history/undo

---

## Related Features

- Workflow Designer - Main component where alignment will be used
- Node Positioning - Alignment modifies node positions
- Context Menu - Could include alignment options
- Workflow Templates - Templates may benefit from alignment tools

---

## Notes

- React Flow has built-in multi-selection support that can be enabled with props
- Consider using React Flow's `SelectionMode` for different selection behaviors
- Alignment calculations need to account for node dimensions (width/height)
- May want to add "distribute evenly" feature in future
- Consider adding alignment to the right-click context menu as well

---

## 🎯 Feature: Node Resizing with Corner Grabbers

**Status**: Backlog  
**Priority**: Medium  
**Estimated Effort**: Medium (1 sprint)  
**Added**: 2025-01-27

### Overview

Add the ability to resize workflow nodes by dragging corner grabbers (resize handles) when a node is selected. This allows users to customize node sizes to accommodate longer labels, better fit content, or improve diagram layout.

### Goals

- Enable visual resizing of nodes through intuitive corner grabbers
- Support resizing for all node types (Start, Action, Conditional, End)
- Maintain node proportions and minimum/maximum size constraints
- Preserve node connections and relationships during resize
- Store resize dimensions in node metadata for persistence

### Success Criteria

- Selected nodes display corner grabbers (resize handles)
- Users can drag corner grabbers to resize nodes smoothly
- Resize operations preserve node connections (edges)
- Node dimensions are saved and restored when reopening workflows
- Minimum and maximum size constraints prevent invalid node sizes
- Resize handles are clearly visible and easy to interact with

---

## Functional Requirements

### Resize Handles (Corner Grabbers)

- **Visual Indicators**:
  - Display 4 corner grabbers (top-left, top-right, bottom-left, bottom-right) on selected nodes
  - Grabbers should be small squares or circles at node corners
  - Grabbers should be visually distinct (different color, border, or glow)
  - Grabbers should show hover state (cursor change, color change)
- **Interaction**:
  - Click and drag any corner grabber to resize the node
  - Resize maintains aspect ratio (optional, configurable per node type)
  - Resize updates in real-time as user drags
  - Release mouse to complete resize operation

### Resize Behavior

- **Size Constraints**:
  - Minimum width: 80px (prevents nodes from becoming too small)
  - Minimum height: 60px (prevents nodes from becoming too small)
  - Maximum width: 500px (prevents nodes from becoming too large)
  - Maximum height: 400px (prevents nodes from becoming too large)
  - Different constraints may apply to different node types (e.g., Conditional nodes are square)
- **Aspect Ratio**:
  - Conditional nodes: Maintain 1:1 aspect ratio (square)
  - End nodes: Maintain 1:1 aspect ratio (circle)
  - Start and Action nodes: Free aspect ratio (can be rectangular)
- **Content Adaptation**:
  - Text/labels should wrap or truncate based on new size
  - Icons should scale proportionally
  - Internal padding should adjust if needed

### Persistence

- Node dimensions (width, height) stored in node metadata
- Dimensions restored when workflow is reopened
- Default dimensions used if no saved dimensions exist
- Resize operations trigger auto-save (if auto-save is enabled)

---

## Technical Requirements

### React Flow Integration

React Flow provides `NodeResizer` component for node resizing:
```typescript
import { NodeResizer } from 'reactflow'

<NodeResizer
  minWidth={80}
  minHeight={60}
  maxWidth={500}
  maxHeight={400}
  isVisible={selected}
  handleStyle={{
    background: '#3b82f6',
    border: '1px solid #fff',
    borderRadius: '50%'
  }}
/>
```

### Node Component Updates

Each node component needs to:
1. Accept `selected` prop (already implemented)
2. Include `NodeResizer` component when selected
3. Store dimensions in node data/metadata
4. Apply saved dimensions on load

### Dimension Storage

Store dimensions in node metadata:
```typescript
{
  id: 'node-123',
  type: 'action',
  position: { x: 100, y: 100 },
  data: {
    label: 'Action',
    // ... other data
  },
  metadata: {
    position: { x: 100, y: 100 },
    dimensions: { width: 140, height: 60 } // NEW
  }
}
```

### Resize Handler

```typescript
const onResize = useCallback((_event: any, params: { width: number; height: number }) => {
  setNodes((nds) =>
    nds.map((node) => {
      if (node.id === selectedNodeId) {
        return {
          ...node,
          width: params.width,
          height: params.height,
          data: {
            ...node.data,
            metadata: {
              ...node.data.metadata,
              dimensions: { width: params.width, height: params.height }
            }
          }
        }
      }
      return node
    })
  )
  // Trigger auto-save
}, [selectedNodeId, setNodes])
```

### Node Type-Specific Constraints

- **Start Node**: Free aspect ratio, min 80x60, max 500x400
- **Action Node**: Free aspect ratio, min 80x60, max 500x400
- **Conditional Node**: 1:1 aspect ratio (square), min 80x80, max 300x300
- **End Node**: 1:1 aspect ratio (circle), min 80x80, max 200x200

---

## User Experience Requirements

### Visual Design

- **Resize Handles**:
  - Small circular or square indicators at node corners
  - Color: Accent color matching node type (blue for Start, purple for Action, etc.)
  - Size: 8-10px diameter
  - Border: White or light border for visibility
  - Hover: Slightly larger, brighter color, cursor changes to resize cursor
- **Selection State**:
  - Handles only visible when node is selected
  - Handles fade in/out smoothly
  - Handles don't interfere with node content or connection handles

### Interaction

- **Resize Cursor**:
  - Cursor changes to resize cursors (nwse-resize, nesw-resize) when hovering over handles
  - Cursor indicates resize direction
- **Feedback**:
  - Real-time visual feedback during resize
  - Node dimensions could be displayed temporarily during resize (optional)
  - Snap to grid or snap to common sizes (optional, future enhancement)

### Accessibility

- Keyboard support for resizing (optional, future enhancement)
- Screen reader announcements for resize operations
- Clear visual indicators for resize handles

---

## Non-Functional Requirements

- **Performance**: Resize operations should be smooth (60fps) with no lag
- **Usability**: Resize handles should be easy to grab and drag
- **Consistency**: Resize behavior matches standard design tools (Figma, Sketch, etc.)
- **Reliability**: Dimensions are always saved correctly and restored accurately

---

## Dependencies

- ✅ Workflow Designer (exists)
- ✅ React Flow (provides `NodeResizer` component)
- ✅ Node selection system (exists)
- ✅ Node metadata storage (exists)
- ✅ Auto-save functionality (exists)

---

## Implementation Phases

### Phase 1 (MVP)
- Add `NodeResizer` to all node components
- Implement basic resize with corner grabbers
- Add minimum/maximum size constraints
- Store dimensions in node metadata
- Restore dimensions on workflow load
- Visual styling for resize handles

### Phase 2 (Enhancements)
- Aspect ratio locking for Conditional and End nodes
- Resize handles for edges (top, bottom, left, right) in addition to corners
- Snap to grid during resize
- Display dimensions during resize (temporary overlay)
- Keyboard shortcuts for resize (arrow keys with modifiers)

### Phase 3 (Advanced)
- Resize multiple selected nodes simultaneously
- Maintain relative positions when resizing multiple nodes
- Smart resize (auto-adjust content based on size)
- Resize templates/presets (small, medium, large)
- Undo/Redo support for resize operations

---

## Related Features

- Workflow Designer - Main component where resizing will be used
- Node Selection - Resize handles only appear on selected nodes
- Node Alignment - Resize may affect alignment operations
- Node Positioning - Resize may affect node positioning calculations
- Context Menu - Could include resize options

---

## Notes

- React Flow's `NodeResizer` component provides built-in resize functionality
- Need to ensure resize handles don't conflict with connection handles
- Consider adding resize handles to edges (sides) in addition to corners
- May want to add "reset size" option to restore default dimensions
- Resize operations should trigger auto-save to preserve changes
- Consider adding visual guides (grid, alignment lines) during resize

---

## 🎯 Feature: ShadCN UI Component Library Integration

**Status**: Backlog  
**Priority**: High  
**Estimated Effort**: Large (Multi-sprint)  
**Added**: 2025-01-27

### Overview

Integrate [ShadCN UI](https://ui.shadcn.com/) component library throughout the application to replace custom-styled components with a consistent, accessible, and modern design system. This will improve UI consistency, accessibility, and maintainability while providing better user experience with professional components.

### Goals

- Replace custom form inputs, buttons, modals, and other UI components with ShadCN components
- Establish consistent design system across the entire application
- Improve accessibility (WCAG compliance) through ShadCN's built-in accessibility features
- Reduce custom CSS and styling code
- Provide better time pickers, date pickers, and other form controls
- Enhance overall visual polish and user experience

### Success Criteria

- All form inputs use ShadCN components (Input, Select, Textarea, etc.)
- All buttons use ShadCN Button component
- All modals/dialogs use ShadCN Dialog component
- Time pickers use ShadCN-compatible time picker component
- Date pickers use ShadCN Calendar component
- Consistent theming throughout the application
- All components pass accessibility checks
- Reduced custom CSS by 50%+

---

## Functional Requirements

### Component Replacements

#### Form Components
- **Input** - Replace all `<input>` elements with ShadCN Input component
- **Select** - Replace all `<select>` elements with ShadCN Select component
- **Textarea** - Replace all `<textarea>` elements with ShadCN Textarea component
- **Checkbox** - Replace all checkboxes with ShadCN Checkbox component
- **Radio Group** - Replace radio buttons with ShadCN RadioGroup component
- **Switch** - Replace toggle switches with ShadCN Switch component
- **Label** - Use ShadCN Label component for all form labels

#### Time & Date Pickers
- **Time Picker** - Implement ShadCN-compatible time picker for schedule forms
- **Date Picker** - Use ShadCN Calendar component for date selection
- **Date Range Picker** - For date range selections (if needed)

#### Dialog & Modals
- **Dialog** - Replace custom modals with ShadCN Dialog component
- **Alert Dialog** - Use ShadCN AlertDialog for confirmations
- **Sheet** - Use ShadCN Sheet for slide-out panels (if applicable)

#### Data Display
- **Table** - Replace custom tables with ShadCN Table component
- **Card** - Replace custom cards with ShadCN Card component
- **Badge** - Use ShadCN Badge for status indicators
- **Tabs** - Replace custom tab switcher with ShadCN Tabs component

#### Navigation & Layout
- **Button** - Replace all buttons with ShadCN Button component
- **Dropdown Menu** - Use ShadCN DropdownMenu for context menus
- **Popover** - Use ShadCN Popover for tooltips and popovers
- **Tooltip** - Use ShadCN Tooltip component

#### Feedback
- **Toast** - Implement ShadCN Toast for notifications
- **Alert** - Use ShadCN Alert for error/success messages
- **Progress** - Use ShadCN Progress for loading indicators
- **Skeleton** - Use ShadCN Skeleton for loading states

---

## Technical Requirements

### Installation & Setup

```bash
npm install shadcn-ui
npx shadcn-ui@latest init
```

### Configuration

- Configure ShadCN with dark theme to match current application theme
- Set up component path aliases
- Configure Tailwind CSS (if not already configured)
- Set up component registry

### Component Integration

1. **Phase 1: Core Components**
   - Install and configure ShadCN
   - Replace buttons, inputs, selects
   - Replace modals/dialogs
   - Update form components in settings

2. **Phase 2: Advanced Components**
   - Implement time picker
   - Implement date picker
   - Replace tables and cards
   - Add toast notifications

3. **Phase 3: Polish**
   - Replace all remaining custom components
   - Add tooltips and popovers
   - Implement consistent loading states
   - Final accessibility audit

### Theme Customization

- Match ShadCN theme colors to current dark theme
- Customize component variants to match brand
- Ensure consistent spacing and typography
- Maintain current color scheme (purple gradients, etc.)

### Migration Strategy

- Migrate one screen/section at a time
- Maintain backward compatibility during migration
- Test each component replacement thoroughly
- Update documentation as components are replaced

---

## User Experience Requirements

### Visual Design

- Maintain current dark theme aesthetic
- Preserve existing color scheme and gradients
- Ensure smooth transition (no visual jarring)
- Improve visual consistency across all screens

### Accessibility

- All components must meet WCAG 2.1 AA standards
- Keyboard navigation for all interactive elements
- Screen reader support
- Focus management in modals and dialogs
- Proper ARIA labels and roles

### Performance

- No performance degradation from component library
- Lazy load components where appropriate
- Optimize bundle size

---

## Non-Functional Requirements

- **Consistency**: All UI components follow ShadCN design system
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: No increase in bundle size > 10%
- **Maintainability**: Reduced custom CSS, easier to maintain
- **Documentation**: All new components documented

---

## Dependencies

- ✅ React 18 (required)
- ✅ TypeScript (required)
- ❌ Tailwind CSS (needs to be added if not present)
- ❌ ShadCN UI library (needs installation)
- ✅ Vite build system (compatible)

---

## Implementation Phases

### Phase 1 (Sprint 9 - Foundation)
- Install and configure ShadCN UI
- Set up Tailwind CSS (if needed)
- Configure theme to match current dark theme
- Replace core form components (Input, Select, Button, Label)
- Replace modals with Dialog component
- Update Settings screen with ShadCN components

### Phase 2 (Sprint 10 - Advanced Components)
- Implement time picker component
- Implement date picker/calendar
- Replace tables with ShadCN Table
- Replace cards with ShadCN Card
- Add toast notifications
- Update Workflow Designer with ShadCN components

### Phase 3 (Sprint 11 - Polish & Completion)
- Replace all remaining custom components
- Add tooltips and popovers
- Implement consistent loading states (Skeleton)
- Accessibility audit and fixes
- Remove unused custom CSS
- Documentation updates

---

## Related Features

- Settings UI - Will benefit from ShadCN form components
- Workflow Designer - Will use ShadCN for property panels
- Scheduler UI - Will use ShadCN time picker
- Connector Management - Will use ShadCN form components
- All existing UI screens - Will be migrated to ShadCN

---

## Notes

- ShadCN UI is built on Radix UI primitives, providing excellent accessibility out of the box
- Components are copy-pasteable and customizable
- Dark theme support is built-in
- Time picker may need a custom implementation or third-party library compatible with ShadCN
- Consider using `react-day-picker` for date picker (ShadCN compatible)
- Consider using `react-time-picker` or similar for time picker
- Migration can be done incrementally without breaking existing functionality
- ShadCN components are unstyled by default, allowing full customization to match current theme

