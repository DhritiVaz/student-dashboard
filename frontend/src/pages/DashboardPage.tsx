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
import VtopSync from "../components/vtop/VtopSync";

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
  if (diff < 0)   return { label: `${Math.abs(diff)}d overdue`, cls: "text-red-400 bg-red-500/10 border-red-500/20" };
  if (diff === 0) return { label: "Today",     cls: "text-orange-400 bg-orange-500/10 border-orange-500/20" };
  if (diff === 1) return { label: "Tomorrow",  cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
  if (diff <= 7)  return { label: `${diff}d`,  cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
  return { label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), cls: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20" };
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, loading, to, accent }: {
  icon: React.ReactNode; label: string; value: string | null;
  sub: string; loading?: boolean; to?: string; accent?: string;
}) {
  const inner = (
    <div className="relative rounded-xl p-5 h-full flex flex-col gap-3 overflow-hidden transition-all duration-150"
      style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: accent ?? "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          {icon}
        </div>
        <span className="text-[11px] font-medium uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.2)" }}>{label}</span>
      </div>
      {loading ? (
        <div>
          <SkeletonCard height={32} width={80} className="mb-1" />
          <SkeletonCard height={13} width={100} />
        </div>
      ) : (
        <div>
          <p className="text-3xl font-bold tracking-tight leading-none mb-1"
            style={{ color: "rgba(255,255,255,0.95)" }}>{value ?? "—"}</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</p>
        </div>
      )}
    </div>
  );

  if (to) return (
    <Link to={to} className="group block"
      onMouseEnter={e => {
        const el = e.currentTarget.querySelector("div") as HTMLDivElement;
        el.style.border = "1px solid rgba(255,255,255,0.14)";
        el.style.background = "#191919";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget.querySelector("div") as HTMLDivElement;
        el.style.border = "1px solid rgba(255,255,255,0.08)";
        el.style.background = "#141414";
      }}>
      {inner}
    </Link>
  );
  return <div>{inner}</div>;
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────
const MINI_WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function MiniCalendar({ activeDays }: { activeDays: Set<string> }) {
  const navigate = useNavigate();
  const today    = new Date();
  const cells    = getCalendarCells(today.getFullYear(), today.getMonth());
  const rowCount = Math.ceil(cells.length / 7);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="grid grid-cols-7 mb-1">
        {MINI_WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold py-1"
            style={{ color: "rgba(255,255,255,0.2)" }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1 min-h-0"
        style={{ gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))` }}>
        {cells.map(cell => {
          const key      = dateKey(cell);
          const inMonth  = cell.getMonth() === today.getMonth();
          const tod      = isToday(cell);
          const hasItems = activeDays.has(key);
          return (
            <button key={key} onClick={() => navigate("/calendar")}
              className="flex flex-col items-center justify-center rounded-md transition-all"
              style={{ opacity: !inMonth ? 0.25 : 1 }}
              onMouseEnter={e => !tod && ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={e => !tod && ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}>
              <span className="flex items-center justify-center rounded-full text-[11px] tabular-nums"
                style={tod
                  ? { width: 22, height: 22, background: "rgba(255,255,255,0.9)", color: "#0a0a0a", fontWeight: 700 }
                  : { width: 22, height: 22, color: inMonth ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.15)", fontWeight: 400 }
                }>
                {cell.getDate()}
              </span>
              {hasItems && inMonth && (
                <span className="w-1 h-1 rounded-full mt-0.5" style={{ background: "rgba(255,255,255,0.25)" }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ title, icon, action, children, fillBody, noPad }: {
  title: string; icon: React.ReactNode; action?: React.ReactNode;
  children: React.ReactNode; fillBody?: boolean; noPad?: boolean;
}) {
  return (
    <div className="flex flex-col min-h-0 rounded-xl overflow-hidden"
      style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{title}</span>
        </div>
        {action}
      </div>
      {fillBody
        ? <div className="flex-1 flex flex-col min-h-0 overflow-hidden">{children}</div>
        : <div className={noPad ? "" : ""}>{children}</div>
      }
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const { data: semesters,   isLoading: loadingS } = useSemesters();
  const { data: allCourses,  isLoading: loadingC } = useCourses();
  const { data: assignments, isLoading: loadingA } = useAssignments();
  const { data: tasks,       isLoading: loadingT } = useTasks();
  const { data: notes,       isLoading: loadingN } = useNotes();

  const today      = new Date();
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const monthEnd   = dateKey(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  const { data: events = [] } = useEvents(monthStart, monthEnd);

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
    const totalCredits = valid.reduce((s, e) => s + e.credits, 0);
    const weightedSum  = valid.reduce((s, e) => s + e.gpa * e.credits, 0);
    return totalCredits > 0 ? weightedSum / totalCredits : null;
  }, [gpaResults, semesterCourses]);

  const gpaLoading = gpaResults.some(q => q.isLoading) || loadingC || loadingS;
  const now        = Date.now();

  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay()); weekStart.setHours(0,0,0,0);
  const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23,59,59,999);

  const tasksThisWeek     = useMemo(() =>
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

  const upcomingDeadlines = useMemo(() => {
    const cutoff = new Date(now + 14 * 86400000);
    const items: { id: string; title: string; type: "assignment" | "task"; dueDate: string; courseCode?: string; link: string; }[] = [];
    assignments?.forEach(a => {
      if (!a.dueDate) return;
      const due = new Date(a.dueDate);
      if (due < today || due > cutoff || deriveStatus(a) === "submitted") return;
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

  const recentNotes = useMemo(() =>
    [...(notes ?? [])].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4),
    [notes]
  );

  const activeDays = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => { const d = e?.startDate?.slice?.(0, 10); if (d) set.add(d); });
    assignments?.forEach(a => { if (a?.dueDate) set.add(a.dueDate.slice(0, 10)); });
    tasks?.forEach(t => { if (t?.dueDate && !t.isCompleted) set.add(t.dueDate.slice(0, 10)); });
    return set;
  }, [events, assignments, tasks]);

  const [showNewAssignment, setShowNewAssignment] = useState(false);
  const [showNewTask,       setShowNewTask]       = useState(false);
  const createAssignment = useCreateAssignment();
  const createTask       = useCreateTask();
  const loadingAll       = loadingS || loadingC || loadingA || loadingT;

  const actionLinkStyle = {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    display: "flex",
    alignItems: "center",
    gap: 4,
    transition: "color 0.15s",
  };

  return (
    <div className="p-6 sm:p-8 w-full max-w-6xl mx-auto">

      {/* ── Greeting ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1" style={{ color: "rgba(255,255,255,0.95)" }}>
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          {currentSemester
            ? `${currentSemester.name} · ${semesterCourses.length} course${semesterCourses.length !== 1 ? "s" : ""}`
            : "Your academic overview"}
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<Layers size={13} style={{ color: "rgba(255,255,255,0.5)" }} strokeWidth={1.8} />}
          label="Semester" value={currentSemester?.name ?? "None"}
          sub={currentSemester ? `${semesterCourses.length} courses` : "Create one to start"}
          loading={loadingS || loadingC} to="/semesters" />
        <StatCard
          icon={<BookOpen size={13} style={{ color: "#60a5fa" }} strokeWidth={1.8} />}
          label="GPA" value={overallGpa != null ? overallGpa.toFixed(2) : "—"}
          sub={overallGpa != null ? "Weighted average" : "No grades yet"}
          loading={gpaLoading} to="/courses"
          accent="rgba(96,165,250,0.12)" />
        <StatCard
          icon={<CheckSquare size={13} style={{ color: "#34d399" }} strokeWidth={1.8} />}
          label="Tasks" value={loadingT ? null : `${completedThisWeek}/${tasksThisWeek.length}`}
          sub={tasksThisWeek.length > 0 ? "done this week" : "No tasks this week"}
          loading={loadingT} to="/tasks"
          accent="rgba(52,211,153,0.12)" />
        <StatCard
          icon={<Clock size={13} style={{ color: "#fb923c" }} strokeWidth={1.8} />}
          label="Due Soon" value={loadingAll ? null : String(dueSoonCount)}
          sub={dueSoonCount === 0 ? "All caught up!" : "due in 7 days"}
          loading={loadingAll} to="/assignments"
          accent="rgba(251,146,60,0.12)" />
      </div>

      {/* ── Main 2-col grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Upcoming Deadlines */}
        <Card title="Upcoming Deadlines"
          icon={<ClipboardList size={13} style={{ color: "rgba(255,255,255,0.3)" }} strokeWidth={1.8} />}
          action={
            <Link to="/assignments" style={actionLinkStyle}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.7)"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.3)"}>
              All <ArrowRight size={11} />
            </Link>
          }>
          {(loadingA || loadingT) ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} height={36} />)}
            </div>
          ) : upcomingDeadlines.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium mb-0.5" style={{ color: "#34d399" }}>All caught up!</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Nothing due in the next 2 weeks.</p>
            </div>
          ) : (
            upcomingDeadlines.map((item, i) => {
              const due = relDue(item.dueDate);
              return (
                <Link key={`${item.type}-${item.id}`} to={item.link}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                  style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = "transparent"}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] truncate" style={{ color: "rgba(255,255,255,0.8)" }}>{item.title}</span>
                      {item.courseCode && (
                        <span className="text-[10px] font-medium rounded px-1.5 py-0.5 flex-shrink-0"
                          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          {item.courseCode}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 flex-shrink-0 whitespace-nowrap ${due.cls}`}>
                    {due.label}
                  </span>
                </Link>
              );
            })
          )}
        </Card>

        {/* Recent Notes */}
        <Card title="Recent Notes"
          icon={<FileText size={13} style={{ color: "rgba(255,255,255,0.3)" }} strokeWidth={1.8} />}
          action={
            <Link to="/notes" style={actionLinkStyle}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.7)"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.3)"}>
              All <ArrowRight size={11} />
            </Link>
          }>
          {loadingN ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} height={36} />)}
            </div>
          ) : recentNotes.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>No notes yet.</p>
              <button onClick={() => navigate("/notes")} className="text-xs transition-colors"
                style={{ color: "rgba(255,255,255,0.4)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>
                Create your first note →
              </button>
            </div>
          ) : (
            recentNotes.map((note, i) => {
              const diffMs   = Date.now() - new Date(note.updatedAt).getTime();
              const diffMin  = Math.floor(diffMs / 60000);
              const modLabel = diffMin < 60 ? `${diffMin || 1}m ago`
                : diffMin < 1440 ? `${Math.floor(diffMin / 60)}h ago`
                : new Date(note.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              return (
                <Link key={note.id} to={`/notes/${note.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                  style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = "transparent"}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] truncate" style={{ color: "rgba(255,255,255,0.8)" }}>{note.title || "Untitled"}</p>
                    {note.course && (
                      <span className="text-[10px] font-medium"
                        style={{ color: "rgba(255,255,255,0.3)" }}>{note.course.code}</span>
                    )}
                  </div>
                  <span className="text-[11px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>{modLabel}</span>
                </Link>
              );
            })
          )}
        </Card>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Mini Calendar */}
        <Card fillBody
          title={new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          icon={<CalendarDays size={13} style={{ color: "rgba(255,255,255,0.3)" }} strokeWidth={1.8} />}
          action={
            <Link to="/calendar" style={actionLinkStyle}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.7)"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.3)"}>
              Full view <ArrowRight size={11} />
            </Link>
          }>
          <div className="px-4 py-3 flex-1 flex flex-col min-h-0" style={{ minHeight: 200 }}>
            <MiniCalendar activeDays={activeDays} />
          </div>
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions"
          icon={<Plus size={13} style={{ color: "rgba(255,255,255,0.3)" }} strokeWidth={1.8} />}>
          <div className="p-4 grid grid-cols-2 gap-2">
            {[
              { label: "Assignment", sub: "Add a deadline", icon: <ClipboardList size={13} style={{ color: "#38bdf8" }} />, accent: "rgba(56,189,248,0.1)", accentBorder: "rgba(56,189,248,0.2)", onClick: () => setShowNewAssignment(true) },
              { label: "Note", sub: "Write something", icon: <FileText size={13} style={{ color: "#a78bfa" }} />, accent: "rgba(167,139,250,0.1)", accentBorder: "rgba(167,139,250,0.2)", onClick: () => navigate("/notes") },
              { label: "Task", sub: "Add to your list", icon: <CheckSquare size={13} style={{ color: "#34d399" }} />, accent: "rgba(52,211,153,0.1)", accentBorder: "rgba(52,211,153,0.2)", onClick: () => setShowNewTask(true) },
              { label: "Calendar", sub: "View events", icon: <CalendarDays size={13} style={{ color: "#fb923c" }} />, accent: "rgba(251,146,60,0.1)", accentBorder: "rgba(251,146,60,0.2)", onClick: () => navigate("/calendar") },
            ].map(({ label, sub, icon, accent, accentBorder, onClick }) => (
              <button key={label} onClick={onClick}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-all duration-150"
                style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#1f1f1f";
                  (e.currentTarget as HTMLButtonElement).style.border = "1px solid rgba(255,255,255,0.12)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#1a1a1a";
                  (e.currentTarget as HTMLButtonElement).style.border = "1px solid rgba(255,255,255,0.07)";
                }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: accent, border: `1px solid ${accentBorder}` }}>
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium leading-none mb-0.5" style={{ color: "rgba(255,255,255,0.8)" }}>{label}</p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── VTOP Sync ── */}
      <div className="mt-4 rounded-xl overflow-hidden"
        style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="p-5">
          <VtopSync />
        </div>
      </div>

      {/* Modals */}
      <Modal open={showNewAssignment} onClose={() => setShowNewAssignment(false)} title="New assignment">
        <AssignmentForm courses={allCourses}
          onSubmit={async (p) => { await createAssignment.mutateAsync(p); setShowNewAssignment(false); }}
          onCancel={() => setShowNewAssignment(false)} />
      </Modal>
      <Modal open={showNewTask} onClose={() => setShowNewTask(false)} title="New task">
        <TaskForm courses={allCourses}
          onSubmit={async (p) => { await createTask.mutateAsync(p); setShowNewTask(false); }}
          onCancel={() => setShowNewTask(false)} />
      </Modal>
    </div>
  );
}