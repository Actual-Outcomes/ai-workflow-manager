# Sprint 9 Plan: UI/UX Enhancements & Component Library Integration

**Status**: Planning  
**Date**: 2025-01-27  
**Duration**: ~10-12 days  
**Focus**: Modern UI components, workflow designer enhancements, and user experience improvements

---

## 🎯 Sprint Goals

1. **Integrate ShadCN UI Component Library** - Replace native HTML form elements with modern, accessible components
2. **Enhance Workflow Designer** - Add multi-selection, alignment tools, and context menus
3. **Improve User Experience** - Better time pickers, consistent styling, and intuitive interactions

---

## 📋 Sprint Tasks

### Phase 1: ShadCN UI Integration (Days 1-4)

#### Task 1.1: Setup and Configuration
- [x] Install ShadCN UI dependencies (`shadcn-ui`, `@radix-ui/*` packages)
- [x] Configure Tailwind CSS (if not already configured)
- [x] Set up ShadCN CLI and component initialization
- [x] Create component configuration file (`components.json`)
- [x] Verify build process works with new dependencies
- [x] Update TypeScript config if needed

**Estimated Effort**: 4-6 hours  
**Dependencies**: None  
**Status**: ✅ Completed

#### Task 1.2: Core Component Replacements
- [x] Replace native `<input>` with ShadCN `Input` component
- [x] Replace native `<select>` with ShadCN `Select` component
- [x] Replace native `<button>` with ShadCN `Button` component
- [x] Replace native `<label>` with ShadCN `Label` component
- [x] Replace native `<textarea>` with ShadCN `Textarea` component
- [x] Update all form components in `App.tsx` (Connector forms, Schedule forms, Settings forms)
- [x] Ensure consistent styling and accessibility

**Estimated Effort**: 8-10 hours  
**Dependencies**: Task 1.1  
**Status**: ✅ Completed

#### Task 1.3: Component Library Creation
- [x] Create enhanced primitive components (FormField, StatusBadge, EmptyState, LoadingState)
- [x] Create composite components (Card, SectionHeader)
- [x] Create component index for barrel exports
- [x] Document component library in `docs/component-library.md`
- [x] Identify composite components to extract (DiagnosticCard, ConnectorCard, DraftCard, WorkflowCard, ScheduleForm, ConnectorForm)

**Estimated Effort**: 6-8 hours  
**Dependencies**: Task 1.1, Task 1.2  
**Status**: ✅ Completed

#### Task 1.4: Extract Composite Components
- [x] Extract `DiagnosticCard` component from App.tsx
- [x] Extract `ConnectorCard` component from App.tsx
- [x] Extract `DraftCard` component from App.tsx
- [x] Extract `WorkflowCard` component from App.tsx
- [x] Extract `ScheduleForm` component from App.tsx
- [x] Extract `ConnectorForm` component from App.tsx
- [x] Ensure all extracted components use ShadCN primitives
- [x] Test all extracted components in isolation

**Estimated Effort**: 8-10 hours  
**Dependencies**: Task 1.3  
**Status**: ✅ Completed

#### Task 1.5: Migrate Existing Code to New Components
- [x] Replace `ConfirmationModal` with ShadCN `AlertDialog` throughout application
- [x] Migrate form fields to use `FormField` component
- [x] Migrate empty states to use `EmptyState` component
- [x] Migrate loading states to use `LoadingState` component
- [x] Migrate status badges to use `StatusBadge` component
- [x] Migrate card patterns to use `Card` component
- [x] Migrate section headers to use `SectionHeader` component
- [x] Replace extracted composite components in App.tsx

**Estimated Effort**: 6-8 hours  
**Dependencies**: Task 1.4  
**Status**: ✅ Completed

#### Task 1.6: Dialog and Modal Components
- [x] Replace native `confirm()` with ShadCN `Dialog` component
- [x] Replace `ConfirmationModal` with ShadCN `AlertDialog` (part of Task 1.5)
- [x] Update `WorkflowDesigner.tsx` to use ShadCN dialogs
- [ ] Update template selection modal to use ShadCN `Dialog`
- [x] Ensure proper focus management and keyboard navigation

**Estimated Effort**: 4-6 hours  
**Dependencies**: Task 1.1, Task 1.5  
**Status**: 🟡 Mostly Complete (template selection modal pending)

#### Task 1.7: Time and Date Pickers
- [ ] Install and configure date/time picker component (e.g., `react-day-picker` or ShadCN-compatible picker)
- [ ] Replace time input in Schedule form with proper time picker
- [ ] Add date picker for any date selection needs
- [ ] Ensure timezone handling works correctly
- [ ] Test time picker with different timezone selections

