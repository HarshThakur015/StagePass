# SPEC.md — Project Specification

> **Status**: FINALIZED
> ⚠️ **Planning Lock**: No code may be written until this spec is marked `FINALIZED`.

---

# StagePass – QR Event Ticketing Platform

## Vision

StagePass is a scalable event ticketing platform that allows organizers to create events, users to purchase digital tickets, and verifiers to validate event entry using QR codes. The platform focuses on secure ticketing, fraud prevention, and seamless event management using modern web technologies.

---

## Goals

1. **Secure Ticketing Platform** — Provide a reliable backend API to manage users, events, and ticket purchases.
2. **QR-Based Ticket Validation** — Ensure secure entry verification using QR codes.
3. **Modern Dashboard Interface** — Provide role-based dashboards using Next.js.
4. **Online Payment Integration** — Enable ticket purchases via Stripe.
5. **Automated Ticket Delivery** — Send QR tickets via email after successful purchase.

---

## Non-Goals (Out of Scope)

* Native mobile applications (iOS / Android)
* Offline ticket scanning systems
* Physical ticket printing
* Third-party event marketplace integration

---

## Constraints

* Backend must use **Node.js + Express + TypeScript**
* Database must be **MongoDB**
* Frontend must use **Next.js**
* Authentication must use **JWT**
* Payments must use **Stripe**
* Deployment must support **Docker containers**

---

## Success Criteria

* [ ] Users can register and login securely
* [ ] Organizers can create and manage events
* [ ] Users can purchase tickets for events
* [ ] QR codes are generated for each ticket
* [ ] Verifiers can scan and validate tickets
* [ ] Payment integration works with Stripe
* [ ] Email tickets are delivered successfully
* [ ] Platform runs using Docker deployment

---

# System Roles

### User

* Register and login
* Browse events
* Purchase tickets
* View purchased tickets

### Organizer

* Create events
* Manage events
* View ticket sales
* View analytics

### Verifier

* Scan QR codes
* Verify ticket authenticity
* Mark ticket as used

### Admin

* Manage platform users
* Monitor events
* View platform analytics
* Disable events if necessary

---

# Development Phases

---

## Phase 1 – Authentication System

Implement secure authentication.

Features:

* User registration
* User login
* Password hashing using bcrypt
* JWT authentication
* Refresh tokens
* Role-based authorization

Endpoints:

POST /auth/register
POST /auth/login
POST /auth/refresh

---

## Phase 2 – Event Management

Allow organizers to manage events.

Features:

* Create events
* Update events
* Delete events
* View event details

Event fields:

* eventId
* title
* description
* venue
* date
* ticket price
* ticket limit
* organizerId

Endpoints:

POST /events
GET /events
GET /events/:id
PUT /events/:id
DELETE /events/:id

---

## Phase 3 – Ticket System

Users can purchase and manage tickets.

Features:

* Purchase tickets
* View purchased tickets
* Generate QR codes for tickets

Ticket fields:

* ticketId
* eventId
* userId
* purchaseDate
* status (valid / used)
* qrCode

Endpoints:

POST /tickets/purchase
GET /tickets/user

---

## Phase 4 – QR Ticket Validation

Allow verifiers to validate event entry.

Features:

* QR code scanning
* Ticket verification
* Ticket status update

Validation checks:

* Ticket exists
* Ticket not already used
* Event valid

Endpoint:

POST /tickets/verify

---

## Phase 5 – Frontend Dashboard

Build a Next.js frontend.

### User Dashboard

* Browse events
* Purchase tickets
* View QR tickets

### Organizer Dashboard

* Create events
* Manage events
* View ticket sales

### Verifier Dashboard

* QR scanner
* Verify tickets

### Admin Dashboard

* View platform statistics
* Manage users
* Monitor events

Frontend Tech Stack:

* Next.js
* TypeScript
* TailwindCSS
* React Query
* Axios

---

# Advanced Platform Features

---

## QR Scanning System

Generate QR codes for each ticket.

Requirements:

* QR contains ticketId
* QR generated during ticket creation
* Scanner validates ticket via API
* Ticket marked "used" after validation

Endpoint:

POST /tickets/verify

Libraries:

qrcode
react-qr-reader

---

## Stripe Payment Integration

Users must complete payment before ticket generation.

Features:

* Stripe Checkout session
* Payment success webhook
* Create ticket after payment success

Endpoints:

POST /payments/create-checkout-session
POST /payments/webhook

---

## Email Ticket Delivery

Send tickets via email after purchase.

Features:

* Send QR ticket via email
* Attach QR image
* Include event details

Technology:

nodemailer

---

## Event Analytics

Allow organizers to monitor event performance.

Metrics:

* Tickets sold
* Revenue generated
* Attendance rate

Endpoint:

GET /analytics/event/:id

---

## Admin Dashboard

Admin capabilities:

* View platform users
* View events
* Monitor revenue
* Disable events

Endpoints:

GET /admin/users
GET /admin/events
GET /admin/analytics

---

# Docker Deployment

Provide containerized deployment.

Services:

* backend
* frontend
* mongodb

Required files:

Dockerfile
docker-compose.yml

Deployment should allow the entire system to run with:

docker-compose up

---

# Technical Stack

Backend:

Node.js
Express.js
TypeScript
MongoDB (Mongoose)
JWT Authentication

Frontend:

Next.js
React
TypeScript
TailwindCSS

DevOps:

Docker
Docker Compose

---

# Environment Variables

Required variables:

JWT_SECRET
JWT_REFRESH_SECRET
MONGO_URI
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
EMAIL_USER
EMAIL_PASS

---

*Last updated: 2026*
