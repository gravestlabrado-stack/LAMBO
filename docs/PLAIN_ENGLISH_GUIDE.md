# 🌱 How LAMBO Works: The Architecture Explained in Plain English

> **For**: Students, Teachers, Academic Evaluators, and Non-Technical Stakeholders  
> **System**: LAMBO (*Landscape Analytics for Monitoring Botanical Observation*)  
> **Goal**: Explain how every piece of the software works together — from the smartphone in a student's hand out in the campus forest to the cloud servers and databases.

---

## 🧭 Table of Contents
1. [The Big Picture: The Restaurant Analogy](#1-the-big-picture-the-restaurant-analogy)
2. [Pillar 1: What the Student Sees & Touches (The Frontend & Phone App)](#2-pillar-1-what-the-student-sees--touches-the-frontend--phone-app)
3. [Pillar 2: The Traffic Controller & Brain (The Backend Server)](#3-pillar-2-the-traffic-controller--brain-the-backend-server)
4. [Pillar 3: The 15-Minute Automated Watchman (Care Reminders)](#4-pillar-3-the-15-minute-automated-watchman-care-reminders)
5. [Pillar 4: The Digital Filing Vault (MongoDB Database)](#5-pillar-4-the-digital-filing-vault-mongodb-database)
6. [Pillar 5: The Cloud Helpers (Photos, Maps, and Notifications)](#6-pillar-5-the-cloud-helpers-photos-maps-and-notifications)
7. [Step-by-Step Real Life Journeys](#7-step-by-step-real-life-journeys)
8. [Security & Privacy in Everyday Terms](#8-security--privacy-in-everyday-terms)
9. [Glossary of Terms](#9-glossary-of-terms)

---

## 1. The Big Picture: The Restaurant Analogy

If you look at all the technical code files of LAMBO, it might look like a maze. But at a conceptual level, it functions just like a **busy, well-organized restaurant**:

```
[ Dining Room ]                 [ The Waiter / Kitchen ]             [ Pantry & Vaults ]
Student on Phone -------------> Backend Server (Express) ----------> Database & Cloud
(Enters tree measurements)      (Checks ID, validates numbers)       (Saves logs & photos)
       ^                                    |                                    |
       |                                    v                                    |
       +------------------- 15-Minute Watchman (Scheduler) <--------------------+
                       (Alerts student when care is due)
```

1. **The Dining Room (The Frontend App)**: This is what you see on your phone or laptop screen. It has beautiful green tactical buttons, charts, maps, and camera scanners. You enter tree heights, tap buttons, or take photos.
2. **The Waiter & Kitchen (The Backend Server)**: When you hit "Save", your phone doesn't directly touch the database. Instead, it sends an order to the waiter (the server). The server checks: *"Is this student registered? Is this tree really theirs? Is the height a valid number?"* If everything checks out, it prepares the data.
3. **The Pantry & Safe (The Database & Cloud)**: Once approved, information is neatly filed away in digital cabinets (MongoDB) and photos are sent to a high-security photo vault (Cloudinary).
4. **The Reminder Clock (The Background Watchman)**: Every 15 minutes, an automated internal clock rings. The system checks its calendar: *"Is it time to water Tree LMB-0004?"* If yes, it taps the student on the shoulder with a phone notification.

---

## 2. Pillar 1: What the Student Sees & Touches (The Frontend & Phone App)

The student experience is designed to feel like rugged field equipment, built with an army-green tactical HUD aesthetic.

### 📱 A "Website" that Acts Like a Mobile App (PWA)
LAMBO is a **Progressive Web App (PWA)**. 
- You do **not** have to download it from Google Play or the Apple App Store.
- You open the website link on your phone browser (Chrome or Safari), tap **"Add to Home Screen"**, and it installs an app icon directly on your phone.
- It can open full-screen without address bars, access your camera, and send lock-screen push notifications.

### 🎒 The "Offline Backpack" (What Happens When There’s No Signal?)
In a campus forestry program, students frequently walk into remote campus plots or hills where cell reception drops to zero. In ordinary apps, the screen freezes or says *"No Internet Connection"*.

LAMBO solves this with an **Offline Backpack** (technically called *IndexedDB* and *Service Workers*):
1. **Taking it offline**: If you log a tree's height, leaf count, and photo while completely offline, LAMBO does not crash. It packs the observation and photo safely into your phone's internal storage memory.
2. **The Waiting Queue**: The app displays an amber badge: *"1 offline observation queued"*.
3. **Automatic Sync**: The moment you walk back toward the library or campus Wi-Fi, the app senses the connection and automatically uploads all saved logs to the main server without you lifting a finger.

### 🛠️ Built-In Hardware Tools:
- **Instant Camera QR Scanner**: Point your phone camera at the physical laminated tag on a seedling; the app decodes the tree ID (`LMB-0001`) and instantly pulls up that tree’s profile, health history, and growth graphs.
- **GPS Field Locator**: Reads your phone’s satellite positioning chip to pinpoint the exact tree coordinates and displays a pulsating blue beacon on the interactive campus map.
- **Instant Excel Exporter**: With one click, your semester-long observation data is compiled into an official `.xlsx` spreadsheet ready to print or submit for research thesis defense.

---

## 3. Pillar 2: The Traffic Controller & Brain (The Backend Server)

The backend server is the central brain of LAMBO. It runs continuously in the cloud, listening for requests from students' devices.

### 🛡️ The Security Guard (Authentication & Tokens)
When you log in with your Student Roll Number and password:
- The server checks your password against a scrambled, mathematically encrypted copy (it never stores plain passwords).
- If correct, it hands your phone a **Digital VIP Pass** (called a *JSON Web Token* or *JWT*).
- For the next 7 days, every time your phone asks for data, it flashes this digital pass. The server instantly knows who you are and ensures you can only view and edit your own assigned trees.

### 🏢 The 5 Departments (Controllers)
Inside the brain, work is split among five specialized desks:

| Department Desk | Everyday Job | Example Action |
|---|---|---|
| **1. Student Desk** (`authController`) | Handles student registrations, profile updates, and logins. | *"Create account for Roll #2024-0012."* |
| **2. Specimen Registry** (`treeController`) | Issues official serial tags (`LMB-0001`, `LMB-0002`), saves baseline species, and calculates campus health stats. | *"Assign next ID to Calamansi seedling in Sector B."* |
| **3. Growth Diary Desk** (`growthLogController`) | Records each new height measurement, stem width, leaf count, and stage change. Checks that only the tree owner (or supervisor) can edit. | *"Add 12.5 cm height log for LMB-0003."* |
| **4. Care Schedule Desk** (`reminderController`) | Manages reminders for watering, organic fertilizer, and pruning. Handles recurring frequencies (daily, weekly, monthly). | *"Remind student to water Narra seedling every Monday at 8 AM."* |
| **5. Campus Sectors** (`zoneController`) | Keeps track of official campus zones (e.g., Agricultural Field, North Nursery, Forestry Slope). | *"List all seedlings planted in Sector 3."* |

---

## 4. Pillar 3: The 15-Minute Automated Watchman (Care Reminders)

One of the most powerful features of LAMBO is that **trees don't get forgotten**.

```
[ Every 15 Minutes ]
        │
        ▼
Checks MongoDB: "Are any watering or fertilizer tasks due right now?"
        │
    ┌───┴──────────────────────────────┐
    │                                  │
[ No Tasks Due ]              [ Yes! LMB-0002 is Due ]
    │                                  │
    ▼                                  ▼
Goes back to sleep            Finds student's phone push address
                                       │
                                       ▼
                              Dispatches Web Push Alert:
                              "🌿 Care Alert: Calamansi (LMB-0002) 
                               is due for watering today!"
                                       │
                                       ▼
                              Slides reminder to next week (if recurring)
```

1. **The Recurring Clock**: Inside the server, an automated timer triggers every 15 minutes, 24 hours a day.
2. **The Due-Date Scan**: It scans the database looking for care tasks where the scheduled date has arrived.
3. **The Push Messenger**: It bundles a message and sends it across the Web Push network.
4. **The Screen Alert**: Even if the student has closed the browser, the phone vibrates and displays:  
   > *“🌿 Care Reminder: Guyabano (LMB-0005) is due for watering. Tap to view specimen.”*
5. **Self-Cleaning System**: If a student changes phones or deletes their browser profile, the server detects that the old address is dead and automatically tidies up the list so it stays lightning-fast.

---

## 5. Pillar 4: The Digital Filing Vault (MongoDB Database)

All permanent records are stored in a cloud database called **MongoDB Atlas**. Think of it as a set of five organized digital filing drawers:

```
┌────────────────────────────────────────────────────────┐
│                      STUDENT CARD                      │
│ • Name: Maria Santos                                   │
│ • Roll Number: 2024-0891                               │
│ • Registered Phone Push Addresses                      │
└──────────────────────────┬─────────────────────────────┘
                           │ Owns (1-to-Many)
                           ▼
┌────────────────────────────────────────────────────────┐
│                   TREE SPECIMEN CARD                   │
│ • Tree ID: LMB-0004                                    │
│ • Species: Guyabano (Annona muricata)                  │
│ • Nickname: "Green Hope"                               │
│ • GPS: 10.1452° N, 123.5931° E                         │
│ • Health Status: Healthy                               │
│ • Current Stage: Vegetative                            │
└──────────────┬──────────────────────────┬──────────────┘
               │ Has (1-to-Many)          │ Has (1-to-Many)
               ▼                          ▼
┌──────────────────────────────┐ ┌───────────────────────┐
│     GROWTH OBSERVATIONS      │ │     CARE SCHEDULE     │
│ • Oct 1: 15 cm, 6 leaves     │ │ • Water: Every Monday │
│ • Oct 15: 18.2 cm, 8 leaves  │ │ • Fertilizer: Nov 1st │
│ • Nov 1: 22.4 cm, 12 leaves  │ │ • Status: Active      │
└──────────────────────────────┘ └───────────────────────┘
```

1. **Students (`User`)**: Holds the student’s identity, roll number, course, and device notification addresses.
2. **Trees (`Tree`)**: The master record for each seedling. Contains its official tag (`LMB-0001`), GPS coordinates, species name, nickname, current health, and baseline photos.
3. **Growth Logs (`GrowthLog`)**: A chronological diary of measurements. Every single time a student visits the tree, a new card is added recording height, stem diameter, leaf count, health, and a dated photo.
4. **Reminders (`Reminder`)**: Schedules tasks (watering, fertilizing) linked to a specific tree and student.
5. **Campus Sectors (`Zone`)**: Holds named areas of the campus so trees can be grouped by physical location (e.g. *“West Orchard Plot”*).

---

## 6. Pillar 5: The Cloud Helpers (Photos, Maps, and Notifications)

LAMBO relies on specialized external cloud partners for heavy lifting:

### 📸 Cloudinary (The Photo Vault)
- **Problem**: Storing high-resolution smartphone photos directly inside a database makes the system slow, bloated, and expensive.
- **Solution**: Whenever you photograph a seedling, the image is streamed directly to Cloudinary (a world-class image cloud). Cloudinary automatically compresses the image so it loads quickly on mobile data, creates thumbnails, and hands back a secure web address to store in the student's log.

### 🗺️ OpenStreetMap & CartoDB (The Campus Cartographers)
- When you open the **Campus Map**, the screen requests map tiles (satellite and terrain imagery) from OpenStreetMap/CartoDB.
- LAMBO places tactical markers on top of the map:
  - 🟢 **Green Pin**: Tree is Healthy.
  - 🟡 **Amber Pin**: Tree is Under Monitoring.
  - 🔴 **Red Pin**: Tree Needs Attention.
  - 🔵 **Blue Beacon**: Where you are standing right now.

### 🔔 Browser Push Networks (Apple, Google, Mozilla)
- Sends notifications through the phone's native alert channels (Google Firebase Cloud Messaging for Android/Chrome, Apple Push for iOS Safari), ensuring alerts arrive even when your phone is in your pocket.

---

## 7. Step-by-Step Real Life Journeys

To understand how all these gears turn together, here are two everyday scenarios:

### Journey A: Registering a Seedling in the Field
1. **Student Actions**: In the nursery, the student clicks **"Register Wildling"**, selects "Mango", types a nickname ("Sunny"), snaps a photo, and taps **"Capture Current GPS"**.
2. **Frontend Processing**: The phone’s GPS chip locks onto satellites and fills in the latitude and longitude.
3. **Transmission**: The form and photo travel to the Express Backend.
4. **Server Magic**:
   - The server calls the ID generator, calculating that the next available number is `LMB-0012`.
   - The photo is uploaded to Cloudinary.
   - The tree document is saved in MongoDB.
   - A baseline "Day 0" growth observation log is automatically created.
5. **Result**: The student's screen displays a printable, high-resolution QR code badge containing `LMB-0012`. They can download, print, laminate, and attach it to the seedling stake.

---

### Journey B: Logging Height in the Jungle (Offline Sync)
1. **The Situation**: The student is out in the hillside reforestation plot. Their phone has **Zero Bars (No Internet)**.
2. **Observation**: The student taps `+ Log Growth`, measures the seedling at **34.5 cm**, notes **14 leaves**, takes a photo, and taps **Submit**.
3. **Local Safe-Keeping**: Because there is no connection, LAMBO stores the observation and photo safely in the browser's **IndexedDB storage vault**. A message appears: *"Saved to Offline Queue (1 pending)"*.
4. **Restoring Connection**: The student walks back to the campus canteen. The phone detects Wi-Fi.
5. **Auto-Synchronization**: Without any prompts, the app automatically empties the queue, uploads the photo to Cloudinary, sends the numbers to MongoDB, updates the tree’s latest height chart, and turns the offline badge green.

---

## 8. Security & Privacy in Everyday Terms

| Feature | How It Works in Simple Terms |
|---|---|
| **Password Protection** | Passwords are never stored as plain text. They are converted into a 60-character scrambled code (using bcrypt) that cannot be reverse-engineered. |
| **Tamper-Proof Passports (JWT)** | When you log in, your phone receives a digitally signed token. If anyone tries to alter their user ID, the signature breaks and the server rejects the request. |
| **Privacy Between Students** | Students can see all trees on the campus map for collaborative research, but they can **only** edit logs and care schedules for seedlings assigned to them. |
| **Supervisor Override** | The system includes an authorized faculty/supervisor roll number (`9260572`) allowing designated campus instructors to inspect, verify, or correct logs across any tree. |

---

## 9. Glossary of Terms

- **PWA (Progressive Web App)**: A modern website that behaves just like a phone app (works offline, has an icon on your home screen, and sends push notifications).
- **Frontend**: The visual part of the app you touch and interact with on your device.
- **Backend (API)**: The cloud server that receives orders, enforces rules, and talks to the database.
- **Database (MongoDB)**: The permanent digital storage where all tree records, students, and logs are kept safely.
- **IndexedDB**: A private storage locker inside your phone’s browser where offline measurements wait until you get internet back.
- **Service Worker**: An invisible helper script running inside your browser that handles caching and catches incoming push alerts.
- **Cloudinary**: A cloud image storage service that stores and optimizes photos taken during tree monitoring.
- **Web Push (VAPID)**: The secure technology that allows websites to send notifications to your phone's notification tray.
