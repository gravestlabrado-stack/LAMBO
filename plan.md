# 🌱 LAMBO v1.0 — Implementation Plan

> **Landscape Analytics for Monitoring Botanical Observation**
> A student-centered wildling (seedling/tree) monitoring web app for campus forestry programs.

---

## 1. Project Overview

### What We're Building
A mobile-first web application where students can register seedlings/trees, track their growth over time with photos and measurements, generate printable QR codes for physical labeling, and visualize growth trends through charts — all wrapped in a premium tactical army-green aesthetic inspired by the existing design boards.

### Target Users (v1.0)
- **Students** — single role for v1. Teacher/admin roles deferred to v2.

### Design Direction
- Keep the **tactical army-green aesthetic** from the design boards (dark olive surfaces, Chivo + JetBrains Mono typography, military-inspired cards and badges)
- **Simplify terminology** for students (no "Ranger Elena", no LiDAR, no AR scanning, no sector grids)
- Use the design board **component patterns** (cards, nav bar, chips, data metrics, donut charts) as the visual foundation

---

## 2. Confirmed Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React 18 + Vite | Fast dev server, modern build tooling |
| **Styling** | TailwindCSS v3 | Design boards already use it; rapid prototyping |
| **Routing** | React Router v6 | Client-side SPA routing |
| **Charts** | Chart.js + react-chartjs-2 | Simple, lightweight growth trend charts |
| **QR Codes** | qrcode.react | Generate QR codes in-browser, downloadable as PNG |
| **QR Scanning** | html5-qrcode | Camera-based QR code scanning to identify trees |
| **Data Export** | xlsx (SheetJS) | Client-side Excel export for research reports |
| **HTTP Client** | Axios | API calls with interceptors for JWT |
| **Maps** | Leaflet + react-leaflet | Interactive campus map for tree locations |
| **PWA / Offline** | vite-plugin-pwa (Workbox) | Service worker for offline caching & background sync |
| **Notifications** | Web Push API + web-push (server) | Push notifications for care reminders |
| **Backend** | Node.js + Express | REST API server |
| **Database** | MongoDB + Mongoose | Flexible schema, free Atlas tier |
| **Auth** | JWT (jsonwebtoken + bcryptjs) | Stateless auth with roll number + password |
| **Image Storage** | Cloudinary | Free tier (25GB), auto-optimization, CDN |
| **File Upload** | Multer + cloudinary SDK | Multipart form handling → Cloudinary upload |
| **Validation** | express-validator | Request body validation middleware |
| **CORS** | cors | Cross-origin for dev (Vite:5173 → Express:5000) |
| **Env Config** | dotenv | Environment variable management |

---

## 3. Monorepo Structure

