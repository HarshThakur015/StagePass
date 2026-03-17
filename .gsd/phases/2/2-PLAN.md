---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Event Management Core

## Objective
Implement backend event CRUD endpoints with Cloudinary image upload handling for Organizers.

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md
- backend/src/models/Event.ts
- backend/src/modules/events/events.controller.ts

## Tasks

<task type="auto">
  <name>Verify Event Model</name>
  <files>
    backend/src/models/Event.ts
  </files>
  <action>
    - Ensure Mongoose schema exists with `name`, `date`, `venue`, `capacity`, `price`, and `images` array.
    - Setup `organizerId` representing the User who created it.
  </action>
  <verify>Ensure `Event.ts` exports correctly and validates fields.</verify>
  <done>Mongoose Event model is defined.</done>
</task>

<task type="auto">
  <name>Implement Event Controllers and Routes</name>
  <files>
    backend/src/modules/events/events.controller.ts
    backend/src/modules/events/events.routes.ts
  </files>
  <action>
    - Setup public routes to view events.
    - Setup restricted routes (organizer/admin) for creating, updating, and deleting events.
    - Ensure Cloudinary image upload is integrated.
  </action>
  <verify>Check that both files compile successfully in the TypeScript environment.</verify>
  <done>Event routes and Cloudinary-integrated controllers are implemented.</done>
</task>

## Success Criteria
- [ ] Mongoose Event schema is structured correctly.
- [ ] Events can be created, updated, and deleted securely.
- [ ] Memory-based multer interceptor to Cloudinary URL storage behaves efficiently.
