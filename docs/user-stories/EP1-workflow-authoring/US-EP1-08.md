# Story: Export workflow definition to JSON

- **Epic**: EP1 — Workflow Authoring
- **Persona**: Integrator
- **Priority**: P1
- **Status**: Implemented

## Context

Integrators need to share workflows with other environments, run code reviews, or feed automation pipelines. Exporting to JSON (and future signed packages) should be simple, include metadata, and respect secrets/credentials.

## User Story

As an integrator, I want to export a workflow definition to JSON so that I can version it in Git, share it, or feed automated deployment scripts.

## Acceptance Criteria

```
Given I view a workflow draft in the designer
When I click "Export Workflow" from the dashboard
Then I receive a JSON file containing workflow metadata, nodes, transitions, and all configuration data

Given I import a workflow JSON file
When I use the "Import Workflow" feature
Then the workflow is imported as a new draft with validation warnings if dependencies are missing

Given the workflow references credentials or secret values
When exporting
Then the JSON contains the workflow structure but credentials are not included in the export

Given I import a workflow JSON
When the import completes
Then I see a success message and the imported workflow appears in the drafts list
```

## UX References

- `docs/ux/narratives/designer.md` — export controls
- `docs/ux/narratives/dashboard.md` — card hover actions

## Technical Notes

- Define JSON schema under `docs/connector-interface.md` (future) or `docs/architecture.md`.
- Include checksum/hash to detect tampering.
- Support `--include-history` flag to export multiple versions.
- Consider signing packages in later iterations.
