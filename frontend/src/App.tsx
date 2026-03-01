import { Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthLayout } from "./components/AuthLayout";
import { AppLayout } from "./components/AppLayout";
import { EntryRoute } from "./components/EntryRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ToastContainer } from "./components/ToastContainer";

import LoginPage          from "./pages/auth/LoginPage";
import RegisterPage       from "./pages/auth/RegisterPage";
import DashboardPage      from "./pages/DashboardPage";
import SemestersPage      from "./pages/SemestersPage";
import SemesterDetailPage from "./pages/SemesterDetailPage";
import CoursesPage        from "./pages/CoursesPage";
import CourseDetailPage   from "./pages/CourseDetailPage";
import AssignmentsPage    from "./pages/AssignmentsPage";
import AssignmentDetailPage from "./pages/AssignmentDetailPage";
import NotesPage          from "./pages/NotesPage";
import NoteEditorPage     from "./pages/NoteEditorPage";
import TasksPage          from "./pages/TasksPage";
import CalendarPage       from "./pages/CalendarPage";
import SettingsPage       from "./pages/SettingsPage";
import NotFoundPage       from "./pages/NotFoundPage";

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* ── Auth routes ─────────────────────────────────────────── */}
        <Route element={<AuthLayout />}>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* ── Root: landing (logged out) or redirect to dashboard (logged in) ─ */}
        <Route path="/" element={<EntryRoute />} />

        {/* ── Protected app routes ────────────────────────────────── */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard"         element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
          <Route path="/semesters"         element={<SemestersPage />} />
          <Route path="/semesters/:id"     element={<SemesterDetailPage />} />
          <Route path="/courses"           element={<CoursesPage />} />
          <Route path="/courses/:id"       element={<CourseDetailPage />} />
          <Route path="/assignments"       element={<AssignmentsPage />} />
          <Route path="/assignments/:id"    element={<AssignmentDetailPage />} />
          <Route path="/notes"             element={<NotesPage />} />
          <Route path="/tasks"             element={<TasksPage />} />
          <Route path="/calendar"           element={<ErrorBoundary><CalendarPage /></ErrorBoundary>} />
          <Route path="/settings"           element={<SettingsPage />} />
        </Route>

        {/* ── Note editor — full-page, no AppLayout sidebar ───────── */}
        <Route path="/notes/:id" element={<ProtectedRoute><ErrorBoundary><NoteEditorPage /></ErrorBoundary></ProtectedRoute>} />

        {/* ── 404 ─────────────────────────────────────────────────── */}
        <Route path="/not-found" element={<NotFoundPage />} />

        {/* ── Catch-all → 404 ─────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>

      <ToastContainer />
    </ErrorBoundary>
  );
}
