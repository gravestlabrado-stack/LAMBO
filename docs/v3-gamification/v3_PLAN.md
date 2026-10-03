# 🚀 LAMBO v3.0 Implementation Blueprint

> **Milestone:** Gamification, Field Integrity & Modular Architecture Release  
> **Target Date:** October 2026  
> **Status:** Specification Approved / Ready for Phased Execution

---

## 📋 Table of Contents
1. [Milestone Vision & Objectives](#1-milestone-vision--objectives)
2. [Phase 1: Modular Component Decomposition (Codebase Health)](#phase-1-modular-component-decomposition-codebase-health)
3. [Phase 2: Gamification Schema & XP Transaction Ledger](#phase-2-gamification-schema--xp-transaction-ledger)
4. [Phase 3: Anti-Cheat & Biological Plausibility Engine](#phase-3-anti-cheat--biological-plausibility-engine)
5. [Phase 4: Tactical Gamification UI & Micro-Interactions](#phase-4-tactical-gamification-ui--micro-interactions)
6. [Phase 5: Non-Toxic Leaderboards & Platoon Cooperative Milestones](#phase-5-non-toxic-leaderboards--platoon-cooperative-milestones)
7. [Phase 6: Social Auditing (Buddy Missions & Officer Field Stamps)](#phase-6-social-auditing-buddy-missions--officer-field-stamps)
8. [Phase 7: Test Cohort Seeding, Documentation & Release Tagging](#phase-7-test-cohort-seeding-documentation--release-tagging)

---

## 1. Milestone Vision & Objectives

LAMBO v3 elevates the platform into an engaging, habit-forming academic forestry stewardship game while resolving software technical debt:
- **Combat Goodhart's Law & Plant Swapping:** Ensure students are rewarded for reliable care habits, observational detail, and honest mortality reporting—making cheating obsolete.
- **Decompose 500+ Line Monoliths:** Refactor `Header.jsx`, `TreeProfilePage.jsx`, and `OfficerDashboardPage.jsx` into clean, testable sub-components before layering gamification.
- **Stewardship XP & Badges:** Deploy 5 Forester Ranks, weekly care streak multipliers, and tactical military-botanical ribbon badges.
- **Platoon Cooperative Goals:** Emphasize cohort survival rate over zero-sum individual rankings to build class camaraderie.

---

## Phase 1: Modular Component Decomposition (Codebase Health)

Refactor monolithic files following the [Code Refactoring Plan](./CODE_REFACTOR_PLAN.md):
- [ ] **Header Modularization (`client/src/components/layout/Header.jsx`)**:
  - Extract `ConnectionRadar.jsx`, `SyncStatusIndicator.jsx`, `OfflineQueueModal.jsx`, `UserProfileMenu.jsx`.
- [ ] **Tree Profile Modularization (`client/src/pages/TreeProfilePage.jsx`)**:
  - Extract `TreeProfileHero.jsx`, `TreeMetricsSummary.jsx`, `TreeActionToolbar.jsx`, `GrowthChartSection.jsx`.
- [ ] **Officer Dashboard Modularization (`client/src/pages/OfficerDashboardPage.jsx`)**:
  - Extract `OfficerCohortStats.jsx`, `RosterFilterToolbar.jsx`, `CadetRosterTable.jsx`, `CadetInspectionModal.jsx`, `OfficerExcelExport.js`.
- [ ] **Verification**:
  - Verify zero regressions in offline mode, photo capture, and roster filtering.

---

## Phase 2: Gamification Schema & XP Transaction Ledger

- [ ] **User Model Enhancements (`server/src/models/User.js`)**:
  - Add `xp: { type: Number, default: 0 }`.
  - Add `rank: { type: String, enum: ['Recruit Cadet', 'Seedling Scout', 'Forest Ranger', 'Forestry Warden', 'Chief Forest Steward'], default: 'Recruit Cadet' }`.
  - Add `streak: { current: { type: Number, default: 0 }, longest: { type: Number, default: 0 }, lastLogDate: Date }`.
  - Add `badges: [{ badgeId: String, awardedAt: { type: Date, default: Date.now }, metadata: Object }]`.
- [ ] **XP Transaction Ledger Model (`server/src/models/GamificationLog.js`)**:
  - Track every XP event (`userId`, `actionType`, `xpAwarded`, `treeId`, `timestamp`) for audit transparency.
- [ ] **Gamification Controller & Engine (`server/src/controllers/gamificationController.js`)**:
  - Implement XP awarding pipeline with weekly 5-day cooldown rate limit.
  - Implement rank threshold calculation and auto-elevation.
  - Implement badge evaluation triggers.

---

## Phase 3: Anti-Cheat & Biological Plausibility Engine

- [ ] **Biological Growth Delta Checks (`server/src/controllers/growthLogController.js`)**:
  - Compare incoming height/stem diameter against previous observation.
  - Flag anomalies: $\Delta\text{Height} > 12\text{ cm}$ or shrinkage without pruning tag.
- [ ] **GPS Geofence Validation**:
  - Client captures device GPS during log creation.
  - Server computes distance to tree coordinates; flags logs $> 35\text{m}$ from registered plot.
- [ ] **Honest Mortality & Autopsy Workflow**:
  - Add "Report Mortality / Request Autopsy" option in `GrowthEntryForm.jsx`.
  - Officer reviews mortality diagnosis and issues replant authorization + +100 XP integrity award.

---

## Phase 4: Tactical Gamification UI & Micro-Interactions

- [ ] **Context & State Management (`client/src/context/GamificationContext.jsx`)**:
  - Manage live XP, current streak, active badges, and notification queues.
- [ ] **Tactical Gamification Components**:
  - `GamificationHeaderPill.jsx`: Displays rank icon, XP bar, and streak flame in the main header.
  - `XPToast.jsx`: Tactile animated slide-in popup (`+50 XP • WEEKLY CARE LOG`).
  - `LevelUpModal.jsx`: High-impact rank promotion celebration dialog.
  - `BadgesDrawer.jsx`: Tactical medal ribbon rack in cadet profile.

---

## Phase 5: Non-Toxic Leaderboards & Platoon Cooperative Milestones

- [ ] **Leaderboard API (`server/src/routes/gamificationRoutes.js`)**:
  - Endpoint for cohort cooperative stats (class survival %, total logs, platoon badge status).
  - Endpoint for weekly rotating consistency top 10.
  - Endpoint for rank tier listings.
- [ ] **Leaderboard Frontend Page (`client/src/pages/LeaderboardPage.jsx`)**:
  - Tab 1: **Platoon Objective** (Cooperative campus survival progress).
  - Tab 2: **Forester Tiers** (Cadets grouped by military-forestry rank).
  - Tab 3: **Weekly Scouts** (Active weekly consistency streak leaders).

---

## Phase 6: Social Auditing (Buddy Missions & Officer Field Stamps)

- [ ] **Peer Cross-Inspection**:
  - Route and UI allowing cadets to conduct monthly "Buddy Audits" on peers' trees.
- [ ] **Officer Field Seal Action**:
  - Button inside `CadetInspectionModal.jsx` allowing officers to confer a field stamp (+50 XP).

---

## Phase 7: Test Cohort Seeding, Documentation & Release Tagging

- [ ] **V3 Demo Seeding Script (`server/src/utils/seedV3Data.js`)**:
  - Seed cadets with varying XP, streaks, badges, autopsy reports, and geofence flags.
- [ ] **Release Packaging**:
  - Update `docs/RELEASES.md` with full v3.0.0 changelog.
  - Tag `v3.0.0` upon validation.
