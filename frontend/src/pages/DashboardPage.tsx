import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import {
  Plus, ArrowRight, BookOpen, ClipboardList, FileText,
  CalendarDays, CheckSquare, Clock, Layers,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { Modal } from "../components/ui/Modal";
import { SkeletonCard } from "../components/ui/Skeleton";
import { AssignmentForm } from "../components/assignments/AssignmentForm";
import { TaskForm } from "../components/tasks/TaskForm";
import { useSemesters } from "../hooks/api/semesters";
import { useCourses, courseKeys, type CourseGpa } from "../hooks/api/courses";
import { useAssignments, useCreateAssignment, deriveStatus } from "../hooks/api/assignments";
import { useTasks, useCreateTask } from "../hooks/api/tasks";
import { useNotes } from "../hooks/api/notes";
import { useEvents } from "../hooks/api/events";
import { api } from "../lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good night";
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isToday(d: Date) {
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function getCalendarCells(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const start = new Date(first); start.setDate(start.getDate() - start.getDay());
  const end   = new Date(last);  end.setDate(end.getDate() + (6 - end.getDay()));
  const days: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
  return days;
}

function relDue(iso: string): { label: string; cls: string } {
  const d     = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff  = Math.round((new Date(d).setHours(0, 0, 0, 0) - today.getTime()) / 86400000);
  if (diff < 0)   return { label: `${Math.abs(diff)}d overdue`, cls: "text-red-500 bg-red-50 border-red-100" };
  if (diff === 0) return { label: "Today",                       cls: "text-orange-500 bg-orange-50 border-orange-100" };
  if (diff === 1) return { label: "Tomorrow",                    cls: "text-amber-500 bg-amber-50 border-amber-100" };
  if (diff <= 7)  return { label: `${diff}d left`,               cls: "text-[#10b981] bg-[#f0fdf4] border-[#bbf7d0]" };
  return { label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), cls: "text-[#9ca3af] bg-[#f5f5f5] border-[#e5e7eb]" };
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  icon, label: _label, value, sub, loading, to,
}: {
  icon: React.ReactNode; label: string; value: string | null; sub: string; loading?: boolean; to?: string;
}) {
  const inner = (
    <div className="bg-white border border-[#e5e7eb] rounded-card px-5 py-5 h-full transition-all duration-150 hover:border-[#d1d5db]"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] border border-[#e5e7eb] flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        {to && <ArrowRight size={14} className="text-[#d1d5db] group-hover:text-[#9ca3af] transition-colors" />}
      </div>
      {loading ? (
        <>
          <SkeletonCard height={28} width={64} className="mb-1.5" />
          <SkeletonCard height={14} width={96} />
        </>
      ) : (
        <>
          <p className="text-2xl font-bold text-[#111] leading-none mb-1">{value ?? "—"}</p>
          <p className="text-xs text-[#9ca3af]">{sub}</p>
        </>
      )}
    </div>
  );
  if (to) return <Link to={to} className="group block">{inner}</Link>;
  return <div>{inner}</div>;
}

