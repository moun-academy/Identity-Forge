# Gratitude

## Privacy and data controls
This project prioritizes local-first journaling. Key practices:
- Show a Settings notice: "Your gratitude entries stay on this device. If you choose to turn on sync later, we will tell you exactly what is shared before anything leaves your phone."
- Offer export (JSON/CSV) and both per-entry and "delete all" controls with confirmation, wiping caches/indexes.
- Keep stored data minimal and, where possible, encrypted using OS-provided secure storage; gate any cloud sync behind explicit opt-in.
- Avoid analytics by default. If telemetry is ever added, document every event, require consent, and never record entry contents or identifying timestamps.

See [docs/PRIVACY.md](docs/PRIVACY.md) for implementation guidance.