**Estimated Effort**: 6-8 hours  
**Dependencies**: Task 1.1, Task 1.2, Task 1.4

#### Task 1.8: Settings Screen Updates
- [x] Update Settings tab with ShadCN components
- [x] Replace all form inputs with ShadCN equivalents
- [ ] Improve layout and spacing using Card components
- [ ] Add proper form validation feedback
- [ ] Ensure all editable fields work correctly

**Estimated Effort**: 4-6 hours  
**Dependencies**: Task 1.2, Task 1.4  
**Status**: 🟡 Partially Complete

**Phase 1 Total**: ~42-58 hours (5.5-7.5 days)

---

### Phase 2: Workflow Designer Enhancements (Days 5-8)

#### Task 2.1: Multi-Selection Implementation
- [ ] Enable React Flow multi-selection (`multiSelectionKeyCode`, `selectionOnDrag`)
- [ ] Add visual selection indicators to nodes (border, highlight, glow)
- [ ] Implement selection state management
- [ ] Add selection count display in toolbar
- [ ] Handle Ctrl/Cmd+Click, Shift+Click, and drag selection
- [ ] Add "Select All" (Ctrl/Cmd+A) functionality
- [ ] Ensure deselection works (click canvas, Escape key)

**Estimated Effort**: 6-8 hours  
**Dependencies**: None (React Flow already supports this)

#### Task 2.2: Alignment Toolbar
- [ ] Create alignment toolbar component
- [ ] Show toolbar when 2+ nodes are selected
- [ ] Implement horizontal alignment (left, center, right)
- [ ] Implement vertical alignment (top, middle, bottom)
- [ ] Calculate alignment positions based on selection bounds
- [ ] Update node positions in React Flow state
- [ ] Auto-save after alignment operations
- [ ] Add visual feedback during alignment

**Estimated Effort**: 8-10 hours  
**Dependencies**: Task 2.1

#### Task 2.3: Right-Click Context Menu
- [ ] Install context menu library (e.g., `@radix-ui/react-context-menu` or `react-contexify`)
- [ ] Create context menu component for nodes
- [ ] Add menu items: Delete, Duplicate, Copy, Cut, Paste, Align (if multiple selected)
- [ ] Create context menu component for edges (connectors)
- [ ] Add menu items for edges: Delete, Change Type, Properties
- [ ] Position menu at cursor location
- [ ] Handle keyboard shortcuts (Delete, Ctrl+C, Ctrl+V, etc.)
- [ ] Ensure menu closes on outside click or selection

**Estimated Effort**: 8-10 hours  
**Dependencies**: Task 1.1 (if using ShadCN/Radix), Task 2.1

#### Task 2.4: Node Resizing with Corner Grabbers
- [ ] Install/verify React Flow `NodeResizer` component
- [ ] Add resize handles to all node types (Start, Action, Conditional, End)
- [ ] Configure size constraints (min/max width/height)
- [ ] Set aspect ratio constraints (Conditional = square, End = square)
- [ ] Store dimensions in node metadata
- [ ] Load saved dimensions when reopening workflow
- [ ] Ensure connections (edges) update correctly during resize
- [ ] Add visual feedback for resize handles (hover states)

**Estimated Effort**: 6-8 hours  
**Dependencies**: None (React Flow provides `NodeResizer`)

**Phase 2 Total**: ~28-36 hours (3.5-4.5 days)

---

### Phase 3: Polish and Testing (Days 9-10)

#### Task 3.1: Visual Consistency
- [ ] Review all UI components for consistent styling
- [ ] Ensure color scheme matches across all ShadCN components
- [ ] Verify dark mode compatibility (if applicable)
- [ ] Check spacing and typography consistency
- [ ] Update CSS variables if needed

**Estimated Effort**: 4-6 hours

#### Task 3.2: Accessibility Audit
- [ ] Verify keyboard navigation works for all new components
- [ ] Check ARIA labels and roles
- [ ] Test with screen reader (if available)
- [ ] Ensure focus management is correct
- [ ] Verify color contrast ratios

**Estimated Effort**: 4-6 hours

#### Task 3.3: Integration Testing
- [ ] Test workflow designer with all new features
- [ ] Test schedule creation/editing with time picker
- [ ] Test connector management with new form components
- [ ] Test settings screen with all editable fields
- [ ] Verify auto-save still works correctly
- [ ] Test multi-selection and alignment with various node configurations
- [ ] Test context menu in different scenarios

