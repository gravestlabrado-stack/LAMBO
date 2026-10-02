# 🌱 LAMBO

[![Release](https://img.shields.io/badge/release-v1.0.0-8B9B4C.svg?style=flat-square&logo=github)](docs/RELEASES.md)
[![Status](https://img.shields.io/badge/v2.0-in%20development-EAB308.svg?style=flat-square)](docs/v2_PLAN.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-A4B566.svg?style=flat-square)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20Capable-525E31.svg?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

**Landscape Analytics for Monitoring Botanical Observation**

A student-centered progressive web application for tracking and monitoring wildling seedlings and trees on campus. Built with a premium tactical army-green aesthetic, LAMBO helps students register, measure, photograph, and track the growth of their assigned wildlings throughout the school year.

---

## 📚 Project Documentation

All formal technical architecture, release notes, and operational guides are organized in the [`docs/`](./docs) directory:

- 🚀 [**v2.0 Implementation Blueprint**](./docs/v2_PLAN.md) — Phased engineering plan for the Command & Inspection release.
- 📖 [**Architecture in Plain English**](./docs/PLAIN_ENGLISH_GUIDE.md) — Non-technical guide for evaluators, teachers, and students.
- 🏷️ [**GitHub Versioning & Tagging Guide**](./docs/GITHUB_WORKFLOW.md) — Step-by-step SemVer, Git tag, and GitHub Release manual.
- 📋 [**Release Notes & Changelog**](./docs/RELEASES.md) — Detailed changelog for v1.0.0 and v2.0.0.
- 🏛️ [**System Architecture & Engineering**](./docs/ARCHITECTURE.md) — Data models, RBAC, mandatory photo pipeline, and v3 gamification foundation.
- 🎖️ [**NSTP Officer & Instructor Field Manual**](./docs/OFFICER_GUIDE.md) — Cadets inspection, photo verification, and Excel grade exporting.

---

## ✨ Features (v1.0)

### 🌳 Tree Registration & Management
- Register seedlings with species, nickname, location, and photos
- Auto-generated tree IDs (e.g., `LMB-0001`) for easy tracking
- **QR Code Generation** — downloadable PNG QR codes to print and attach to seedlings

### 📊 Growth Tracking
- Log growth measurements: **height** (required), stem diameter, leaf count, fruit count
- Track growth stages: Seedling → Vegetative → Flowering → Fruit Set → Ripening → Harvest
- Monitor health status: Healthy / Monitoring / Needs Attention
- Attach photos and notes to each growth entry

### 📸 QR Code Scanning
- Scan QR labels on seedlings using your phone camera to instantly open the tree profile
- Manual tree ID input fallback for devices without camera access
- HUD-style tactical scanner UI

### 📈 Data Visualization
- Interactive growth charts showing height and diameter trends over time
- Dashboard with overall stats, health distribution donut chart, and recent activity feed
- **Export to Excel** — download growth data as `.xlsx` for research defense or class reports

### 🗺️ Campus Map
- Interactive Leaflet.js map showing all registered trees on campus
- Tree markers color-coded by health status (green/amber/red)
- Click markers to view tree info and navigate to profile

### 🔔 Reminders & Notifications
- Push notifications for watering, fertilizing, and care schedules
- Configurable reminder frequency per tree

### 📴 Offline Mode
- Full PWA — installable on mobile home screens
- Record growth data offline, auto-syncs when back online
- Service worker caches app shell for instant loading

### 🔐 Authentication
- Student login with **roll number + password**
- JWT-based stateless authentication
- Students see only their own trees and data

---

## 🚀 Upcoming in v2.0 (Command & Inspection)

- 🎖️ **NSTP Officer Command Dashboard**: Student roster, compliance tracking, overdue observation alerts, and cohort Excel grading exports.
- 🌲 **Forestry Standard Vitality Classification**: `Thriving`, `Stable / Fair`, `Distressed / At Risk`, and `Dead / Mortality`.
- 📷 **Mandatory Observation Photography**: Photographic evidence required for every growth entry with offline queue serialization.
- 🎓 **Enhanced Cadet Enrollment**: Degree program dropdown list and contact telephone fields.
- 🎮 **v3 Gamification Foundation**: Architectural event hooks for care streaks, badges, and leaderboards.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | TailwindCSS v3 |
| Charts | Chart.js + react-chartjs-2 |
| QR Codes | qrcode.react |
| QR Scanning | html5-qrcode |
| Maps | Leaflet + react-leaflet |
| PWA / Offline | vite-plugin-pwa (Workbox) |
| Notifications | Web Push API + web-push |
| Export | xlsx (SheetJS) |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Image Storage | Cloudinary |

---

## 📁 Project Structure

```
LAMBO/
├── docs/            # Engineering, architecture & release documentation
│   ├── v2_PLAN.md          # Phased engineering blueprint for v2
│   ├── GITHUB_WORKFLOW.md  # Semantic versioning & GitHub release manual
│   ├── RELEASES.md         # Release notes & version changelog
│   ├── ARCHITECTURE.md     # Data schemas, RBAC, and gamification hooks
│   └── OFFICER_GUIDE.md    # Guide for NSTP officers & instructors
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page-level components
│   │   ├── services/     # API call modules
│   │   ├── context/      # React context (auth)
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Utilities & constants
│   └── ...
├── server/          # Node.js + Express backend
│   ├── src/
│   │   ├── models/       # Mongoose schemas
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/       # API route definitions
│   │   ├── middleware/   # Auth, upload, error handling
│   │   └── config/       # DB & Cloudinary config
│   └── ...
├── DESIGN/          # Design boards & design system (reference)
├── plan.md          # Original implementation plan
├── agents.md        # AI agent development instructions
└── Idea.md          # Feature brainstorm & vision
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier) or local MongoDB
- Cloudinary account (free tier)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/LAMBO.git
cd LAMBO

# Backend setup
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Cloudinary credentials

# Frontend setup
cd ../client
npm install
```

### Environment Variables

#### Server (`server/.env`)
```bash
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/lambo
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
NODE_ENV=development
```

#### Client (`client/.env`)
```bash
VITE_API_URL=http://localhost:5000/api
```

### Running the App

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API requests to the backend on port `5000`.

---

## 🎨 Design System

LAMBO uses a **tactical army-green aesthetic** inspired by military field instruments and ruggedized equipment. Key elements:

- **Dark olive surfaces** with tonal layering (no shadows)
- **Chivo** font for headings and body text
- **JetBrains Mono** for labels, data, and metrics
- **Sharp corners** (0px border radius on most elements)
- **Status colors**: Green (Healthy), Amber (Monitoring), Red (Needs Attention)

Design reference files are in the `DESIGN/` folder — see `DESIGN/DESIGN.md` for the full specification.

---

## 🎯 Target Species

Built for Filipino campus wildling programs, supporting species like:
- Mango, Guyabano, Jackfruit, Coconut, Calamansi
- Avocado, Papaya, Banana, Durian, Rambutan
- Cacao, Coffee, Narra, Mahogany, Ipil-ipil

---

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create student account |
| `POST` | `/api/auth/login` | Login → JWT |
| `GET` | `/api/auth/profile` | Current user profile |
| `GET` | `/api/trees` | List student's trees |
| `POST` | `/api/trees` | Register new tree |
| `GET` | `/api/trees/stats` | Dashboard statistics |
| `GET` | `/api/trees/:id` | Tree details |
| `PUT` | `/api/trees/:id` | Update tree |
| `DELETE` | `/api/trees/:id` | Delete tree |
| `GET` | `/api/trees/:treeId/logs` | Growth logs for tree |
| `POST` | `/api/trees/:treeId/logs` | Add growth entry |
| `DELETE` | `/api/trees/:treeId/logs/:logId` | Delete log |
| `GET` | `/api/trees/:treeId/export` | Export logs for Excel |

---

## 🗺️ Roadmap

### v1.0 (Current)
- ✅ Student auth (roll number + password)
- ✅ Tree registration with QR code generation
- ✅ Growth log tracking with photos
- ✅ Dashboard with stats & charts
- ✅ Export to Excel
- ✅ QR code scanning with camera
- ✅ Push notification reminders
- ✅ Campus map visualization
- ✅ Offline mode & PWA

### v2.0 (Planned)
- 🔜 Teacher/admin roles with class management
- 🔜 Gamification & achievement badges
- 🔜 Species-specific care guides
- 🔜 Survival tracker statistics
- 🔜 Peer sharing & collaboration

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

1. Read `agents.md` for development guidelines
2. Read `plan.md` for the implementation plan
3. Check `DESIGN/` for visual references
4. Follow the code style and component patterns described in `agents.md`

---

*Built with 💚 for campus forestry programs*
