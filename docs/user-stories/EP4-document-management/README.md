# Epic EP4 — Document Management

## Epic Statement

Enable users to author, manage, and distribute workflow-linked documents (templates, generated outputs, revisions) with full parity between the renderer UI and CLI.

## Goals

- Provide rich editors for Markdown/HTML/JSON/YAML/CSV with previews and schema validation.
- Manage document templates, revisions, and dependencies across workflows.
- Offer export pipelines (DOCX/PDF/ZIP bundles) with audit trails.
- Ensure CLI users can edit, validate, and export documents headlessly.

## User Stories

| ID        | Title                                         | Persona            | Priority | Status       | Architecture Components                                                                |
| --------- | --------------------------------------------- | ------------------ | -------- | ------------ | -------------------------------------------------------------------------------------- |
| US-EP4-01 | Manage document template library              | Workflow Architect | P0       | ✅ Implemented | DocumentRegistry, DocumentService, FileConnector, UI document list                    |
| US-EP4-02 | Edit Markdown/HTML with live preview          | Workflow Architect | P0       | Draft        | DocumentWorkspace UI, Markdown/HTML formatter services, Autosave engine                |
| US-EP4-03 | Validate JSON/YAML documents with schema      | Integrator         | P0       | Draft        | SchemaValidationService, DocumentWorkspace structured editor, ConfigService            |
| US-EP4-04 | Track document revisions and diffs            | Workflow Architect | P1       | Draft        | DocumentRevisionRepository, DocumentWorkspace metadata rail, AuditLogService           |
| US-EP4-05 | Export generated documents to DOCX/PDF bundle | Operations Analyst | P1       | ✅ Implemented | DocumentService (exportDocument), DocumentBuilder (DocxBuilder, PdfBuilder, MarkdownBuilder), CLI export |
| US-EP4-06 | Edit and validate documents via CLI           | Integrator         | P1       | ✅ Implemented | CLI document commands (list, export), DocumentService, DocumentBuilder                 |

## Implementation Status

**Completed Stories**: 3 of 6 (50%)
- ✅ DocumentRegistry for tracking documents
- ✅ DocumentService with export (DOCX, PDF, Markdown)
- ✅ CLI document commands (list, export)

**In Progress / Draft Stories**: 3 of 6 (50%)
- ⏳ Markdown/HTML editor with live preview (US-EP4-02)
- ⏳ JSON/YAML schema validation (US-EP4-03)
- ⏳ Document revision tracking (US-EP4-04)

## Dependencies

- Architecture: DocumentBuilder strategies, FileConnector, ArtifactsService, ConfigService.
- UX: Document workspace narratives, wireframes, CLI companion specs.
- Storage: Document templates and revision tables in SQLite.

## Notes & Open Questions

- Determine schema definition format for JSON/YAML editors (custom vs JSON Schema).
- Clarify template sharing scope with EP6 (template gallery vs document workspace).
