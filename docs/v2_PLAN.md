# 🚀 LAMBO v2.0 Implementation Blueprint

> **Milestone:** Command & Inspection Release  
> **Target Date:** October 2026  
> **Status:** Approved for Implementation

---

## 📋 Table of Contents
1. [Overview & Objectives](#1-overview--objectives)
2. [Phase 1: Schemas & Plant Vitality State Migration](#phase-1-schemas--plant-vitality-state-migration)
3. [Phase 2: Mandatory Observation Photo Pipeline](#phase-2-mandatory-observation-photo-pipeline)
4. [Phase 3: Role-Based Authorization & Officer Access](#phase-3-role-based-authorization--officer-access)
5. [Phase 4: Officer Command Portal Backend APIs](#phase-4-officer-command-portal-backend-apis)
6. [Phase 5: Officer Command Portal Frontend UI](#phase-5-officer-command-portal-frontend-ui)
7. [Phase 6: Student Enrollment Page Modular Upgrade](#phase-6-student-enrollment-page-modular-upgrade)
8. [Phase 7: System-Wide UI Vitality Refinements](#phase-7-system-wide-ui-vitality-refinements)
9. [Phase 8: Offline Field Autonomy & Zero-CDN Architecture](#phase-8-offline-field-autonomy--zero-cdn-architecture)
10. [Phase 9: GitHub Tagging & Release Packaging](#phase-9-github-tagging--release-packaging)

---

## 1. Overview & Objectives

LAMBO v2 transforms the platform from an individual cadet logging tool into an interconnected academic forestry monitoring ecosystem. Key objectives include:
- Giving NSTP officers and instructors bird's-eye oversight over all students and specimens.
- Enforcing observational integrity through mandatory photographic verification.
- Adopting academic Forestry Standard vitality ratings (`Thriving`, `Stable / Fair`, `Distressed / At Risk`, `Dead / Mortality`).
- Providing class compliance auditing and automated Excel grade sheet generation.
- Laying modular architectural hooks for v3 gamification and badges.

---

## Phase 1: Schemas & Plant Vitality State Migration

### Tasks:
- [x] **Update `server/src/models/Tree.js`**:
  - Replace `healthStatus` enum with Forestry Standard vitality ratings:
    `['Thriving', 'Stable / Fair', 'Distressed / At Risk', 'Dead / Mortality']` (default: `'Thriving'`).
  - Deprecate binary `['alive', 'dead']` status in favor of the unified vitality model where `'Dead / Mortality'` marks specimen cessation.
- [x] **Update `server/src/models/GrowthLog.js`**:
  - Update `healthStatus` to `vitalityStatus` enum with matching Forestry Standard values.
  - Enforce `photo: { type: String, required: [true, 'Observation photo is mandatory'] }`.
- [x] **Update `server/src/models/User.js`**:
  - Add `role: { type: String, enum: ['student', 'officer'], default: 'student' }`.
  - Add `phone: { type: String, trim: true, default: '' }`.
  - Ensure course dropdown value is sanitized.

---

## Phase 2: Mandatory Observation Photo Pipeline

### Tasks:
- [x] **Frontend Form Validation (`client/src/components/growth/GrowthEntryForm.jsx`)**:
  - If creating a new log, require user to attach a photo (either via camera shutter capture or file picker).
  - Show a clear visual badge: `"📸 Photographic Proof Mandatory"`.
  - Display validation error if user attempts to submit without a photo file or pre-existing photo reference.
- [x] **Backend Controller Enforcement (`server/src/controllers/growthLogController.js`)**:
  - In `createLog`, check `if (!req.file && !req.body.photo) { return res.status(400).json({ success: false, message: 'Visual photographic evidence is mandatory for all observation entries.' }); }`.
- [x] **Offline Sync Compatibility (`client/src/utils/offlineQueue.js`)**:
  - Verify that offline entries serialize base64 photo data into IndexedDB so submissions never fail when field internet is unavailable.

---

## Phase 3: Role-Based Authorization & Officer Access

### Tasks:
- [x] **Officer Passcode Secret Configuration (`server/.env`)**:
  - Add `OFFICER_SIGNUP_KEY` (default fallback `NSTP2025`).
- [x] **Authentication Middleware (`server/src/middleware/auth.js`)**:
  - Implement `requireOfficer` middleware that validates `req.user.role === 'officer'`.
- [x] **Auth Controller (`server/src/controllers/authController.js`)**:
  - In `register`, accept optional `officerPasscode`. If passcode matches `OFFICER_SIGNUP_KEY`, set `role: 'officer'`; otherwise set `role: 'student'`.
  - Include `role` and `phone` in JWT payload and user profile responses.

---

## Phase 4: Officer Command Portal Backend APIs

### Tasks:
- [x] **Create Officer Routes & Controller (`server/src/routes/officer.js` & `server/src/controllers/officerController.js`)**:
  - `GET /api/officer/roster`: Returns list of all enrolled students with:
    - Specimen counts and IDs.
    - Most recent observation timestamp.
    - Calculated compliance status: `Active` (<= 7 days), `Overdue` (8–14 days), `Delinquent` (> 14 days or 0 logs).
    - Total alive vs dead trees.
  - `GET /api/officer/cadet/:id`: Detailed drill-down for a single cadet including their full tree profiles and photo log gallery.
  - `GET /api/officer/stats`: High-level aggregate statistics across all sections (total wildlings, overall survival rate, active cadets).

---

## Phase 5: Officer Command Portal Frontend UI

### Tasks:
- [x] **Create Officer Dashboard Page (`client/src/pages/OfficerDashboardPage.jsx`)**:
  - Tactical army-green command header with live cadet count, specimen survival rate, and overdue alert counter.
  - **Compliance Roster Table**:
    - Searchable by student name, roll number, or course.
    - Filters: All Cadets, Active This Week, Overdue, Delinquent.
    - Direct actions: View Specimen Logs, Inspect Photos.
  - **Cadet Inspection Modal**:
    - Complete observation timeline with photo preview modal.
  - **Bulk Export to Excel**:
    - Generate `.xlsx` spreadsheet formatted for university grade encoding.
- [x] **Profile Menu & Header Integration (`client/src/components/layout/Header.jsx`)**:
  - Show golden `🎖️ NSTP OFFICER` badge for officer accounts.
  - Add `Officer Command Portal` button navigating directly to `/officer/dashboard`.
- [x] **Route Guarding (`client/src/App.jsx`)**:
  - Protect `/officer/dashboard` with an officer route guard redirecting standard students to `/`.

---

## Phase 6: Student Enrollment Page Modular Upgrade

### Tasks:
- [x] **Update `client/src/pages/RegisterPage.jsx`**:
  - Replace plain text course field with a structured dropdown list.
  - Add placeholder courses (BS Forestry, BS Agriculture, BS Info Tech, BSED, etc.) with custom write-in fallback until gf provides exact list.
  - Add contact phone number input field.
  - Add an expandable `"Officer / Instructor Passcode"` section for staff enrollment.
  - Maintain army-green tactical cadet visual aesthetic.

---

## Phase 7: System-Wide UI Vitality Refinements

### Tasks:
- [x] **Color & Badge Unification**:
  - 🟢 **Thriving**: Tactical Olive / Lime (`#8B9B4C` / `#A4B566`)
  - 🟡 **Stable / Fair**: Amber (`#EAB308` / `#F59E0B`)
  - 🟠 **Distressed / At Risk**: Rust Red (`#EF4444` / `#DC2626`)
  - ⚪ **Dead / Mortality**: Charcoal / Dark Slate (`#4B5563` / `#374151`)
- [x] **Update Components**:
  - `TreeCard.jsx`, `TreeProfilePage.jsx`, `GrowthTimeline.jsx`, `GrowthChart.jsx`, `MarkerClusterGroup.jsx` (Map markers), `TreeListPage.jsx`, and `DashboardPage.jsx`.

---

## Phase 8: Offline Field Autonomy & Zero-CDN Architecture

### Tasks:
- [x] **Client-Side Image Compressor (`client/src/utils/imageCompressor.js`)**:
  - Automatically downsamples multi-megabyte camera photos to ~180KB JPEG via HTML5 Canvas before uploading.
  - Prevents server-side timeout and bandwidth exhaustion over 3G/campus Wi-Fi.
- [x] **Two-Tier Specimen Caching (`client/src/context/TreeContext.jsx`)**:
  - Implemented Stale-While-Revalidate pattern caching user's own wildlings and campus directory metadata in localStorage.
  - Cadets can record growth logs even when disconnected in remote forestry plots.
- [x] **Offline Session Resilience (`client/src/context/AuthContext.jsx`)**:
  - Added client-side JWT expiry validation, preventing false logouts or "Network Error" wipeouts on page reload when offline.
- [x] **100% Zero-External-CDN & Self-Hosted Typography**:
  - Removed all external links to `fonts.googleapis.com` and `unpkg.com`.
  - Bundled local `@fontsource/chivo`, `@fontsource/jetbrains-mono`, and `leaflet/dist/leaflet.css`.
  - Converted all Google Material Symbols webfonts to zero-network local Lucide SVGs (`client/src/components/common/Icon.jsx`).
- [x] **PWA Service Worker Hardening (`client/public/sw.js`)**:
  - Upgraded cache strategy to Cache-First for static bundles with fallback to `/index.html` for navigation.
  - Dev-mode isolation in `main.jsx` and `sw.js` to ensure Vite live HMR remains pristine without cache collisions.
- [x] **Demonstration Data Cohort (`server/src/utils/seedV2Data.js`)**:
  - Seed script generating Officer account, 5 cadets, 5 wildlings, and timeline logs across all compliance and vitality states.

---

## Phase 9: GitHub Tagging & Release Packaging

### Tasks:
- [x] Tag git history with `v1.0.0` baseline (`git tag -a v1.0.0 10584ec -m "Release v1.0.0: Baseline botanical monitoring platform"`).
- [x] Commit v2 changes and push to GitHub `dev` and `main` branches.
- [x] Tag `v2.0.0` and publish official GitHub Release with formatted release notes from `docs/RELEASES.md`.