```
LAMBO/
├── DESIGN/                          # Existing design boards (read-only reference)
│   ├── DESIGN.md                    # Design system specification
│   ├── lambo_dashboard_army_green/  # Dashboard design board
│   ├── lambo_growth_logs_army_green/# Growth logs design board
│   ├── lambo_register_tree_army_green/ # Register tree design board
│   ├── lambo_scan_identify_army_green/ # Scan/identify design board
│   └── lambo_tree_profile_army_green/  # Tree profile design board
│
├── client/                          # React + Vite frontend
│   ├── public/
│   │   └── lambo-logo.svg
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.jsx
│   │   │   │   ├── Header.jsx
│   │   │   │   └── BottomNav.jsx
│   │   │   ├── ui/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Chip.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Select.jsx
│   │   │   │   ├── MetricCard.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── LoadingSpinner.jsx
│   │   │   │   ├── Toast.jsx
│   │   │   │   └── EmptyState.jsx
│   │   │   ├── tree/
│   │   │   │   ├── TreeCard.jsx
│   │   │   │   ├── GrowthEntryForm.jsx
│   │   │   │   ├── GrowthTimeline.jsx
│   │   │   │   ├── GrowthChart.jsx
│   │   │   │   ├── QRCodeDisplay.jsx
│   │   │   │   ├── QRScannerView.jsx
│   │   │   │   ├── HealthDonut.jsx
│   │   │   │   └── StageProgressBar.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── WelcomeBanner.jsx
│   │   │   │   ├── StatsGrid.jsx
│   │   │   │   ├── HealthOverview.jsx
│   │   │   │   └── RecentActivity.jsx
│   │   │   └── map/
│   │   │       └── CampusMap.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── TreeListPage.jsx
│   │   │   ├── RegisterTreePage.jsx
│   │   │   ├── TreeProfilePage.jsx
│   │   │   ├── GrowthLogsPage.jsx
│   │   │   ├── ScanPage.jsx
│   │   │   ├── CampusMapPage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useTrees.js
│   │   │   └── useGrowthLogs.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── treeService.js
│   │   │   └── growthLogService.js
│   │   ├── utils/
│   │   │   ├── constants.js
│   │   │   ├── formatters.js
│   │   │   └── exportToExcel.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── index.html
│   └── package.json
│
├── server/                          # Node.js + Express backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── cloudinary.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Tree.js
│   │   │   ├── GrowthLog.js
│   │   │   └── Reminder.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── treeRoutes.js
│   │   │   ├── growthLogRoutes.js
│   │   │   └── reminderRoutes.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── treeController.js
│   │   │   ├── growthLogController.js
│   │   │   └── reminderController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── upload.js
│   │   │   └── errorHandler.js
│   │   └── utils/
│   │       ├── generateTreeId.js
│   │       ├── validators.js
│   │       └── pushNotification.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── agents.md
├── plan.md                          # This file
├── Idea.md
├── LICENSE
└── README.md
```

---

## 4. Data Models (Mongoose Schemas)

### 4.1 User Schema
```javascript
const userSchema = new Schema({
  name:       { type: String, required: true, trim: true },
  rollNumber: { type: String, required: true, unique: true, trim: true },
  password:   { type: String, required: true }, // bcrypt hashed
  course:     { type: String, trim: true },     // e.g., "BS Forestry" or "BSAB-3A"
  avatar:     { type: String, default: '' },    // Cloudinary URL (optional)
  createdAt:  { type: Date, default: Date.now }
});
```

### 4.2 Tree Schema
```javascript
const treeSchema = new Schema({
  treeId:      { type: String, required: true, unique: true }, // e.g., "LMB-0001"
  owner:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  species:     { type: String, required: true },
  nickname:    { type: String, trim: true },
  location:    { type: String, trim: true },
  datePlanted: { type: Date, default: Date.now },
  status:      { type: String, enum: ['alive', 'dead', 'unknown'], default: 'alive' },
  healthStatus:{ type: String, enum: ['Healthy', 'Monitoring', 'Needs Attention'], default: 'Healthy' },
  currentStage:{ type: String, enum: ['Seedling', 'Vegetative', 'Flowering', 'Fruit Set', 'Ripening', 'Harvest'], default: 'Seedling' },
  photos:      [{ url: String, caption: String, uploadedAt: Date }],
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now }
});
```

### 4.3 GrowthLog Schema
```javascript
const growthLogSchema = new Schema({
  tree:          { type: Schema.Types.ObjectId, ref: 'Tree', required: true },
  loggedBy:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  height:        { type: Number, required: true },  // cm — REQUIRED
  stemDiameter:  { type: Number },                  // cm (optional)
  leafCount:     { type: Number },                  // optional
  fruitCount:    { type: Number },                  // optional
  growthStage:   { type: String, enum: ['Seedling', 'Vegetative', 'Flowering', 'Fruit Set', 'Ripening', 'Harvest'] },
  healthStatus:  { type: String, enum: ['Healthy', 'Monitoring', 'Needs Attention'] },
  photo:         { type: String },                  // Cloudinary URL (optional)
  notes:         { type: String, trim: true },
  loggedAt:      { type: Date, default: Date.now }
});
```

---

## 5. API Endpoints

