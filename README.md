# Student Dashboard

A comprehensive student management dashboard built with React, featuring course management, calendar events, timetable, GPA calculator, file management, and a personal mind space for notes and todos.

## Features

- **Courses Management**: Add and manage courses with details like course code, venue, faculty, and class number
- **Calendar**: Track assignments, exams, lectures, and other events linked to courses
- **Mind Space**: Personal space for todos, notes, and files to review later
- **Timetable**: Weekly schedule with periods linked to courses
- **GPA Calculator**: Calculate and track GPA and CGPA with grade management
- **File Management**: Upload and organize files by course

## Technology Stack

- React 18
- React Router DOM
- Vite
- Lucide React (Icons)
- Backend API (data stored in PostgreSQL; use Vite proxy in dev so auth cookie is sent)

## Getting Started

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/
│   ├── Layout.jsx          # Main layout with sidebar navigation
│   └── Layout.css
├── context/
│   └── DataContext.jsx      # Global state management
├── pages/
│   ├── Courses.jsx          # Courses management page
│   ├── Calendar.jsx         # Calendar events page
│   ├── MindSpace.jsx        # Todo/notes page
│   ├── Timetable.jsx        # Weekly timetable
│   ├── GPA.jsx              # GPA calculator
│   └── Files.jsx            # File management
├── App.jsx                   # Main app component with routing
├── main.jsx                  # Entry point
└── index.css                 # Global styles
```

## Features in Detail

### Linking System
All entities in the dashboard are interconnected:
- Calendar events can be linked to courses
- Timetable periods are linked to courses
- Files can be linked to courses
- Grades are linked to courses
- Everything is managed through a centralized data context

### Data Persistence
All user data (courses, semesters, calendar, files, grades, etc.) is saved to the backend and persists across reloads.

**Local development (important):**
1. In the **backend** folder: copy `.env.example` to `.env`, set `DATABASE_URL` and `JWT_SECRET`, then run `npm run db:init` and `npm run dev`.
2. In the **project root**: run `npm run dev` for the frontend.
3. **Do not set `VITE_API_URL`** in the project root. The Vite dev server proxies `/api` to the backend so requests stay same-origin; that way the auth cookie is sent and your data loads/saves correctly. If you set `VITE_API_URL=http://localhost:4000`, the cookie won’t be sent to the API and data will appear to disappear after reload.
4. Log in (e.g. demo@university.edu / demo123). Your data is stored per user in PostgreSQL.

### Dark Theme
The application features a modern dark theme with colorful solid accent colors (no gradients) for a clean, professional look.

## Usage

1. **Add Courses**: Start by adding your courses in the Courses page
2. **Set Up Timetable**: Link courses to specific time periods in your weekly timetable
3. **Track Events**: Add calendar events and link them to relevant courses
4. **Manage Files**: Upload files and organize them by course
5. **Calculate GPA**: Add grades for your courses to track your academic progress
6. **Use Mind Space**: Keep track of todos, notes, and files you want to review later