const MINI_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Mini calendar ────────────────────────────────────────────────────────────
function MiniCalendar({ activeDays }: { activeDays: Set<string> }) {
  const navigate = useNavigate();
  const today = new Date();
  const cells = getCalendarCells(today.getFullYear(), today.getMonth());
  const rowCount = Math.ceil(cells.length / 7);

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 shrink-0 mb-2">
        {MINI_WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-semibold uppercase tracking-wider py-1"
            style={{ color: "#6b7280" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div
        className="grid grid-cols-7 flex-1 min-h-0 gap-0.5"
        style={{ gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))` }}
      >
        {cells.map(cell => {
          const key     = dateKey(cell);
          const inMonth = cell.getMonth() === today.getMonth();
          const tod     = isToday(cell);
          const hasItems = activeDays.has(key);
          return (
            <button
              key={key}
              onClick={() => navigate("/calendar")}
              title={key}
              className={`flex flex-col items-center justify-center min-w-0 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-1 ${
                !inMonth ? "opacity-40" : "hover:ring-1 hover:ring-white/50"
              }`}
            >
              <span
                className="flex items-center justify-center rounded-full leading-none text-xs tabular-nums"
                style={
                  tod
                    ? {
                        width: 24,
                        height: 24,
                        background: "#fff",
                        color: "#111",
                        fontWeight: 600,
                      }
                    : inMonth
                      ? { width: 24, height: 24, color: "#374151", fontWeight: 500 }
                      : { width: 24, height: 24, color: "#9ca3af", fontWeight: 400 }
                }
              >
                {cell.getDate()}
              </span>
              {hasItems && (
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5"
                  style={{ background: "#6b7280" }}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  title, icon, action, children, fillBody,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  fillBody?: boolean;
}) {
  return (
    <div className="flex flex-col min-h-0 bg-white border border-[#e5e7eb] rounded-card overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0] shrink-0">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-[#111]">{title}</span>
        </div>
        {action}
      </div>
      {fillBody ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: semesters,   isLoading: loadingS }  = useSemesters();
  const { data: allCourses,  isLoading: loadingC }  = useCourses();
  const { data: assignments, isLoading: loadingA }  = useAssignments();
  const { data: tasks,       isLoading: loadingT }  = useTasks();
  const { data: notes,       isLoading: loadingN }  = useNotes();

  const today = new Date();
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const monthEnd   = dateKey(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  const { data: events = [] } = useEvents(monthStart, monthEnd);

  // ── Current semester ───────────────────────────────────────────────────────
  const currentSemester = useMemo(() => {
    if (!semesters?.length) return null;
    const active = semesters.find(s => {
      const start = s.startDate ? new Date(s.startDate) : null;
      const end   = s.endDate   ? new Date(s.endDate)   : null;
      return start && end && today >= start && today <= end;
    });
    return active ?? [...semesters].sort((a, b) => b.year - a.year)[0];
  }, [semesters]);

  const semesterCourses = useMemo(
    () => allCourses?.filter(c => c.semesterId === currentSemester?.id) ?? [],
    [allCourses, currentSemester]
  );

  // ── GPA via useQueries (fetches GPA for each course in current semester) ───
  const gpaResults = useQueries({
    queries: semesterCourses.map(c => ({
      queryKey: courseKeys.gpa(c.id),
      queryFn: async () => {
        const { data } = await api.get<{ data: CourseGpa }>(`/courses/${c.id}/gpa`);
        return data.data;
      },
      enabled: !!c.id,
    })),
  });

  const overallGpa = useMemo(() => {
    const valid = gpaResults
      .map((q, i) => ({ gpa: q.data?.gpa, credits: semesterCourses[i]?.credits }))
      .filter((e): e is { gpa: number; credits: number } => e.gpa != null && e.credits != null);
    if (!valid.length) return null;
    const totalCredits  = valid.reduce((s, e) => s + e.credits, 0);
    const weightedSum   = valid.reduce((s, e) => s + e.gpa * e.credits, 0);
    return totalCredits > 0 ? weightedSum / totalCredits : null;
  }, [gpaResults, semesterCourses]);

  const gpaLoading = gpaResults.some(q => q.isLoading) || loadingC || loadingS;

  // ── Derived stats ──────────────────────────────────────────────────────────
  const now = Date.now();

  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay()); weekStart.setHours(0,0,0,0);
  const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23,59,59,999);

  const tasksThisWeek = useMemo(() =>
    tasks?.filter(t => t.dueDate && new Date(t.dueDate) >= weekStart && new Date(t.dueDate) <= weekEnd) ?? [],
    [tasks]
  );
  const completedThisWeek = tasksThisWeek.filter(t => t.isCompleted).length;

  const dueSoonCount = useMemo(() => {
    const cutoff = new Date(now + 7 * 86400000);
    const a = assignments?.filter(a => !a.isSubmitted && a.dueDate && new Date(a.dueDate) >= today && new Date(a.dueDate) <= cutoff).length ?? 0;
    const t = tasks?.filter(t => !t.isCompleted && t.dueDate && new Date(t.dueDate) >= today && new Date(t.dueDate) <= cutoff).length ?? 0;
    return a + t;
  }, [assignments, tasks, now]);

  // ── Upcoming deadlines list (next 14 days) ─────────────────────────────────
  const upcomingDeadlines = useMemo(() => {
    const cutoff = new Date(now + 14 * 86400000);
    const items: {
      id: string; title: string; type: "assignment" | "task";
      dueDate: string; courseCode?: string; link: string;
    }[] = [];

    assignments?.forEach(a => {
      if (!a.dueDate) return;
      const due = new Date(a.dueDate);
      if (due < today || due > cutoff) return;
      if (deriveStatus(a) === "submitted") return;
      items.push({ id: a.id, title: a.title, type: "assignment", dueDate: a.dueDate, courseCode: a.course?.code, link: `/assignments/${a.id}` });
    });

    tasks?.forEach(t => {
      if (!t.dueDate || t.isCompleted) return;
      const due = new Date(t.dueDate);
      if (due < today || due > cutoff) return;
      items.push({ id: t.id, title: t.title, type: "task", dueDate: t.dueDate, courseCode: t.course?.code, link: `/tasks` });
    });

    return items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 7);
  }, [assignments, tasks, now]);

  // ── Recent notes (last 4 by updatedAt) ────────────────────────────────────
  const recentNotes = useMemo(() =>
    [...(notes ?? [])].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4),
    [notes]
  );

  // ── Mini calendar active days ──────────────────────────────────────────────
  const activeDays = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => { const d = e?.startDate?.slice?.(0, 10); if (d) set.add(d); });
    assignments?.forEach(a => { if (a?.dueDate) set.add(a.dueDate.slice(0, 10)); });
    tasks?.forEach(t => { if (t?.dueDate && !t.isCompleted) set.add(t.dueDate.slice(0, 10)); });
    return set;
  }, [events, assignments, tasks]);

  // ── Quick action modal state ───────────────────────────────────────────────
  const [showNewAssignment, setShowNewAssignment] = useState(false);
  const [showNewTask,       setShowNewTask]       = useState(false);

  const createAssignment = useCreateAssignment();
  const createTask       = useCreateTask();

  const loadingAll = loadingS || loadingC || loadingA || loadingT;

  return (
    <div className="p-6 sm:p-8 w-full space-y-6">
      {/* ── Greeting ──────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-[#111] tracking-tight">
          {getGreeting()}, {firstName}
        </h2>
        <p className="mt-1 text-sm text-[#9ca3af]">
          {currentSemester
            ? `${currentSemester.name} · ${semesterCourses.length} course${semesterCourses.length !== 1 ? "s" : ""}`
            : "Your academic overview"}
        </p>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Layers size={14} className="text-[#9ca3af]" strokeWidth={1.8} />}
          label="Current Semester"
          value={currentSemester?.name ?? "None"}
          sub={currentSemester ? `${semesterCourses.length} course${semesterCourses.length !== 1 ? "s" : ""}` : "Create one to start"}
          loading={loadingS || loadingC}
          to="/semesters"
        />
        <StatCard
          icon={<BookOpen size={14} className="text-[#9ca3af]" strokeWidth={1.8} />}
          label="Overall GPA"
          value={overallGpa != null ? overallGpa.toFixed(2) : "—"}
          sub={overallGpa != null ? `Weighted · ${semesterCourses.length} courses` : "No grades yet"}
          loading={gpaLoading}
          to="/courses"
        />
        <StatCard
          icon={<CheckSquare size={14} className="text-[#9ca3af]" strokeWidth={1.8} />}
          label="Tasks This Week"
          value={loadingT ? null : `${completedThisWeek} / ${tasksThisWeek.length}`}
          sub={loadingT ? "" : tasksThisWeek.length > 0 ? "completed this week" : "No tasks due this week"}
          loading={loadingT}
          to="/tasks"
        />
        <StatCard
          icon={<Clock size={14} className="text-[#9ca3af]" strokeWidth={1.8} />}
          label="Due Soon"
          value={loadingAll ? null : String(dueSoonCount)}
          sub={dueSoonCount === 0 ? "All caught up!" : "due in 7 days"}
          loading={loadingAll}
          to="/assignments"
        />
      </div>

      {/* ── Main 2-col grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Upcoming Deadlines ──────────────────────────────────────────── */}
        <Section
          title="Upcoming Deadlines"
          icon={<ClipboardList size={14} className="text-[#9ca3af]" strokeWidth={1.8} />}
          action={<Link to="/assignments" className="text-xs text-[#9ca3af] hover:text-[#111] transition-colors flex items-center gap-1">All <ArrowRight size={11} /></Link>}
        >
          <div className="divide-y divide-[#f5f5f5]">
            {(loadingA || loadingT) ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <SkeletonCard height={16} className="flex-1" />
                  <SkeletonCard height={20} width={56} className="rounded-full" />
                </div>
              ))
            ) : upcomingDeadlines.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-[#10b981] font-medium">All caught up!</p>
                <p className="text-xs text-[#9ca3af] mt-0.5">Nothing due in the next 2 weeks.</p>
              </div>
            ) : (
              upcomingDeadlines.map(item => {
                const due = relDue(item.dueDate);
                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    to={item.link}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-[#fafafa] transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-[#111] truncate group-hover:underline">{item.title}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wide border rounded px-1.5 py-0.5 flex-shrink-0 ${
                          item.type === "assignment"
                            ? "text-sky-600 bg-sky-50 border-sky-100"
                            : "text-purple-600 bg-purple-50 border-purple-100"
                        }`}>
                          {item.type === "assignment" ? "Asgmt" : "Task"}
                        </span>
                        {item.courseCode && (
                          <span className="text-[10px] font-semibold text-[#6b7280] bg-[#f5f5f5] border border-[#e5e7eb] rounded px-1.5 py-0.5 flex-shrink-0">
                            {item.courseCode}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 flex-shrink-0 ${due.cls}`}>
                      {due.label}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </Section>

        {/* ── Recent Notes ────────────────────────────────────────────────── */}
        <Section
          title="Recent Notes"
          icon={<FileText size={14} className="text-[#9ca3af]" strokeWidth={1.8} />}
          action={<Link to="/notes" className="text-xs text-[#9ca3af] hover:text-[#111] transition-colors flex items-center gap-1">All <ArrowRight size={11} /></Link>}
        >
          <div className="divide-y divide-[#f5f5f5]">
            {loadingN ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <SkeletonCard height={16} className="flex-1" />
                  <SkeletonCard height={14} width={80} />
                </div>
              ))
            ) : recentNotes.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-[#9ca3af]">No notes yet.</p>
                <button
                  onClick={() => navigate("/notes")}
                  className="mt-2 text-xs text-[#111] hover:underline"
                >
                  Create your first note →
                </button>
              </div>
            ) : (
              recentNotes.map(note => {
                const diffMs  = Date.now() - new Date(note.updatedAt).getTime();
                const diffMin = Math.floor(diffMs / 60000);
                const modLabel = diffMin < 60
                  ? `${diffMin || 1}m ago`
                  : diffMin < 1440
                    ? `${Math.floor(diffMin / 60)}h ago`
                    : new Date(note.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                return (
                  <Link
                    key={note.id}
                    to={`/notes/${note.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-[#fafafa] transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#111] truncate group-hover:underline">{note.title || "Untitled"}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {note.course && (
                          <span className="text-[10px] font-semibold text-[#6b7280] bg-[#f5f5f5] border border-[#e5e7eb] rounded px-1.5 py-0.5">
                            {note.course.code}
                          </span>
                        )}
                        {(note.tags ?? []).slice(0, 2).map(t => (
                          <span key={t} className="text-[10px] text-[#9ca3af]">#{t}</span>
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#b0b7c3] flex-shrink-0">{modLabel}</span>
                  </Link>
                );
              })
            )}
          </div>
        </Section>

        {/* ── Mini Calendar ───────────────────────────────────────────────── */}
        <Section
          fillBody
          title={`${new Date().toLocaleDateString("en-US", { month: "long" })} ${today.getFullYear()}`}
          icon={<CalendarDays size={14} className="text-[#9ca3af]" strokeWidth={1.8} />}
          action={
            <Link to="/calendar" className="text-xs text-[#9ca3af] hover:text-[#111] transition-colors flex items-center gap-1">
              Full view <ArrowRight size={11} />
            </Link>
          }
        >
          <div className="px-5 py-4 flex-1 flex flex-col min-h-0">
            <MiniCalendar activeDays={activeDays} />
          </div>
        </Section>

        {/* ── Quick Actions ───────────────────────────────────────────────── */}
        <Section
          title="Quick Actions"
          icon={<Plus size={14} className="text-[#9ca3af]" strokeWidth={1.8} />}
        >
          <div className="p-5 grid grid-cols-2 gap-3">
            {/* + Assignment */}
            <button
              onClick={() => setShowNewAssignment(true)}
              className="group card-hover flex flex-col items-start gap-2.5 bg-[#fafafa] border border-[#e5e7eb] rounded-card p-4 min-h-[88px]
                         hover:border-[#d1d5db] transition-all duration-150"
            >
              <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                <ClipboardList size={14} className="text-sky-600" />
              </div>
              <div className="space-y-0.5 text-left">
                <p className="text-sm font-medium text-[#111]">Assignment</p>
                <p className="text-[10px] text-[#9ca3af]">Add a new deadline</p>
              </div>
            </button>

            {/* + Note */}
            <button
              onClick={async () => {
                const courses = allCourses;
                if (!courses?.length) return navigate("/notes");
                // Navigate to notes where user can create with modal
                navigate("/notes");
              }}
              className="group card-hover flex flex-col items-start gap-2.5 bg-[#fafafa] border border-[#e5e7eb] rounded-card p-4 min-h-[88px]
                         hover:border-[#d1d5db] transition-all duration-150"
            >
              <div className="w-7 h-7 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                <FileText size={14} className="text-violet-600" />
              </div>
              <div className="space-y-0.5 text-left">
                <p className="text-sm font-medium text-[#111]">Note</p>
                <p className="text-[10px] text-[#9ca3af]">Write something down</p>
              </div>
            </button>

            {/* + Task */}
            <button
              onClick={() => setShowNewTask(true)}
              className="group card-hover flex flex-col items-start gap-2.5 bg-[#fafafa] border border-[#e5e7eb] rounded-card p-4 min-h-[88px]
                         hover:border-[#d1d5db] transition-all duration-150"
            >
              <div className="w-7 h-7 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                <CheckSquare size={14} className="text-green-600" />
              </div>
              <div className="space-y-0.5 text-left">
                <p className="text-sm font-medium text-[#111]">Task</p>
                <p className="text-[10px] text-[#9ca3af]">Add to your to-do list</p>
              </div>
            </button>

            {/* View Calendar */}
            <Link
              to="/calendar"
              className="group card-hover flex flex-col items-start gap-2.5 bg-[#fafafa] border border-[#e5e7eb] rounded-card p-4 min-h-[88px]
                         hover:border-[#d1d5db] transition-all duration-150"
            >
              <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                <CalendarDays size={14} className="text-orange-500" />
              </div>
              <div className="space-y-0.5 text-left">
                <p className="text-sm font-medium text-[#111]">Calendar</p>
                <p className="text-[10px] text-[#9ca3af]">View all events</p>
              </div>
            </Link>
          </div>
        </Section>
      </div>

      {/* ── Quick action modals ────────────────────────────────────────────── */}
      <Modal open={showNewAssignment} onClose={() => setShowNewAssignment(false)} title="New assignment">
        <AssignmentForm
          courses={allCourses}
          onSubmit={async (p) => { await createAssignment.mutateAsync(p); setShowNewAssignment(false); }}
          onCancel={() => setShowNewAssignment(false)}
        />
      </Modal>

      <Modal open={showNewTask} onClose={() => setShowNewTask(false)} title="New task">
        <TaskForm
          courses={allCourses}
          onSubmit={async (p) => { await createTask.mutateAsync(p); setShowNewTask(false); }}
          onCancel={() => setShowNewTask(false)}
        />
      </Modal>
    </div>
  );
}