### 5.1 Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Create student account | No |
| `POST` | `/api/auth/login` | Login → returns JWT | No |
| `GET`  | `/api/auth/profile` | Get current user profile | Yes |

### 5.2 Trees
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET`    | `/api/trees` | List all trees for current student | Yes |
| `POST`   | `/api/trees` | Register a new tree → auto-generates treeId | Yes |
| `GET`    | `/api/trees/stats` | Dashboard stats | Yes |
| `GET`    | `/api/trees/:id` | Get single tree details | Yes |
| `PUT`    | `/api/trees/:id` | Update tree info | Yes |
| `DELETE` | `/api/trees/:id` | Delete tree + all logs | Yes |

### 5.3 Growth Logs
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET`    | `/api/trees/:treeId/logs` | List all growth logs for a tree | Yes |
| `POST`   | `/api/trees/:treeId/logs` | Add growth measurement entry | Yes |
| `GET`    | `/api/trees/:treeId/logs/:logId` | Get single log | Yes |
| `DELETE` | `/api/trees/:treeId/logs/:logId` | Delete log | Yes |
| `GET`    | `/api/trees/:treeId/export` | Export logs as JSON for Excel conversion | Yes |

---

## 6. Frontend Pages — Screen-by-Screen Breakdown

### 6.1 Login Page (`/login`)
- Roll number input + password input
- "Sign In" primary button
- Link to registration
- LAMBO logo + tagline

### 6.2 Register Page (`/register`)
- Fields: Full Name, Roll Number, Password, Confirm Password, Course (optional)
- "Create Account" button + link to login

### 6.3 Dashboard Page (`/` — Home tab)
- Welcome banner: "Good morning, [Name]" + "Register New Tree" CTA
- Stats grid: Total trees, Health %, Total logs
- Health donut chart + legend
- Recent activity feed (last 5 logs)
- **Design Ref:** `DESIGN/lambo_dashboard_army_green/screen.png`

### 6.4 Tree List Page (`/trees` — Trees tab)
- Cards for each tree: photo, ID, species, health chip, stage chip
- Search/filter bar
- **Design Ref:** Activity feed style from dashboard

### 6.5 Register Tree Page (`/register-tree` — Register tab)
- Species selection (preset chips: Mango, Guyabano, Jackfruit, Coconut, Calamansi + search)
- Details: nickname, location, date planted
- Photo upload + initial health assessment
- On save: show tree ID + QR code + download
- **Design Ref:** `DESIGN/lambo_register_tree_army_green/screen.png`

### 6.6 Tree Profile Page (`/trees/:id`)
- Hero photo + tree ID badge + health chip
- Name + species + location + date planted
- Vitals grid: height, diameter, leaves, fruit count
- Latest inspection card
- Photo archive (horizontal scroll)
- "Add Growth Entry" + "Download QR" buttons
- **Design Ref:** `DESIGN/lambo_tree_profile_army_green/screen.png`

### 6.7 Growth Logs Page (`/trees/:id/logs`)
- Summary stats + time filter chips
- Growth chart (height over time)
- Audit history timeline
- "Record Entry" + "Export to Excel" buttons
- **Design Ref:** `DESIGN/lambo_growth_logs_army_green/screen.png`

### 6.8 Scan Page (`/scan` — Scan tab)
- Camera viewfinder with QR code scanning overlay (HUD-style reticle brackets from design boards)
- On successful scan: show tree ID, species, health status, quick actions ("Open Profile", "Log Growth", "Flag Issue")
- Fallback: manual tree ID text input for devices without camera access
- Tabs: "QR Scan" / "Manual Entry"
- **Design Ref:** `DESIGN/lambo_scan_identify_army_green/screen.png`

### 6.9 Campus Map Page (`/map`)
- Interactive Leaflet.js map centered on campus
- Tree markers color-coded by health status (green/amber/red)
- Marker popups: tree ID, species, health chip, "View Profile" link
- Cluster markers when zoomed out (many trees in same area)
- Option to set/update tree GPS coordinates on registration or from tree profile
- **Note:** Students manually place markers (no GPS auto-detect for v1)

