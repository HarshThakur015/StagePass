# ROADMAP.md

> **Current Phase**: Phase 1
> **Milestone**: v1.0

## Must-Haves (from SPEC)
- [ ] Authentication system
- [ ] Event Management
- [ ] Ticket Generation & Purchasing
- [ ] QR Ticket Validation
- [ ] Frontend Dashboards

## Phases

### Phase 1: Authentication System
**Status**: ✅ Complete
**Objective**: Build out the backend authentication endpoints and strategies.
**Requirements**: User registration, login, JWT issuance, password hashing, roles.

### Phase 2: Event Management
**Status**: ✅ Complete
**Objective**: Create the CRUD operations for events on the backend.
**Requirements**: Create, read, update, delete events. Must handle Cloudinary image uploads.

### Phase 3: Ticket System
**Status**: ✅ Complete
**Objective**: Implement ticket purchasing and generation.
**Requirements**: Purchase endpoints, ticket generation with QR codes, Nodemailer email dispatch.

### Phase 4: QR Ticket Validation
**Status**: ✅ Complete
**Objective**: Implement endpoints for ticket verification to be used by verifiers.
**Requirements**: POST `/verify-ticket` to check validity and mark used.

### Phase 5: Frontend Implementation
**Status**: ⬜ Not Started
**Objective**: Build out the React UI.
**Requirements**: Build dashboards for User, Organizer, Verifier, and Admin roles. Connect to APIs.
