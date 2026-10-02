# 🏷️ GitHub Versioning & Release Workflow Guide

This guide establishes the versioning protocol and release lifecycle for **LAMBO (Landscape Analytics for Monitoring Botanical Observation)**. Follow these standards to ensure project history, releases, and changelogs remain professional, reproducible, and transparent.

---

## 📌 1. Semantic Versioning Specification (SemVer)

LAMBO follows the **[Semantic Versioning 2.0.0](https://semver.org/)** specification (`vMAJOR.MINOR.PATCH`):

```
v2.0.0
 ┬ ┬ ┬
 │ │ └─ PATCH: Backwards-compatible bug fixes or minor cosmetic adjustments
 │ └─── MINOR: New features added in a backwards-compatible manner
 └───── MAJOR: Breaking changes, architectural overhauls, or significant milestone upgrades
```

### Version Milestones in LAMBO:
- **`v1.0.0`**: Initial Production Baseline — Cadet seedling registration, QR generation/scanning, growth tracking charts, campus map, PWA offline sync, and push notifications.
- **`v2.0.0`**: Command & Inspection Release — NSTP Officer Compliance Dashboard, Forestry Standard plant health tiers (`Thriving`, `Fair`, `Distressed`, `Dead / Mortality`), mandatory observation photos, role-based access control, and enhanced student enrollment.
- **`v3.0.0`** *(Future)*: Engagement & Gamification Release — Cadet achievements, badges, streaks, care score leaderboard, and peer collaborative observations.

---

## 🏷️ 2. Git Tagging Protocol

Tags mark exact points in Git history as releases. Always use **annotated tags** rather than lightweight tags because annotated tags record the tagger name, email, date, and a cryptographic checksum.

### A. Creating an Annotated Git Tag Locally

To tag a completed version:

```bash
# Ensure you are on the main branch and up to date
git checkout main
git pull origin main

# Create an annotated tag with release title
git tag -a v1.0.0 -m "Release v1.0.0: Landscape Analytics for Monitoring Botanical Observation Baseline"

# Verify the tag details
git show v1.0.0
```

### B. Pushing Tags to GitHub Remote

By default, `git push` does not push tags to remote repositories. You must push tags explicitly:

```bash
# Push a specific tag
git push origin v1.0.0

# Or push all local tags simultaneously
git push origin --tags
```

### C. Managing & Deleting Tags (If a mistake occurs)

```bash
# List all existing tags
git tag -n

# Delete a tag locally
git tag -d v1.0.0

# Delete a tag on remote GitHub repository
git push --delete origin v1.0.0
```

---

## 🚀 3. Publishing an Official GitHub Release

GitHub Releases allow teams to package software, attach release notes, and distribute downloadable assets.

### Option A: Via GitHub Web Interface (Recommended for Visual Polish)

1. Open your repository on GitHub: `https://github.com/<owner>/LAMBO`.
2. On the right-side sidebar, locate the **Releases** section and click **"Create a new release"** (or click **Tags** → **Create release**).
3. **Choose a tag**:
   - Select an existing pushed tag (e.g. `v1.0.0`), OR type a new tag name to create it on publish.
4. **Target branch**: Select `main`.
5. **Release title**: Use a descriptive milestone name:
   - Example: `v1.0.0 — Student Botanical Monitoring Baseline`
   - Example: `v2.0.0 — NSTP Officer Command Portal & Forestry Standard Compliance`
6. **Release description**: Copy the formatted release notes from [`docs/RELEASES.md`](./RELEASES.md).
7. If the release is not yet production-stable, check **"Set as a pre-release"**.
8. Click **"Publish release"**.

---

### Option B: Via GitHub CLI (`gh`)

If you have the [GitHub CLI](https://cli.github.com/) installed:

```bash
# Create release directly from terminal with release notes file
gh release create v1.0.0 \
  --title "v1.0.0 — Student Botanical Monitoring Baseline" \
  --notes-file docs/RELEASES.md \
  --target main
```

---

## 📝 4. Release Notes Template

Every GitHub release should adhere to this standardized markdown layout:

```markdown
# LAMBO vX.Y.Z — Release Title

> Short one-sentence summary of what this release delivers to cadets and officers.

## 🌟 What's New
- **Feature Name**: Brief description of the capability and student/officer benefit.
- **Feature Name**: Brief description of the capability.

## 🛠️ Enhancements & Improvements
- **Component**: Detail on UX, responsiveness, or visual changes.
- **API / Database**: Detail on schema updates or backend performance.

## 🐛 Bug Fixes
- Fixed an issue where [description of bug and fix].

## 📦 Migration & Configuration Notes
- Any required environment variables (e.g., `OFFICER_SIGNUP_KEY=...`).
- Any required database index updates.

## 👥 Contributors & Acknowledgments
- Maintained by [Project Team / Lead Developer].
```

---

## 🛡️ 5. Badges for README.md

To give your repository a clean, professional aesthetic, include dynamic status badges at the top of [`README.md`](../README.md):

```markdown
[![GitHub Release](https://img.shields.io/github/v/release/<owner>/LAMBO?color=8B9B4C&label=release&logo=github&style=flat-square)](https://github.com/<owner>/LAMBO/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-A4B566.svg?style=flat-square)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-525E31.svg?style=flat-square&logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![Status](https://img.shields.io/badge/status-active%20development-4F5A2D.svg?style=flat-square)](https://github.com/<owner>/LAMBO)
```
