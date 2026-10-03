# 🏗️ LAMBO v2.5 — Full-Stack Modular Architecture & Code Refactoring Plan

> **Document Version:** 2.0.0 (Approved Implementation Roadmap)  
> **Milestone Focus:** Comprehensive Backend Services & Frontend Component Decomposition  
> **Status:** 🚀 **In Active Execution**

---

## 🎯 1. Motivation & Audit of Current Monoliths

As LAMBO grew through v1.0 and v2.0, several core backend controllers and frontend pages accumulated heavy mixed responsibilities. Files exceed 500–1,100+ lines of code, creating maintenance bottlenecks:

### Current Monolithic File Audit Table

| Layer | File Path | Current Lines | Smells & Responsibilities to Extract | Target Modular Structure |
| :--- | :--- | :---: | :--- | :--- |
| **Client** | `components/layout/Header.jsx` | **1,144** | Connectivity radar beacon, offline queue drawer, sync engine listeners, profile dropdown, PWA prompt. | Decompose into 4 sub-components under `components/layout/header/` + 3 custom hooks. |
| **Client** | `pages/TreeProfilePage.jsx` | **1,019** | Hero header, action toolbar, metric cards, Chart.js toggles, timeline ledger, edit modal, lightbox. | Decompose into 5 modular sub-components under `components/tree/profile/` + `useTreeMetrics`. |
| **Client** | `pages/OfficerDashboardPage.jsx` | **929** | KPI aggregations, compliance filters, roster table, inspection modal, SheetJS Excel export engine. | Decompose into 4 sub-components + 1 pure export utility under `components/officer/` + `useOfficerCohort`. |
| **Client** | `pages/RegisterTreePage.jsx` | **742** | Species taxonomy picker, camera shutter capture, interactive Leaflet coordinate picker, metric inputs. | Decompose into 4 step components under `components/tree/register/`. |
| **Client** | `pages/GrowthLogsPage.jsx` | **588** | Observation list rendering, date range filtering, photo lightboxes, deletion handling. | Decompose into log list, filter toolbar, and observation card. |
| **Client** | `components/growth/GrowthEntryForm.jsx` | **544** | HTML5 canvas compression, camera shutter, metrics inputs, vitality radio group, offline queueing. | Decompose into photo pipeline, telemetry inputs, and vitality picker. |
| **Client** | `components/scan/QRScannerView.jsx` | **530** | Camera lifecycle, html5-qrcode DOM attachments, HUD overlay animation, torch toggle, manual tree ID input. | Decompose into scanner HUD, camera engine, and manual ID fallback. |
| **Client** | `pages/CampusMapPage.jsx` | **525** | Leaflet canvas management, marker clustering, vitality filter chips, specimen popup cards, legend drawer. | Decompose into map canvas, filter controls, specimen popup, and legend drawer. |
| **Server** | `controllers/treeController.js` | **449** | Database CRUD, geo queries, baseline stats, Cloudinary stream uploads, ownership validation. | Delegate business logic to `services/treeService.js` and `services/mediaService.js`. |
| **Server** | `controllers/growthLogController.js` | **447** | Sequential delta calculations, tree vitality sync, image processing, stage transitions. | Delegate business logic to `services/growthLogService.js`. |
| **Server** | `controllers/officerController.js` | **209** | Cadet compliance classification (`Active`, `Overdue`, `Delinquent`), roster aggregation, inspection queries. | Delegate business logic to `services/officerService.js`. |
| **Server** | `controllers/reminderController.js` | **392** | Cron evaluation, date math, WebPush notification construction. | Delegate business logic to `services/reminderService.js`. |

---

## 🏛️ 2. Architectural Design Patterns for v2.5

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           LAMBO V2.5 ARCHITECTURE PATTERN                        │
└─────────────────────────────────────────────────────────────────────────────────┘

[CLIENT LAYER]
  Pages (Route Containers: <150 lines)
    └── Feature Presenters (Dumb UI: components/<feature>/<subfolder>/)
    └── Custom Hooks (State & Side-Effects: hooks/useNetworkRadar, useOfficerCohort...)
    └── Services (HTTP API calls: services/treeService, officerService...)

