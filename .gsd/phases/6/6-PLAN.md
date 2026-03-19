---
phase: 6
plan: 1
wave: 1
---

# Plan 6.1: Stripe Payment & Email Delivery

## Objective
Implement Stripe Checkout for ticket purchases and Email QR tickets via Nodemailer.

## Context
- .gsd/SPEC.md
- backend/src/modules/tickets/tickets.controller.ts
- backend/src/modules/tickets/tickets.routes.ts
- backend/src/utils/

## Tasks

<task type="auto">
  <name>Stripe Integration</name>
  <files>backend/src/modules/tickets/tickets.controller.ts, backend/src/modules/tickets/tickets.routes.ts</files>
  <action>
    - Add Stripe checkout session creation (`POST /payments/create-checkout-session`)
    - Add Stripe webhook for successful payment (`POST /payments/webhook`)
    - Ensure ticket is generated only after payment success
  </action>
  <verify>npm run build --prefix backend</verify>
  <done>Stripe endpoints implemented and compile without errors</done>
</task>

<task type="auto">
  <name>Email Delivery</name>
  <files>backend/src/utils/email.ts, backend/src/modules/tickets/tickets.controller.ts</files>
  <action>
    - Configure Nodemailer in utils
    - Send QR ticket email to user upon successful payment
  </action>
  <verify>npm run build --prefix backend</verify>
  <done>Email dispatch mechanism integrated and compiles</done>
</task>

## Success Criteria
- [ ] Stripe payment workflow handles checkout and webhooks
- [ ] Nodemailer functionality added and called post-payment