### 6.10 QR Code Modal
- Large QR code encoding tree ID
- Tree ID text + download/print buttons
- Instructions for attaching to seedling

---

## 7. TailwindCSS Design Tokens

```javascript
// tailwind.config.js key tokens (from DESIGN.md)
colors: {
  'surface-base':    '#282E16',
  'surface-deep':    '#1D230E',
  'surface-card':    '#30371A',
  'surface-raised':  '#38411F',
  'surface-highest': '#485327',
  'text-primary':    '#F0F3E8',
  'text-secondary':  '#D8DFC8',
  'text-muted':      '#AAB596',
  'text-accent':     '#C2CE9F',
  'accent-primary':  '#A4B566',
  'accent-container':'#8B9B4C',
  'accent-dim':      '#6B7D3B',
  'border-default':  '#525E31',
  'border-accent':   '#5D6A37',
  'border-subtle':   '#454F26',
  'status-healthy':  '#A4B566',
  'status-monitor':  '#D99B26',
  'status-danger':   '#E57373',
}
fontFamily: {
  'display': ['Chivo', 'sans-serif'],
  'body':    ['Chivo', 'sans-serif'],
  'mono':    ['JetBrains Mono', 'monospace'],
}
```

---

## 8. Implementation Phases

### Phase 0: Project Scaffolding [COMPLETED]
- [x] Initialize Vite React app in `client/`
- [x] Initialize Node.js project in `server/`
- [x] Install all dependencies
- [x] Configure TailwindCSS + Vite proxy
- [x] Create `.env.example` files + folder structure

### Phase 1: Backend — Database & Auth [COMPLETED]
- [x] MongoDB connection, Cloudinary config
- [x] User/Tree/GrowthLog models
- [x] Auth middleware (JWT), upload middleware
- [x] Auth controller + routes
- [x] Express server entry point

### Phase 2: Backend — Tree & Growth Log CRUD [COMPLETED]
- [x] Tree controller (CRUD + stats + auto ID generation)
- [x] GrowthLog controller (CRUD + photo upload + export)
- [x] Routes wiring
- [x] API testing (100% verified)

### Phase 3: Frontend — Foundation & Auth (~1-2 hrs)
- [x] Global styles + Axios setup + AuthContext
- [x] Login + Register pages
- [x] React Router with protected routes

### Phase 4: Frontend — Layout & UI Components (~2-3 hrs)
- [x] AppShell, Header, BottomNav (all 5 tabs active: Home, Scan, Trees, Logs, Register)
- [x] All ui/ components (Button, Card, Chip, Input, MetricCard, etc.)

### Phase 5: Frontend — Dashboard (~1-2 hrs)
- [x] WelcomeBanner, StatsGrid, HealthOverview, RecentActivity
- [x] DashboardPage composition + API integration

### Phase 6: Frontend — Tree Registration & QR (~1-2 hrs)
- [x] RegisterTreePage with species presets + form + map pin for location
- [x] QRCodeDisplay component + post-registration success
- [x] forest Zone / Campus Sector can be added by students and saved to mongo db where it is fetched and showed as dropdown options

### Phase 7: Frontend — Tree List & Profile (~2-3 hrs)
- TreeCard, TreeListPage, TreeProfilePage
- StageProgressBar, vitals grid, photo archive

### Phase 8: Frontend — Growth Logs & Charts (~2-3 hrs)
- GrowthEntryForm, GrowthChart, GrowthTimeline
- GrowthLogsPage, Export to Excel

### Phase 9: Frontend — QR Scanning (~1-2 hrs)
- ScanPage with html5-qrcode camera integration
- QRScannerView component with HUD-style reticle overlay
- Scan result panel: tree info + quick actions (Open Profile, Log Growth)
- Manual tree ID fallback input
- **Design Ref:** `DESIGN/lambo_scan_identify_army_green/screen.png`

