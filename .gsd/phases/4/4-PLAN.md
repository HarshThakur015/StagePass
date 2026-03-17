---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: QR Ticket Validation

## Objective
Implement endpoints for ticket verification `/validate` to be used by Verifiers with Scanner Apps.

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md
- backend/src/modules/tickets/tickets.controller.ts

## Tasks

<task type="auto">
  <name>Verify QR Cryptography Logic</name>
  <files>
    backend/src/utils/qr.ts
    backend/src/modules/tickets/tickets.controller.ts
  </files>
  <action>
    - Ensure cryptographic assertions exist allowing payload decoding and tampering prevention.
    - Check the `/validate` endpoint decodes the QR string from the Verifier App.
  </action>
  <verify>Check `utils/qr.ts` for generation/validation keys.</verify>
  <done>QR tokens are strongly signed and unforgeable.</done>
</task>

<task type="auto">
  <name>Implement Verification Route</name>
  <files>
    backend/src/modules/tickets/tickets.routes.ts
    backend/src/modules/tickets/tickets.controller.ts
  </files>
  <action>
    - Ensure a restricted `/validate` endpoint exists.
    - Validate logic checks if ticket exists, is for the correct event, and is unused.
    - On valid checks, mutates the Ticket status to "used" and tracks the usage date.
  </action>
  <verify>Run `npm run build` in backend to establish complete integration without TS errors.</verify>
  <done>The scanning endpoint safely marks a ticket used or emits appropriate error messages.</done>
</task>

## Success Criteria
- [ ] QR Utilities successfully assert authenticity.
- [ ] `validateTicket` controller updates DB schemas properly.