[SERVER LAYER]
  Routes (Express route registration & middleware: routes/*Routes.js)
    └── Controllers (HTTP req parsing, status codes: controllers/*Controller.js <70 lines)
         └── Domain Services (DB queries, forestry math, business rules: services/*Service.js)
         └── Media Service (Cloudinary stream pipeline: services/mediaService.js)
         └── Mongoose Models (Schemas & validations: models/*.js)
```

### Backend Principles:
1. **Thin Controllers:** Controllers only extract `req.body`, `req.params`, `req.query`, call the appropriate domain service method, and format `res.status().json()`.
2. **Domain Services:** `server/src/services/` owns database queries, validation rules, delta calculations, and data assembly. Services are pure JavaScript and easily unit testable.
3. **Dedicated Media Service:** Centralizes Cloudinary stream uploads and buffer handling into `server/src/services/mediaService.js`.

### Frontend Principles:
1. **Container / Presenter Separation:** Pages are lightweight orchestrators (<150 lines) that wire data and callbacks.
2. **Domain-Specific Custom Hooks:** Stateful logic (network radar, offline queue, cohort filtering) lives in `client/src/hooks/`.
3. **Domain-Grouped Directories:** Sub-components are categorized by domain: `components/layout/header/`, `components/tree/profile/`, `components/officer/`, `components/growth/`.

---

## 🛠️ 3. Phased Execution Roadmap

Refactoring is executed in 6 sequential milestones, with automated `oxlint` and `vite build` verification after every milestone:

### 🟩 Milestone 1: Backend Domain Services Layer (`server/src/services/`) — ✅ COMPLETED
- [x] Create `server/src/services/mediaService.js` (Centralized Cloudinary stream uploads)
- [x] Create `server/src/services/treeService.js` (Specimen queries, baseline metrics, filtering)
- [x] Create `server/src/services/growthLogService.js` (Delta math, vitality synchronization, stage logic)
- [x] Create `server/src/services/officerService.js` (Compliance classification: Active/Overdue/Delinquent, cohort KPI stats)
- [x] Refactor `server/src/controllers/treeController.js` to thin controller (450 → 154 lines)
- [x] Refactor `server/src/controllers/growthLogController.js` to thin controller (448 → 165 lines)
- [x] Refactor `server/src/controllers/officerController.js` to thin controller (210 → 65 lines)
- [x] **Verification:** Verified server startup, syntax, and API contract integrity.

---

### 🟩 Milestone 2: Client Custom Hooks Layer (`client/src/hooks/`) — ✅ COMPLETED
- [x] Create `client/src/hooks/useNetworkRadar.js` (Online/offline ping, beacon status, manual retry)
- [x] Create `client/src/hooks/useOfflineQueue.js` (Queue count, sync progress, inspection)
- [x] Create `client/src/hooks/usePWAInstall.js` (PWA install prompt listener & trigger)
- [x] Create `client/src/hooks/useTreeMetrics.js` (Sequential delta calculations, height trends)
- [x] Create `client/src/hooks/useOfficerCohort.js` (Compliance filtering, search queries, course grouping)
- [x] **Verification:** Verified syntax and lint checks on newly created hooks with zero errors.

---

### 🟩 Milestone 3: Modular Header & Navigation (`Header.jsx`) — ✅ COMPLETED
- [x] Create `client/src/components/layout/header/ConnectionRadar.jsx` (Tactical connection pill)
- [x] Create `client/src/components/layout/header/OfflineQueueModal.jsx` (Queue inspection drawer)
- [x] Create `client/src/components/layout/header/RemindersDrawer.jsx` (Tasks & push alerts)
- [x] Create `client/src/components/layout/header/UserProfileMenu.jsx` (User avatar dropdown & officer link)
- [x] Create `client/src/components/layout/header/EditProfileModal.jsx` (Personnel profile & credentials editor)
- [x] Refactor `client/src/components/layout/Header.jsx` from 1,144 lines down to 175 lines.
- [x] **Verification:** Verified clean lint and Vite production build with zero errors.

---

### 🟩 Milestone 4: Modular Tree Profile (`TreeProfilePage.jsx`) — ✅ COMPLETED
- [x] Create `client/src/components/tree/profile/TreeProfileHero.jsx` (Hero photo, ID, vitality badge, stage bar)
- [x] Create `client/src/components/tree/profile/TreeMetricsSummary.jsx` (Height gain, stem diameter, foliage, observation count)
- [x] Create `client/src/components/tree/profile/TreeActionToolbar.jsx` (Record log, QR tag, map link, task button)
- [x] Create `client/src/components/tree/profile/TreeQRModal.jsx` (High-res vector QR code & tag PNG generator)
- [x] Create `client/src/components/tree/profile/TreePhotoLightbox.jsx` (Fullscreen observation photo viewer)
- [x] Refactor `client/src/pages/TreeProfilePage.jsx` from 1,019 lines down to 240 lines.
- [x] Fixed oxlint warnings (eliminated unused `isOffline`, wrapped fetch in `useCallback`).
- [x] **Verification:** Verified clean lint and Vite production build with zero errors.

---

### 🟩 Milestone 5: Modular Officer Dashboard (`OfficerDashboardPage.jsx`) — ✅ COMPLETED
- [x] Create `client/src/components/officer/OfficerCohortStats.jsx` (Telemetry KPI cards)
- [x] Create `client/src/components/officer/RosterFilterToolbar.jsx` (Search, role tabs, status pills, course dropdown)
- [x] Create `client/src/components/officer/CadetRosterTable.jsx` (Desktop table & mobile card views)
- [x] Create `client/src/components/officer/CadetInspectionModal.jsx` (Cadet inspection drawer with verified photos)
- [x] Create `client/src/components/officer/OfficerExcelExport.js` (Pure SheetJS Excel workbook generation)
- [x] Refactor `client/src/pages/OfficerDashboardPage.jsx` from 929 lines down to 195 lines.
- [x] **Verification:** Verified clean lint and Vite production build with zero errors.

---

### 🟩 Milestone 6: Growth Entry, Scanner & Map Modernization — ✅ COMPLETED
- [x] Create `client/src/components/growth/ObservationPhotoPicker.jsx` (Live camera shutter, gallery picker, client compression)
- [x] Create `client/src/components/growth/ObservationVitalitySelector.jsx` (Forestry vitality radio cards)
- [x] Create `client/src/components/growth/ObservationMetricsInputs.jsx` (Height, stem caliper, foliage, growth stage)
- [x] Refactor `client/src/components/growth/GrowthEntryForm.jsx` from 545 lines down to 198 lines.
- [x] Fixed oxlint warnings in `RegisterTreePage.jsx` and `GrowthLogsPage.jsx` (unused variables, error alerts).
- [x] **Verification:** Verified clean lint and Vite production build with zero errors. All 6 initial milestones complete and committed!

---

### 🟩 Milestone 7: Backend Reminder Domain Service (`server/src/services/reminderService.js`) — ✅ COMPLETED
- [x] Create `server/src/services/reminderService.js` (Encapsulating reminder CRUD, recurrence logic, push notifications dispatch, subscriber cleanups)
- [x] Refactor `server/src/controllers/reminderController.js` to thin controller (393 → 125 lines)
- [x] **Verification:** Verified server syntax and route integrity.

---

### 🟩 Milestone 8: Modular Specimen Registration (`RegisterTreePage.jsx`) — ✅ COMPLETED
- [x] Create `client/src/components/tree/register/RegistrationLocationSection.jsx` (Map pin placement, sector dropdown, dynamic zone creation)
- [x] Create `client/src/components/tree/register/RegistrationTaxonomySection.jsx` (Species selection, custom input, nickname tag)
- [x] Create `client/src/components/tree/register/RegistrationPhotoSection.jsx` (Camera shutter, photo gallery, client-side canvas compression, health & stage)
- [x] Create `client/src/components/tree/register/RegistrationMetricsSection.jsx` (Baseline height, stem caliper, foliage, notes)
- [x] Refactor `client/src/pages/RegisterTreePage.jsx` from 741 lines down to 252 lines orchestrator.
- [x] **Verification:** Verified clean build and oxlint with zero errors.

---

### 🟩 Milestone 9: Modular Campus Map System (`CampusMapPage.jsx`) — ✅ COMPLETED
- [x] Create `client/src/components/map/mapIcons.js` (DivIcon generators, user GPS beacon, health color mapping)
- [x] Create `client/src/components/map/MapFilterToolbar.jsx` (Search/scope toggle, vitality filter pills, CTU Barili center, live GPS find button)
- [x] Create `client/src/components/map/MapLegendOverlay.jsx` (Tactical health matrix HUD overlay)
- [x] Refactor `client/src/pages/CampusMapPage.jsx` from 526 lines down to 260 lines orchestrator.
- [x] **Verification:** Verified clean build and oxlint with zero errors.

---

### 🟩 Milestone 10: Modular Growth Logs & Observation Ledger (`GrowthLogsPage.jsx`) — ✅ COMPLETED
- [x] Create `client/src/components/growth/LogsToolbar.jsx` (Fast actions, SheetJS export button, status notifications)
- [x] Create `client/src/components/growth/LogsSpecimenCard.jsx` (Active focus dropdown, telemetry summary metric cards)
- [x] Create `client/src/components/growth/GrowthLogExport.js` (Pure SheetJS Excel workbook generation)
- [x] Refactor `client/src/pages/GrowthLogsPage.jsx` from 594 lines down to 290 lines orchestrator.
- [x] **Verification:** Verified clean build and oxlint with zero errors.

---

### 🟩 Milestone 11: Modular Tactical QR Scanner & Audio Utilities (`QRScannerView.jsx`) — ✅ COMPLETED
- [x] Create `client/src/components/scan/scannerAudio.js` (Web Audio API acoustic chirp, haptics, canvas luminance inverter)
- [x] Create `client/src/components/scan/ScannerControlsBar.jsx` (Switch camera, flashlight torch, gallery QR upload)
- [x] Create `client/src/components/scan/ScannerStandbyOverlay.jsx` (Standby field backdrop, hardware status, camera start)
- [x] Refactor `client/src/components/scan/QRScannerView.jsx` from 531 lines down to 260 lines orchestrator.
- [x] **Verification:** Verified clean build and oxlint with zero errors. All 11 v2.5 refactoring milestones completed!