**Estimated Effort**: 6-8 hours

#### Task 3.4: Bug Fixes and Refinements
- [ ] Fix any issues discovered during testing
- [ ] Optimize performance if needed
- [ ] Add loading states where appropriate
- [ ] Improve error messages
- [ ] Add tooltips for new features

**Estimated Effort**: 4-6 hours

**Phase 3 Total**: ~18-26 hours (2.5-3 days)

---

## 📊 Sprint Summary

### Total Estimated Effort
- **Phase 1 (ShadCN Integration)**: 42-58 hours (5.5-7.5 days)
  - ✅ Setup and Configuration: 4-6 hours
  - ✅ Core Component Replacements: 8-10 hours
  - ✅ Component Library Creation: 6-8 hours
  - ✅ Extract Composite Components: 8-10 hours
  - ✅ Migrate Existing Code: 6-8 hours
  - 🟡 Dialog and Modal Components: 4-6 hours (mostly complete, template modal pending)
  - ⏳ Time and Date Pickers: 6-8 hours
  - 🟡 Settings Screen Updates: 4-6 hours (partially complete)
- **Phase 2 (Designer Enhancements)**: 28-36 hours (3.5-4.5 days)
- **Phase 3 (Polish & Testing)**: 18-26 hours (2.5-3 days)
- **Total**: 88-120 hours (~11-15 days)

### Priority Order
1. **High Priority**: ShadCN UI Integration (Phase 1) - User requested, improves UX
2. **High Priority**: Multi-Selection & Alignment (Phase 2.1-2.2) - Core designer functionality
3. **Medium Priority**: Context Menu (Phase 2.3) - Nice-to-have enhancement
4. **Medium Priority**: Node Resizing (Phase 2.4) - Nice-to-have enhancement
5. **High Priority**: Polish & Testing (Phase 3) - Essential for quality

### Risk Mitigation
- **ShadCN Setup Complexity**: Start early, allow time for configuration issues
- **React Flow Integration**: Verify compatibility with ShadCN components
- **Performance**: Monitor bundle size increase from ShadCN dependencies
- **Breaking Changes**: Test thoroughly, especially form submissions and state management

---

## 🎯 Success Criteria

### ShadCN Integration
- ✅ All form inputs use ShadCN components
- ✅ Time picker works correctly with timezone selection
- ✅ Settings screen is fully editable with ShadCN components
- ✅ No native browser dialogs remain (all use ShadCN Dialog/AlertDialog)
- ✅ Consistent styling across all screens

### Workflow Designer
- ✅ Users can select multiple nodes using Ctrl/Cmd+Click or drag selection
- ✅ Selected nodes show clear visual indicators
- ✅ Alignment toolbar appears when 2+ nodes selected
- ✅ All alignment operations (6 directions) work correctly
- ✅ Right-click context menu appears for nodes and edges
- ✅ Context menu actions work correctly
- ✅ Nodes can be resized using corner grabbers
- ✅ Resized dimensions persist after save/reopen

### Quality
- ✅ All features tested and working
- ✅ No regressions in existing functionality
- ✅ Accessibility standards met
- ✅ Performance acceptable (no noticeable slowdowns)

---

## 📝 Deliverables

1. **ShadCN UI Integration**
   - All form components replaced
   - Time picker implemented
   - Settings screen updated
   - Dialog components replaced

2. **Workflow Designer Enhancements**
   - Multi-selection functionality
   - Alignment toolbar
   - Right-click context menu
   - Node resizing

3. **Documentation Updates**
   - Update README with new component library
   - Document new designer features
   - Update user guide if applicable

4. **Testing**
   - All features tested
   - Bug fixes applied
   - Performance verified

---

## 🔄 Dependencies

### External Dependencies
- ShadCN UI component library
- Radix UI primitives (via ShadCN)
- React Flow (already installed)
- Date/time picker library (TBD)

### Internal Dependencies
- Existing Workflow Designer implementation
- React Flow state management
- Auto-save functionality
- Node metadata storage

---

## 📚 References

- **ShadCN UI Documentation**: https://ui.shadcn.com/
- **React Flow Documentation**: https://reactflow.dev/
- **Product Backlog**: `docs/product-backlog.md`
- **Architecture**: `docs/architecture.md`

---

## 🚀 Next Steps After Sprint 9

- **Sprint 10**: File System Actions (from backlog)
- **Sprint 11**: UICard Step Feature (Phase 1 - large feature)
- **Future**: Advanced features (Template Export/Import, Document Revision History)

---

**Last Updated**: 2025-01-27

