# Epic EP6 — Templates & Sharing

## Epic Statement

Provide a workflow/template library that teams can publish, share, export/import, and keep up to date across organizations.

## Goals

- Curate template gallery with metadata, personas, and tags.
- Support export/import (signed packages) for sharing workflows and documents.
- Handle template versioning, deprecation notices, and notifications to dependent workflows.
- Offer CLI parity for template management.

## User Stories

| ID        | Title                                         | Persona            | Priority | Status       | Architecture Components                                                   |
| --------- | --------------------------------------------- | ------------------ | -------- | ------------ | ------------------------------------------------------------------------- |
| US-EP6-01 | Browse and filter workflow templates          | Workflow Architect | P0       | Draft        | TemplateRegistry, Renderer template gallery, WorkflowRepository           |
| US-EP6-02 | Publish workflow as reusable template         | Workflow Architect | P0       | ✅ Implemented | TemplateRegistry (createTemplate), WorkflowRepository, DocumentRegistry   |
| US-EP6-03 | Notify users of template updates/deprecations | Operations Analyst | P1       | Draft        | TemplateRegistry, NotificationService, Dashboard                          |
| US-EP6-04 | Export/import templates as signed packages    | Integrator         | P1       | ✅ Implemented | TemplateManifestService (exportTemplate, importTemplate), CLI template commands |
| US-EP6-05 | Manage template permissions and ownership     | Administrator      | P1       | ✅ Implemented | TemplateRegistry (permissions), TemplatePermissionRole, CLI permissions commands |
| US-EP6-06 | CLI template library operations               | Integrator         | P2       | ✅ Implemented | CLI template commands (create, list, diff, export-manifest, import-manifest, permissions) |

## Implementation Status

**Completed Stories**: 4 of 6 (67%)
- ✅ TemplateRegistry with create, list, permissions
- ✅ TemplateManifestService for export/import
- ✅ TemplateDiffService for version comparison
- ✅ CLI template commands (create, list, diff, export, import, permissions)

**In Progress / Draft Stories**: 2 of 6 (33%)
- ⏳ Template gallery UI (US-EP6-01)
- ⏳ Template update notifications (US-EP6-03)

## Dependencies

- Architecture: Template registry, workflow export schema, notification subsystem.
- UX: Dashboard/template gallery narratives, document workspace references.
- Security: Signing/encryption for template packages.

## Notes & Open Questions

- Decide how templates reference connector/document requirements when shared externally.
- Determine signing strategy (org certificates vs manual hashing).
