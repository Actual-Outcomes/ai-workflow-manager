# Epic EP3 — Connector & Credential Management

## Epic Statement

Allow administrators and integrators to configure storage, LLM, and file connectors while managing credentials securely across UI and CLI surfaces.

## Goals

- Provide guided setup for default SQLite storage and optional remote connectors.
- Capture, validate, and rotate API keys using the credential vault.
- Expose connector capabilities (models, rate limits, status) to inform workflow design.
- Maintain audit trails for credential changes and connector selection.

## User Stories

| ID        | Title                                              | Persona            | Priority | Status       | Architecture Components                                                                    |
| --------- | -------------------------------------------------- | ------------------ | -------- | ------------ | ------------------------------------------------------------------------------------------ |
| US-EP3-01 | View available connectors and current selections   | Administrator      | P0       | ✅ Implemented | Settings UI (connectors), ConnectorRegistry, ConfigService                                  |
| US-EP3-02 | Add ChatGPT API key via settings UI                | Administrator      | P0       | Draft        | Settings UI credential form, CredentialVault adapters, ConnectorRegistry health check      |
| US-EP3-03 | Add Claude API key via settings UI                 | Administrator      | P0       | Draft        | Settings UI credential form, CredentialVault, ConnectorRegistry                            |
| US-EP3-04 | Test connector credentials and view status badge   | Administrator      | P0       | ✅ Implemented | ConnectorRegistry (testConnector), Settings UI, CLI test commands                           |
| US-EP3-05 | Configure storage connector (local SQLite default) | Administrator      | P0       | ✅ Implemented | ConnectorRegistry (storage), ConfigService, Settings UI                                     |
| US-EP3-06 | Set file access sandbox directories                | Administrator      | P0       | Draft        | Settings UI file sandbox view, FileSandboxGuard, FileConnector, ConfigService              |
| US-EP3-07 | Manage credentials via CLI commands                | Integrator         | P0       | ✅ Implemented | CLI credential commands (add, list, remove), CredentialVault, AuditLogService               |
| US-EP3-08 | View connector capabilities (models, limits)       | Workflow Architect | P1       | ✅ Implemented | ConnectorRegistry (capabilities metadata), Settings UI, CLI info commands                |
| US-EP3-09 | Rotate API key with audit log                      | Administrator      | P1       | Draft        | CredentialVault rotation API, AuditLogService, Settings UI, CLI rotation commands          |
| US-EP3-10 | Export/import connector configuration bundle       | Administrator      | P2       | Draft        | ConfigService (export/import), ConnectorRegistry, Credential metadata, CLI config commands |

## Implementation Status

**Completed Stories**: 5 of 10 (50%)
- ✅ ConnectorRegistry with registration, removal, health checks
- ✅ Connector listing and status display
- ✅ Credential management via CLI (add, list, remove)
- ✅ Connector capabilities and metadata
- ✅ Storage connector configuration (SQLite)

**In Progress / Draft Stories**: 5 of 10 (50%)
- ⏳ UI credential forms for ChatGPT/Claude (US-EP3-02, US-EP3-03)
- ⏳ File sandbox configuration (US-EP3-06)
- ⏳ API key rotation (US-EP3-09)
- ⏳ Connector configuration export/import (US-EP3-10)

## Dependencies

- Architecture: Credential vault implementation, connector registry, logging.
- UX: Settings wizard wireframes, credential input patterns, CLI stories.
- Security: Policies for storage, encryption, and audit logging.

## Notes & Open Questions

- Confirm fallback strategy when OS keychain unavailable.
- Determine minimum required metadata for connector export packages.
- Decide on notification mechanism for upcoming credential expirations.
