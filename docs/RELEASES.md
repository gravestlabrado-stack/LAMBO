# 📋 LAMBO Release Notes & Changelog

All notable updates, enhancements, bug fixes, and architectural revisions for **LAMBO (Landscape Analytics for Monitoring Botanical Observation)** are documented here.

---

## 🚀 [v2.0.0] — Command, Inspection & Tactical Offline Engine Release

> **Release Date:** October 2026  
> **Status:** ✅ Production Ready / Released  
> **Milestone Focus:** Administrative oversight, Forestry Standard vitality classification, mandatory photographic verification, full IndexedDB offline persistence, tactical connection hub, and duplicate-proof telemetry ledger.

### 🌟 New Features & Capabilities

- **NSTP Officer Command Portal**:
  - Dedicated administrative dashboard accessible via profile menu and tactical bottom nav for accounts with the `officer` role.
  - **Compliance & Inspection Roster**: Real-time tabular/card view displaying all enrolled cadets and officers, wildling allocations, last log timestamps, and compliance indicators (`Active This Week`, `Overdue Observation`, `Delinquent`).
  - **Cadet Inspection Modal**: Drill down into any cadet's full seedling history, verified photo logs, and growth curves without account switching.
  - **Cohort-Wide Excel Export**: Bulk export generating formatted NSTP grading sheets containing cadet roll numbers, species distributions, total logged heights, survival counts, and latest health tiers.
  - **Officer Personnel Highlighting**: Officers are prominently pinned at the top of the roster with distinctive `[🎖️ OFFICER]` badges to easily supervise both students and peers.

- **Forestry Standard Plant Vitality Classification**:
  - Replaced legacy binary alive/dead health states with academic forestry vitality tiers:
    - 🟢 **Thriving** — Vigorous growth, vibrant foliage, no visible distress.
    - 🟡 **Stable / Fair** — Maintained growth, minor chlorosis or leaf shedding under observation.
    - 🟠 **Distressed / At Risk** — Severe wilt, pest infestation, or stunted growth requiring intervention.
    - ⚪ **Dead / Mortality** — Specimen is no longer viable; recorded for cohort survival rate statistics.
  - Harmonized across all system components: Dashboard donut analytics, Leaflet map markers, Growth Timeline, Specimen Cards, and Excel exports.

- **Mandatory Growth Observation Photography**:
  - Growth logs now strictly require visual photographic evidence for audit integrity.
  - Dual capture inputs: Real-time device camera shutter or device photo library upload.
  - Frontend validation prevents empty photo submissions; backend validates multipart image attachments or pre-existing photo references.
  - Client-side HTML5 canvas compression pipeline (`imageCompressor.js`) dropping 5MB camera photos to ~180KB JPEG before upload, preventing upload bottlenecks and preserving server bandwidth.

- **Tactical Offline Engine & Full IndexedDB Persistence**:
  - **Multi-Store IndexedDB Architecture (`lambo_offline_db`)**:
    - `cached_trees`: Full offline cache of cadet wildlings and campus directory with Stale-While-Revalidate pattern.
    - `cached_tree_logs`: Offline storage of historical observation logs for instant access in remote field plots.
    - `cached_cadets`: Offline snapshot of personnel and compliance roster for officers.
    - `offline_logs_queue`: Resilient offline queue that serializes base64 photographic evidence and queues field observations.
  - **Background Sync Engine (`offlineQueue.js`)**:
    - Automatically detects network reconnection and synchronizes pending observations.
    - Protected by concurrency mutex (`isSyncInProgress`) and server-side idempotency guards to prevent duplicate log creation.

- **Unified Tactical Pill Header Connection Hub (`Header.jsx`)**:
  - **Real-Time Connectivity Radar**: Pulsing red radar beacon for offline mode, steady emerald beacon for online mode.
  - **Sleek Circular Retry Action**: Minimalist circular sync icon button for instant connection retries without cluttered text buttons.
  - **Dynamic State Feedback**:
    - `DB Active`: Pulsing indicator while writing botanical records to local IndexedDB.
    - `Syncing...`: Rotating amber spinner while synchronizing offline records with server.
    - `Synced ✓`: Temporary emerald flash confirming successful background synchronization.
  - Eliminated conflicting in-page amber offline banners across pages for an uncluttered, unified status interface.

- **Streamlined Chronological Observation Ledger (`GrowthTimeline.jsx`)**:
  - Eliminated duplicate top cards; all observations flow in a seamless, chronological tactical rail.
  - Real-time growth delta calculations comparing height and stem diameter against previous audits.
  - Clean audit attribution badges displaying officer/cadet identity, roll number, and timestamps.

- **Role-Based Access Control (RBAC) & Enhanced Enrollment**:
  - Added `role` attribute to `User` schema (`student` vs `officer`).
  - Passcode-protected officer authorization during enrollment (`OFFICER_SIGNUP_KEY`).
  - Route protection middleware (`requireOfficer`) guarding administrative endpoints.
  - Academic course selection dropdown featuring preliminary CTU Barili degree programs with custom write-in fallback.
  - Contact phone number input for direct field communication.

- **100% Zero-External-CDN Architecture**:
  - Self-hosted `@fontsource/chivo` and `@fontsource/jetbrains-mono` typography.
  - Bundled local Leaflet CSS assets and converted all Material Symbols webfont glyphs to local zero-network Lucide SVGs.
  - PWA Service Worker Cache-First strategy with graceful offline navigation fallback and dev-mode isolation to protect Vite live HMR.

- **Automated Demonstration Cohort**:
  - Added `npm run seed:v2` script generating realistic NSTP Officer, student cadets, campus trees with GPS coordinates, and historical photo observation logs across all compliance tiers.

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
| **v2.0.0** | Command, Inspection & Offline Engine | Officer Portal, Forestry Vitality, Mandatory Photos, IndexedDB Engine | ✅ Released |
| **v3.0.0** | Cadet Engagement & Gamification | Badges, Care Streaks, Cohort Leaderboards | 📅 Planned |
