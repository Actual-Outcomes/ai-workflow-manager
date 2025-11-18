# Story: Configure notification preferences

- **Epic**: EP2 — Workflow Execution & Monitoring
- **Persona**: Operations Analyst
- **Priority**: P2
- **Status**: Implemented

## Context

Different teams need different alert levels. Operators should configure when and how they receive notifications (in-app, email, future channels) for events like validator failures, run completion, or credential issues.

## User Story

As an operations analyst, I want to configure notification preferences so that I receive the right alerts without noise.

## Acceptance Criteria

```
Given I access notification preferences
When I use NotificationPreferenceService
Then I can get and save notification preferences with quiet hours (start/end times) and channels

Given I use the CLI
When I run `notifications get`
Then I see the current notification preferences in JSON format

Given I use the CLI
When I run `notifications set --quiet-start <time> --quiet-end <time> --channels <channels>`
Then my preferences are updated and saved to the configuration

Given notification preferences are configured
When the scheduler or workflow execution needs to send notifications
Then the preferences are consulted to determine delivery channels and quiet hours
```

## UX References

- `docs/ux/narratives/settings.md` (future notifications section)
- `docs/ux/narratives/dashboard.md` (notifications sidebar)

## Technical Notes

- Preference storage per user (local profile). For email/SMS placeholders, mark as future but design schema now.
- CLI command should support `--json` export/import of preferences.
- Need default baseline (critical alerts always on).
- Open questions: How do we handle org-level defaults?
