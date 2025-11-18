# Epic EP7 — Platform Operations & Quality

## Epic Statement

Ensure the platform remains reliable through logging, telemetry, packaging, migrations, security monitoring, and backup/restore workflows.

## Goals

- Centralize logging/telemetry configuration with opt-in policies.
- Define packaging/install verification and migration flows.
- Provide health checks, diagnostics, and vulnerability monitoring.
- Support backup/restore of configurations, workflows, and documents.

## User Stories

| ID        | Title                                         | Persona       | Priority | Status       | Architecture Components                                                                        |
| --------- | --------------------------------------------- | ------------- | -------- | ------------ | ---------------------------------------------------------------------------------------------- |
| US-EP7-01 | Configure logging levels and destinations     | Administrator | P0       | ✅ Implemented | LoggingService, ConfigService, CLI ops logs command                                            |
| US-EP7-02 | Opt-in telemetry with anonymization           | Administrator | P0       | ✅ Implemented | TelemetryService, ConfigService, CLI telemetry commands (enable, disable, send)                |
| US-EP7-03 | Run installer validation & first-run checks   | Administrator | P0       | Draft        | Packaging scripts, Installer checklist (`build-installer.mdc`), MigrationService               |
| US-EP7-04 | Apply database migrations safely              | Engineer      | P1       | Draft        | MigrationService, LocalSqliteConnector, BackupService                                          |
| US-EP7-05 | Monitor vulnerabilities and dependency health | Administrator | P1       | ✅ Implemented | SecurityScanner (npm audit wrapper), CLI security-scan command                                 |
| US-EP7-06 | Backup and restore configurations & data      | Administrator | P1       | ✅ Implemented | BackupService, CLI backup commands (create, list, restore)                                    |
| US-EP7-07 | Run component tests from in-app Test Console  | Engineer      | P1       | Draft        | TestConsole (renderer), TestRunnerService (main process), AuditLogService, NotificationService |

## Implementation Status

**Completed Stories**: 4 of 7 (57%)
- ✅ LoggingService with configurable levels and destinations
- ✅ TelemetryService with opt-in and anonymization
- ✅ SecurityScanner for vulnerability monitoring
- ✅ BackupService for database backup/restore

**In Progress / Draft Stories**: 3 of 7 (43%)
- ⏳ Installer validation and first-run checks (US-EP7-03)
- ⏳ Database migrations (US-EP7-04)
- ⏳ In-app test console (US-EP7-07)

## Dependencies

- Architecture: Logging/telemetry sections, packaging checklist, migration tooling.
- Docs: `.cursor/rules/build-installer.mdc`, new backup guides.
- Ops: Security policies, telemetry opt-in rules.

## Notes & Open Questions

- Decide telemetry sink (local file vs optional remote endpoint) and anonymization strategy.
- Define retention for backups and logs.
