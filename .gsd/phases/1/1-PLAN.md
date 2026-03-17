---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Authentication Core

## Objective
Implement backend user registration and login endpoints utilizing JWT and bcrypt, ensuring user roles are supported.

## Context
- .gsd/SPEC.md
- .gsd/ARCHITECTURE.md
- backend/src/modules/users/ (To be created)
- backend/src/modules/auth/ (To be created)

## Tasks

<task type="auto">
  <name>Setup User Model</name>
  <files>
    backend/src/modules/users/user.model.ts
    backend/src/modules/users/user.interface.ts
  </files>
  <action>
    - Create a Mongoose schema for the User containing `name`, `email`, `password`, and `role` (enum: user, organizer, verifier, admin).
    - Ensure `email` is uniquely indexed.
    - Add a pre-save hook to hash the password with bcrypt if modified.
    - Do NOT implement controllers yet.
  </action>
  <verify>Check that `user.model.ts` exports a valid Mongoose model and compiles properly with `npm run build`.</verify>
  <done>Mongoose User model is defined securely with TypeScript typing.</done>
</task>

<task type="auto">
  <name>Implement Auth Controllers</name>
  <files>
    backend/src/modules/auth/auth.controller.ts
    backend/src/modules/auth/auth.routes.ts
    backend/src/utils/jwt.ts
  </files>
  <action>
    - Create `register` and `login` controller functions.
    - `register`: Validates input, checks if email exists, creates the user, returns a JWT.
    - `login`: Validates input, finds the user by email, compares passwords, returns a JWT.
    - Create an Express router linking to these controllers.
    - Setup JWT signing and verification utility.
  </action>
  <verify>Send a POST request to `/api/auth/register` and `/api/auth/login` and verify a valid JWT is returned in the response.</verify>
  <done>User registration and login endpoints return valid JWTs.</done>
</task>

## Success Criteria
- [ ] Mongoose User schema handles roles and hashes passwords properly.
- [ ] Users can successfully register and login.
- [ ] Auth endpoints return valid JWTs on success.
