# Privacy & Data Handling Guidance

## In-app privacy notice for Settings
Display a simple notice in Settings to reassure users that their reflections remain private by default:

> "Your gratitude entries stay on this device. If you choose to turn on sync later, we will tell you exactly what is shared before anything leaves your phone."

Include a link or button near this notice to open the data controls (export/delete) so users can act immediately.

## Data control features
- **Export**: Offer export of all entries (e.g., JSON or CSV) from the Settings page. Make the export self-contained so it can be backed up or moved to another device.
- **Delete**: Provide both per-entry deletion and a clear "Delete all journal data" action with a confirmation step. Make sure deletion wipes any derived caches and search indexes.
- **Minimal retention**: Only keep fields necessary to render entries (date, prompt, text, optional tags/attachments). Avoid storing identifiers that are not needed for core features.

## Storage and security
- **Local-first**: Store journal data locally by default. If cloud sync is added later, gate it behind an opt-in toggle and explain what is uploaded.
- **Encryption**: Prefer storing data in an encrypted database or file store when possible (e.g., OS-provided encrypted storage). For cloud sync, enforce transport encryption (TLS) and encrypt sensitive payloads at rest.
- **Backups**: Document whether system backups will include the data. Provide an option to exclude the app from unencrypted backups if applicable.

## Telemetry and analytics
- **Default stance**: Do not collect analytics that could discourage reflection. Disable any third-party tracking by default.
- **If telemetry is added**: Limit to non-sensitive, aggregated events (e.g., feature usage counts). Clearly document the exact events collected, their purpose, and retention. Obtain explicit consent in Settings with an easy opt-out. Do not log entry content, titles, or timestamps that could re-identify a user.
- **Transparency**: Maintain a short "Telemetry & Data" section in Settings summarizing what is (and is not) collected, with a link to detailed documentation.
