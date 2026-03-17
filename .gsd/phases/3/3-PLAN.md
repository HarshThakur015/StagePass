---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Ticket System Core

## Objective
Implement backend ticket purchasing endpoints with QR generation and Nodemailer email dispatch for Users.

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md
- backend/src/models/Ticket.ts
- backend/src/modules/tickets/tickets.controller.ts

## Tasks

<task type="auto">
  <name>Verify Ticket Model</name>
  <files>
    backend/src/models/Ticket.ts
  </files>
  <action>
    - Ensure Mongoose schema exists with `ticketId`, `eventId`, `userId`, `status`, and `qrData`.
    - Setup relational tracking.
  </action>
  <verify>Ensure `Ticket.ts` exports correctly and validates fields.</verify>
  <done>Mongoose Ticket model is defined.</done>
</task>

<task type="auto">
  <name>Implement Ticket Controllers</name>
  <files>
    backend/src/modules/tickets/tickets.controller.ts
    backend/src/modules/tickets/tickets.routes.ts
  </files>
  <action>
    - Setup protected route `/my-tickets` to view purchased tickets.
    - Setup restricted route (user) for purchasing tickets `/purchase`.
    - Ensure Nodemailer is integrated for transactional email dispatch.
  </action>
  <verify>Check that both files compile successfully in the TypeScript environment by running `npm run build` in the backend.</verify>
  <done>Ticket controllers generate valid QR data and orchestrate email sending upon purchase.</done>
</task>

## Success Criteria
- [ ] Mongoose Ticket schema is structured cleanly.
- [ ] Tickets are appropriately assigned to existing users and events.
- [ ] Nodemailer function is called successfully when completing a purchase.
