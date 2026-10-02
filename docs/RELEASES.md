# 📋 LAMBO Release Notes & Changelog

All notable updates, enhancements, bug fixes, and architectural revisions for **LAMBO (Landscape Analytics for Monitoring Botanical Observation)** are documented here.

---

## 🚀 [v2.0.0] — Command & Inspection Release *(In Development)*

> **Target Release Date:** October 2026  
> **Milestone Focus:** Administrative oversight, Forestry Standard health classification, mandatory observation photography, and refined cadet enrollment.

### 🌟 New Features & Capabilities

- **NSTP Officer Command Dashboard**:
  - Dedicated administrative view accessible via profile badge for users with the `officer` role.
  - **Compliance & Inspection Roster**: Real-time table/grid displaying enrolled cadets, their assigned wildlings, last log dates, and compliance badges (`Active This Week`, `Overdue Observation`, `Delinquent`).
  - **Cadet Inspection Modal**: Drill down into any student's complete seedling history, photo logs, and growth charts without switching accounts.
  - **Cohort-Wide Excel Export**: Single-click bulk export generating formatted NSTP grading sheets containing cadet roll numbers, total logged heights, survival counts, and latest health statuses.

- **Forestry Standard Plant Vitality Classification**:
  - Replaced legacy health status options with academic forestry tiers:
    - 🟢 **Thriving** — Vigorous growth, vibrant foliage, no visible distress.
    - 🟡 **Stable / Fair** — Maintained growth, minor chlorosis or leaf shedding under observation.
    - 🟠 **Distressed / At Risk** — Severe wilt, pest infestation, or stunted growth requiring intervention.
    - ⚪ **Dead / Mortality** — Specimen is no longer viable; recorded for cohort survival rate statistics.
  - Integrated across all views: Dashboard donut charts, Leaflet map markers, Growth Timeline, and Tree Profile.

- **Mandatory Growth Observation Photography**:
  - Growth logs now strictly require visual photographic evidence.
  - Dual capture inputs: Real-time device camera shutter or device photo library upload.
  - Frontend form validation prevents empty photo submissions; backend validates multipart image attachments or pre-existing photo references.
  - Serialized photo caching in IndexedDB for seamless offline submissions that sync automatically when internet connectivity returns.

- **Role-Based Access Control (RBAC)**:
  - Added `role` attribute to `User` schema (`student` vs `officer`).
  - Passcode-protected officer authorization during enrollment (`OFFICER_SIGNUP_KEY`).
  - Route protection middleware (`requireOfficer`) guarding admin endpoints.

- **Enhanced Cadet Enrollment**:
  - Integrated academic course selection dropdown with preliminary CTU Barili degree tracks and custom fallback.
  - Added contact phone number field for field communication.
  - Modular schema architecture allowing instant expansion when final departmental fields are confirmed.

- **v3 Gamification Foundation**:
  - Clean modular hooks prepared for v3 care streaks, observation badges, and leaderboard rankings without breaking database schemas.

---

## 🌿 [v1.0.0] — Botanical Monitoring Baseline

> **Release Date:** October 2026  
> **Milestone Focus:** Core seedling registration, camera QR scanning, growth curve analytics, offline PWA, and push notifications.

### 🌟 Key Features

- **Seedling Registration & Profile Management**:
  - Auto-generated tactical tree identifiers (e.g., `LMB-0001`).
  - Species taxonomy, localized nicknames, campus planting location, and initial baseline measurements.
  - Cloudinary image CDN integration for photo records.

- **Downloadable QR Code Labeling**:
  - In-browser vector and raster PNG QR code generator for tree tags.
  - Direct download ready for physical lamination and tree staking.

- **HUD-Style QR Code Camera Scanner**:
  - Embedded camera scanner powered by `html5-qrcode`.
  - Tactical reticle UI with haptic feedback vibration on barcode lock.
  - Fallback manual tree ID input for devices without camera permissions.

- **Growth Tracking & Analytics**:
  - Sequential logging for height (cm), stem diameter (mm), leaf count, fruit count, and growth stages.
  - Interactive multi-axis Chart.js growth curves with trend smoothing.
  - Individual Excel (`.xlsx`) growth data export powered by SheetJS.

- **Interactive Campus GIS Map**:
  - Leaflet.js interactive satellite/topographic map centered at CTU Barili campus coordinates.
  - Clustered specimen markers color-coded by health status.
  - "Find My Location" geolocation GPS lock with animated flyTo navigation.

- **Offline-First PWA & Care Reminders**:
  - Service Worker app shell caching via `vite-plugin-pwa`.
  - Offline IndexedDB queue with automated sync on network reconnect.
  - Web Push API notification scheduler with automated background reminders every 15 minutes and user-customizable alert schedules.

- **Authentication & Visual Design**:
  - JWT stateless auth with Roll Number + Password.
  - Premium tactical army-green palette with Chivo and JetBrains Mono typography.
  - Responsive AppShell with bottom navigation for mobile phones and top bar for tablets/desktops.

---

## 📈 Release Roadmap

| Version | Milestone Name | Primary Focus | Status |
|---|---|---|---|
| **v1.0.0** | Botanical Monitoring Baseline | Seedling logging, QR HUD, Map, PWA | ✅ Released |
| **v2.0.0** | Command & Inspection Release | NSTP Officer Roster, Forestry Status, Mandatory Photos | 🚧 In Progress |
| **v3.0.0** | Cadet Engagement & Gamification | Badges, Care Streaks, Cohort Leaderboards | 📅 Planned |
