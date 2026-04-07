# MediRemind - Patient Adherence Tracker

A full-stack MERN application for tracking medication adherence. Patients log medications, set reminder schedules, and doctors view adherence summaries through a secure role-based interface.

## Tech Stack

- **Frontend:** React 18, React Router, Axios
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Auth:** JWT with bcrypt password hashing
- **Notifications:** Browser Notification API

## Project Structure

```
├── server/                  # Express backend
│   ├── models/
│   │   ├── User.js          # Patient & Doctor accounts
│   │   ├── Medication.js    # Medication definitions
│   │   └── AdherenceLog.js  # Dose logging records
│   ├── routes/
│   │   ├── auth.js          # Register, Login, Profile
│   │   ├── medications.js   # CRUD for medications
│   │   └── adherence.js     # Dose logging, summaries, doctor reports
│   ├── middleware/
│   │   └── auth.js          # JWT protection & role authorization
│   ├── server.js            # Express app entry point
│   └── .env                 # Environment variables
├── client/                  # React frontend
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── Navbar.js         # Navigation with role-based links
│       │   ├── MedicationCard.js # Dose card with status actions
│       │   ├── StreakTracker.js  # Consecutive-day streak display
│       │   └── WeeklySummary.js  # Adherence ring chart & bar graph
│       ├── pages/
│       │   ├── Login.js
│       │   ├── Register.js
│       │   ├── PatientDashboard.js  # Daily checklist + sidebar
│       │   ├── CalendarView.js      # Monthly calendar with dose data
│       │   ├── MedicationManager.js # Add/edit/remove medications
│       │   └── DoctorDashboard.js   # Patient list + adherence reports
│       ├── context/
│       │   └── AuthContext.js    # Auth state provider
│       ├── services/
│       │   └── api.js           # Axios API client with interceptors
│       ├── utils/
│       │   └── notifications.js # Browser notification scheduler
│       ├── App.js
│       ├── App.css
│       └── index.js
```

## Setup & Run

### Prerequisites

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)

### 1. Backend

```bash
cd server
npm install
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

Server starts on `http://localhost:5000`

### 2. Frontend

```bash
cd client
npm install
npm start
```

React app starts on `http://localhost:3000` (proxied to backend)

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user (patient/doctor) |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Get current user profile |

### Medications (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/medications` | List active medications |
| POST | `/api/medications` | Add new medication |
| PUT | `/api/medications/:id` | Update medication |
| DELETE | `/api/medications/:id` | Deactivate medication |

### Adherence (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/adherence/log` | Log a dose (taken/missed/skipped) |
| GET | `/api/adherence/today` | Get today's schedule |
| GET | `/api/adherence/weekly` | Weekly adherence summary |
| GET | `/api/adherence/streak` | Current adherence streak |
| GET | `/api/adherence/calendar` | Monthly calendar data |

### Doctor (Doctor Role Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/adherence/doctor/patients` | List assigned patients with stats |
| GET | `/api/adherence/doctor/report/:id` | Detailed patient adherence report |

## Features

- **Daily Medication Checklist** — Mark doses as taken, skipped, or missed
- **Calendar View** — Monthly overview with color-coded adherence
- **Streak Tracker** — Motivational consecutive-day counter
- **Browser Notifications** — Timed reminders for scheduled doses
- **Doctor Dashboard** — Aggregated adherence reports per patient
- **Role-Based Access** — Patients see own data, doctors see assigned patients
- **Mobile-First UI** — Responsive design optimized for small screens
- **Secure API** — JWT auth, rate limiting, input validation

# to run server
# cd server
# npm run dev

# to run client
# cd client
# npm start