### Phase 10: Frontend — Campus Map (~1-2 hrs)
- Install & configure Leaflet.js + react-leaflet
- CampusMap component with tree markers (color-coded by health)
- CampusMapPage with marker popups (tree ID, species, link to profile)
- Marker clustering for dense areas (react-leaflet-cluster)
- Map pin placement on RegisterTreePage (GPS coordinates for the plant on map)

### Phase 11: Push Notifications & Reminders (~2-3 hrs)
- Backend: Reminder model (tree, reminderType, frequency, nextDue)
- Backend: reminderController + reminderRoutes (CRUD + trigger endpoint)
- Backend: web-push integration (VAPID keys, push subscription storage on User model)
- Frontend: Service worker push event handler
- Frontend: Notification permission request on first login
- Frontend: Reminder settings per tree (water every X days, fertilize every Y days)
- Push payload: tree name, reminder type, quick link to log growth

### Phase 12: Offline Mode & PWA (~2-3 hrs)
- Install vite-plugin-pwa, configure Workbox service worker
- Cache static assets (app shell, fonts, icons) for offline load
- IndexedDB offline queue: store growth log entries created offline
- Background sync: push queued entries to server when connection restores
- Offline indicator in Header (swap "Online" badge → "Offline" badge)
- PWA manifest: app name, icons, theme color, installable on home screen

### Phase 13: Polish & Integration (~1-2 hrs)
- Protected routes, loading states, error handling
- Empty states, responsive testing, form validation
- 404 page, favicon, meta tags
- Test offline → online sync flow
- Test push notification delivery
- Test QR scan → tree profile flow

---

## 9. V1.0 Scope

### ✅ In v1.0
- Student registration & login (roll number + password)
- Register trees with auto-generated ID + QR code (downloadable)
- Log growth entries (height required; all else optional)
- Dashboard with stats, health donut, recent activity
- Tree list + tree profile + growth logs pages
- Growth charts (height over time)
- Export to Excel
- **QR code scanning** with camera (identify trees by scanning QR labels)
- **Push notifications & reminders** (watering, fertilizing schedules)
- **Campus map** (Leaflet.js, tree markers color-coded by health)
- **Offline mode** (PWA with service worker, background sync)
- Bottom navigation with all 5 tabs (Home, Scan, Trees, Logs, Register)
- Tactical army-green design from design boards

### 🔜 Deferred to v2.0+
- Teacher/admin roles
- Gamification & badges
- Species-specific care guides
- Survival tracker statistics
- Peer sharing & collaboration
- AR/LiDAR features

---

## 10. Environment Variables

### Server `.env`
```bash
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/lambo
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:your_email@example.com
PORT=5000
NODE_ENV=development
```

### Client `.env`
```bash
VITE_API_URL=http://localhost:5000/api
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
```

---

## 11. Verification Plan

### Build Verification
```bash
cd server && npm start       # Verify DB connection
cd client && npm run dev     # Verify dev server
cd client && npm run build   # Verify production build
```

### Manual Checklist
- [ ] Student can register and login
- [ ] Protected routes redirect when unauthenticated
- [ ] Tree registration generates ID + QR code
- [ ] QR code is downloadable as PNG
- [ ] Growth log entry with photo uploads successfully
- [ ] Dashboard shows correct stats
- [ ] Tree list displays all trees
- [ ] Tree profile shows vitals + photos
- [ ] Growth chart renders correctly
- [ ] Excel export downloads valid .xlsx
- [ ] **QR scanning:** Camera opens, scans QR, navigates to correct tree profile
- [ ] **Campus map:** Map renders, markers appear at correct positions, popups work
- [ ] **Push notifications:** Permission prompt appears, reminder push is received
- [ ] **Offline mode:** App loads without network, queued entries sync when back online
- [ ] **PWA install:** App is installable on mobile home screen
- [ ] Mobile viewport looks correct (375px)
- [ ] Design matches tactical army-green aesthetic
