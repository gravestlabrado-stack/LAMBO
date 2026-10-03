# 📚 LAMBO Documentation Hub

Welcome to the central technical and operational documentation repository for **LAMBO (Landscape Analytics for Monitoring Botanical Observation)**.

---

## 🗂️ Documentation Structure

```
docs/
├── README.md                          # Master documentation index (You are here)
├── ARCHITECTURE.md                    # System-wide cross-cutting architecture
├── RELEASES.md                        # Master changelog and release history
├── PLAIN_ENGLISH_GUIDE.md             # Non-technical guide for teachers & evaluators
├── GITHUB_WORKFLOW.md                 # Branching, SemVer, and GitHub Release manual
├── Idea.md                            # Original seed ideas and features
│
├── v1-features/                       # v1.0 Baseline Milestone
│   └── v1_PLAN.md                     # Initial implementation plan & MVP features
│
├── v2-features/                       # v2.0 Command & Inspection Milestone
│   ├── v2_PLAN.md                     # v2 implementation blueprint & phases
│   └── OFFICER_GUIDE.md               # NSTP officer portal, roster & Excel export guide
│
└── v3-gamification/                   # v3.0 Gamification, Field Integrity & Modular Refactor
    ├── NSTP_STAKEHOLDER_REVIEW_PROPOSAL.md # Strategic proposal & feedback worksheet for reviewers
    ├── v3_PLAN.md                     # Overarching v3 milestone implementation plan
    ├── ANTI_CHEAT_ANALYSIS.md         # Plant swapping, photo forgery & anomaly threat model
    ├── GAMIFICATION_SPEC.md           # XP economy, streaks, badges, ranks & non-toxic leaderboards
    └── CODE_REFACTOR_PLAN.md          # Modularization blueprint for 500+ line components
```

---

## 🚀 Version Blueprints & Features

### 🌿 [v1.0 Baseline Milestone](./v1-features/v1_PLAN.md)
- Cadet self-registration and tactical tree identification (`LMB-xxxx`).
- Camera QR scanning with tactical HUD reticle.
- Chart.js sequential growth curves.
- Client-side Excel export and PWA offline caching.

### 🎖️ [v2.0 Command & Inspection Milestone](./v2-features/v2_PLAN.md)
- **NSTP Officer Command Portal** and student compliance roster.
- **Academic Forestry Vitality Ratings** (`Thriving`, `Stable / Fair`, `Distressed / At Risk`, `Dead / Mortality`).
- **Mandatory Photographic Evidence Pipeline** with client-side canvas compression.
- **Multi-Store IndexedDB Offline Architecture** (`lambo_offline_db`) and tactical header radar hub.
- Read the [**NSTP Officer Guide**](./v2-features/OFFICER_GUIDE.md) for field operation instructions.

### 🎮 [v3.0 Gamification & Modular Architecture](./v3-gamification/v3_PLAN.md)
- 📋 [**Stakeholder Review & Feedback Proposal**](./v3-gamification/NSTP_STAKEHOLDER_REVIEW_PROPOSAL.md) — Strategic proposal & questions prepared for NSTP coordinators and reviewers.
- **Anti-Cheat & Plant Integrity Engine**: Mitigating Goodhart's law, plant swapping, and fake observations ([Read Analysis](./v3-gamification/ANTI_CHEAT_ANALYSIS.md)).
- **Stewardship Gamification**: 5 Forester Ranks, weekly care streak multipliers, tactical ribbon medals, and honest mortality autopsy quests ([Read Gamification Spec](./v3-gamification/GAMIFICATION_SPEC.md)).
- **Code Refactoring Roadmap**: Detailed component decomposition plan ([Read Refactoring Plan](./v3-gamification/CODE_REFACTOR_PLAN.md)).

---

## 📖 Global Guides

- 🏛️ [**System Architecture & Engineering**](./ARCHITECTURE.md) — Technical stack, schemas, and offline data flow.
- 📋 [**Release Notes & Changelog**](./RELEASES.md) — Chronological version release notes.
- 📖 [**Architecture in Plain English**](./PLAIN_ENGLISH_GUIDE.md) — Easy-to-understand walkthrough for academic defense.
- 🏷️ [**GitHub Workflow & Release Guide**](./GITHUB_WORKFLOW.md) — Git tagging, branches, and release commands.
