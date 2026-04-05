import { useEffect, useState } from "react";
import {
  BookMarked, Clock, CheckCircle2, BookOpen, ChevronDown, ChevronRight,
  FileText, FolderOpen, HelpCircle, PenLine, ExternalLink, Lock,
  AlertTriangle, LayoutDashboard, Link as LinkIcon, RefreshCw, Layers,
} from "lucide-react";
import {
  useLmsCourses, useLmsUpcoming, useLmsModules,
  LmsCourse, LmsAssignment, LmsModule,
} from "../hooks/api/lms";
import LmsSync from "../components/lms/LmsSync";
import { useTheme } from "../ThemeContext";

/* helpers for card bg / border that react to theme */
function cardBg(isDark: boolean) { return isDark ? "#141414" : "#ffffff"; }
function cardBorder(isDark: boolean) { return isDark ? "#2a2a2a" : "rgba(0,0,0,0.08)"; }
function textColor(isDark: boolean) { return isDark ? "#f0f0f0" : "#111827"; }
function textMuted(isDark: boolean) { return isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"; }
function textSubtle(isDark: boolean) { return isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)"; }
function borderSubtle(isDark: boolean) { return isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relDue(iso: string): { label: string; urgency: "overdue" | "today" | "tomorrow" | "week" | "later" } {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(iso).setHours(0, 0, 0, 0) - today.getTime()) / 86400000);
  if (diff < 0)   return { label: `${Math.abs(diff)}d overdue`, urgency: "overdue" };
  if (diff === 0) return { label: "Due today",                   urgency: "today" };
  if (diff === 1) return { label: "Tomorrow",                    urgency: "tomorrow" };
  if (diff <= 7)  return { label: `${diff}d left`,               urgency: "week" };
  return {
    label: new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    urgency: "later",
  };
}

const URGENCY_CLS: Record<string, string> = {
  overdue:  "text-red-500 bg-red-500/10 border-red-500/20",
  today:    "text-amber-600 bg-amber-500/10 border-amber-500/20",
  tomorrow: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  week:     "text-green-600 bg-green-500/10 border-green-500/20",
  later:    "text-zinc-500/70 bg-zinc-500/10 border-zinc-500/20",
};

function DueBadge({ iso }: { iso: string }) {
  const { label, urgency } = relDue(iso);
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded border flex-shrink-0 ${URGENCY_CLS[urgency]}`}>
      {label}
    </span>
  );
}

function modIcon(modtype: string, size = 13, isDark = false) {
  switch (modtype) {
    case "assign":   return <PenLine size={size} className={isDark ? "text-blue-400 flex-shrink-0" : "text-blue-600 flex-shrink-0"} />;
    case "quiz":     return <HelpCircle size={size} className={isDark ? "text-purple-400 flex-shrink-0" : "text-purple-600 flex-shrink-0"} />;
    case "resource": return <FileText size={size} className={isDark ? "text-amber-400 flex-shrink-0" : "text-amber-600 flex-shrink-0"} />;
    case "folder":   return <FolderOpen size={size} className={isDark ? "text-green-500/80 flex-shrink-0" : "text-green-600/80 flex-shrink-0"} />;
    case "url":      return <LinkIcon size={size} className={isDark ? "text-sky-400 flex-shrink-0" : "text-sky-600 flex-shrink-0"} />;
    case "page":     return <FileText size={size} className={isDark ? "text-violet-400 flex-shrink-0" : "text-violet-600 flex-shrink-0"} />;
    default:         return <BookOpen size={size} className={isDark ? "text-neutral-400 flex-shrink-0" : "text-neutral-500 flex-shrink-0"} />;
  }
}

function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: React.ReactNode }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className="rounded-xl p-10 text-center" style={{ background: isDark ? "#141414" : "#ffffff", border: `1px solid ${isDark ? "#2a2a2a" : "rgba(0,0,0,0.08)"}`, borderTop: isDark ? "1px solid #333" : "1px solid #e5e7eb" }}>
      <div className="flex justify-center mb-3" style={{ color: isDark ? "#2a2a2a" : "rgba(0,0,0,0.15)" }}>{icon}</div>
      <p className="text-sm mb-1" style={{ color: isDark ? "#a1a1aa" : "#6b7280" }}>{title}</p>
      {sub && <p className="text-xs" style={{ color: isDark ? "#71717a" : "#9ca3af" }}>{sub}</p>}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  courses, upcoming, modules, onTabChange, isDark,
}: {
  courses: LmsCourse[];
  upcoming: LmsAssignment[];
  modules: LmsModule[];
  onTabChange: (t: Tab) => void;
  isDark: boolean;
}) {
  const overdue = upcoming.filter((a) => a.dueDate && relDue(a.dueDate).urgency === "overdue");
  const dueToday = upcoming.filter((a) => a.dueDate && relDue(a.dueDate).urgency === "today");
  const quizzes  = modules.filter((m) => m.modtype === "quiz");
  const files    = modules.filter((m) => ["resource", "folder", "url", "page"].includes(m.modtype));


  const stats = [
    { label: "Enrolled Courses",   value: courses.length,   icon: <BookOpen size={16} />,      color: "text-blue-400" },
    { label: "Pending Assignments", value: upcoming.length,  icon: <PenLine size={16} />,       color: "text-orange-400" },
    { label: "Overdue",             value: overdue.length,   icon: <AlertTriangle size={16} />, color: "text-red-400" },
    { label: "Quizzes",             value: quizzes.length,   icon: <HelpCircle size={16} />,    color: "text-purple-400" },
    { label: "Files & Resources",   value: files.length,     icon: <FileText size={16} />,      color: "text-amber-400" },
    { label: "Total Modules",       value: modules.length,   icon: <Layers size={16} />,        color: "text-neutral-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl px-4 py-4" style={{ background: cardBg(isDark), border: `1px solid ${cardBorder(isDark)}` }}>
            <div className={`mb-2 ${s.color}`}>{s.icon}</div>
            <p className="text-2xl font-bold" style={{ color: textColor(isDark) }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: textMuted(isDark) }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={13} className="text-red-400" />
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Overdue ({overdue.length})</span>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ background: cardBg(isDark), border: `1px solid ${isDark ? "rgba(248,113,113,0.2)" : "rgba(248,113,113,0.25)"}` }}>
            {overdue.map((a, i) => (
              <div key={a.id} className={`flex items-start gap-3 px-4 py-3 ${i < overdue.length - 1 ? "border-b" : ""}`} style={{ borderBottomColor: borderSubtle(isDark) }}>
                <PenLine size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: textColor(isDark) }}>{a.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: textMuted(isDark) }}>{a.course?.shortName ?? a.course?.fullName}</p>
                </div>
                {a.dueDate && <DueBadge iso={a.dueDate} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Due today */}
      {dueToday.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={13} className="text-orange-400" />
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Due Today ({dueToday.length})</span>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ background: cardBg(isDark), border: `1px solid ${isDark ? "rgba(251,146,60,0.2)" : "rgba(251,146,60,0.25)"}` }}>
            {dueToday.map((a, i) => (
              <div key={a.id} className={`flex items-start gap-3 px-4 py-3 ${i < dueToday.length - 1 ? "border-b" : ""}`} style={{ borderBottomColor: borderSubtle(isDark) }}>
                <PenLine size={12} className="text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: textColor(isDark) }}>{a.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: textMuted(isDark) }}>{a.course?.shortName ?? a.course?.fullName}</p>
                  {a.dueDate && (
                    <p className="text-xs mt-0.5" style={{ color: textSubtle(isDark) }}>
                      {new Date(a.dueDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All clear */}
      {overdue.length === 0 && dueToday.length === 0 && upcoming.length === 0 && courses.length > 0 && (
        <div className="rounded-xl p-8 text-center" style={{ background: cardBg(isDark), border: `1px solid ${cardBorder(isDark)}` }}>
          <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2" />
          <p className="text-sm" style={{ color: textMuted(isDark) }}>All caught up — no pending assignments.</p>
        </div>
      )}

      {/* No data */}
      {courses.length === 0 && (
        <EmptyState
          icon={<BookMarked size={32} />}
          title="No LMS data synced yet"
          sub={<button onClick={() => onTabChange("sync")} className="text-neutral-400 underline underline-offset-2">Go to Sync tab to connect your account</button>}
        />
      )}
    </div>
  );
}

// ─── Deadlines Tab ────────────────────────────────────────────────────────────

type DeadlineFilter = "pending" | "submitted" | "all";

function DeadlinesTab({ courses }: { courses: LmsCourse[] }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [filter, setFilter] = useState<DeadlineFilter>("pending");

  const allAssignments = courses
    .flatMap((c) => c.assignments.map((a) => ({ ...a, courseName: c.shortName ?? c.fullName })))
    .sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const filtered = allAssignments.filter((a) => {
    if (filter === "pending")   return !a.submitted;
    if (filter === "submitted") return a.submitted;
    return true;
  });

  // Group pending by urgency
  const groups: { label: string; items: typeof filtered; cls: string }[] = filter === "pending"
    ? [
        { label: "Overdue",    items: filtered.filter((a) => a.dueDate && relDue(a.dueDate).urgency === "overdue"),  cls: "text-red-400" },
        { label: "Due Today",  items: filtered.filter((a) => a.dueDate && relDue(a.dueDate).urgency === "today"),    cls: "text-orange-400" },
        { label: "Tomorrow",   items: filtered.filter((a) => a.dueDate && relDue(a.dueDate).urgency === "tomorrow"), cls: "text-amber-400" },
        { label: "This Week",  items: filtered.filter((a) => a.dueDate && relDue(a.dueDate).urgency === "week"),     cls: "text-emerald-400" },
        { label: "Later",      items: filtered.filter((a) => !a.dueDate || relDue(a.dueDate).urgency === "later"),   cls: "text-neutral-500" },
      ].filter((g) => g.items.length > 0)
    : [{ label: "All", items: filtered, cls: "text-neutral-400" }];

  const filterBtns: { key: DeadlineFilter; label: string }[] = [
    { key: "pending",   label: "Pending" },
    { key: "submitted", label: "Submitted" },
    { key: "all",       label: "All" },
  ];

  // Active tab: dark bg + white text in dark mode, light bg + dark text in light mode
  const tabActiveBg = isDark ? "bg-white/10" : "bg-gray-200";
  const tabActiveText = isDark ? "text-white" : "text-zinc-900";
  const tabInactiveText = isDark ? "text-neutral-500 hover:text-neutral-300" : "text-zinc-500 hover:text-zinc-700";
  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg p-1 w-fit flex-wrap" style={{ background: isDark ? "#141414" : "#f3f4f6", border: isDark ? `1px solid #2a2a2a` : `1px solid rgba(0,0,0,0.12)` }}>
        {filterBtns.map((b) => (
          <button
            key={b.key}
            onClick={() => setFilter(b.key)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filter === b.key ? `${tabActiveBg} ${tabActiveText}` : tabInactiveText}`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<CheckCircle2 size={28} />} title={filter === "submitted" ? "No submitted assignments recorded." : "No pending assignments."} />
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.label}>
              {filter === "pending" && (
                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${g.cls}`}>
                  {g.label} ({g.items.length})
                </p>
              )}
              <div className="bg-[#141414] border border-neutral-800 rounded-xl overflow-hidden">
                {g.items.map((a, i) => (
                  <div
                    key={a.id}
                    className={`flex items-start gap-3 px-4 py-3 ${i < g.items.length - 1 ? "border-b border-neutral-800/50" : ""} ${a.submitted ? "opacity-50" : ""}`}
                  >
                    <PenLine size={13} className={`flex-shrink-0 mt-0.5 ${a.submitted ? "text-neutral-600" : "text-blue-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${a.submitted ? "line-through text-neutral-500" : "text-white"}`}>{a.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{a.courseName}</p>
                      {a.dueDate && (
                        <p className="text-xs text-neutral-600 mt-0.5">
                          {new Date(a.dueDate).toLocaleString("en-US", {
                            weekday: "short", month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                    {a.submitted ? (
                      <span className="text-xs text-neutral-600 flex-shrink-0 flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-emerald-600" /> Submitted
                      </span>
                    ) : a.dueDate ? (
                      <DueBadge iso={a.dueDate} />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Quizzes Tab ──────────────────────────────────────────────────────────────

function QuizzesTab({ modules, courses }: { modules: LmsModule[]; courses: LmsCourse[] }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const quizzes = modules.filter((m) => m.modtype === "quiz");

  const byCourse = quizzes.reduce<Record<string, LmsModule[]>>((acc, m) => {
    (acc[m.lmsCourseId] ??= []).push(m);
    return acc;
  }, {});

  const courseMap = Object.fromEntries(courses.map((c) => [c.lmsCourseId, c]));

  if (quizzes.length === 0) {
    return <EmptyState icon={<HelpCircle size={28} />} title="No quizzes found." sub="Run a sync to fetch quizzes from your courses." />;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: textMuted(isDark) }}>{quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""} across {Object.keys(byCourse).length} course{Object.keys(byCourse).length !== 1 ? "s" : ""}</p>
      {Object.entries(byCourse).map(([courseId, items]) => {
        const course = courseMap[courseId];
        return (
          <div key={courseId} className="rounded-xl overflow-hidden" style={{ background: cardBg(isDark), border: `1px solid ${cardBorder(isDark)}` }}>
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${borderSubtle(isDark)}` }}>
              <HelpCircle size={12} className="text-purple-400" />
              <span className="text-xs font-medium truncate" style={{ color: textColor(isDark) }}>
                {course?.shortName ?? course?.fullName ?? courseId}
              </span>
              <span className="text-xs ml-auto flex-shrink-0" style={{ color: textMuted(isDark) }}>{items.length}</span>
            </div>
            {items.map((m, i) => (
              <div key={m.id} className={`flex items-center gap-3 px-4 py-2.5 ${i < items.length - 1 ? "border-b" : ""}`} style={{ borderBottomColor: borderSubtle(isDark) }}>
                <HelpCircle size={13} className="text-purple-400 flex-shrink-0" />
                <p className="flex-1 text-sm truncate" style={{ color: m.accessible ? textColor(isDark) : textMuted(isDark) }}>{m.name}</p>
                {m.accessible && m.href ? (
                  <a href={m.href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs transition-colors flex-shrink-0"
                    style={{ color: isDark ? "#c084fc" : "#a855f7" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = isDark ? "#e9d5ff" : "#9333ea")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = isDark ? "#c084fc" : "#a855f7")}
                  >
                    Open <ExternalLink size={11} />
                  </a>
                ) : (
                  <Lock size={11} className={isDark ? "text-neutral-700 flex-shrink-0" : "text-neutral-400 flex-shrink-0"} />
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Files Tab ────────────────────────────────────────────────────────────────

type FileFilter = "all" | "resource" | "folder" | "url" | "page";

function FilesTab({ modules, courses }: { modules: LmsModule[]; courses: LmsCourse[] }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [filter, setFilter] = useState<FileFilter>("all");

  const FILE_TYPES: FileFilter[] = ["all", "resource", "folder", "url", "page"];
  const FILE_TYPE_LABELS: Record<FileFilter, string> = {
    all: "All", resource: "Files", folder: "Folders", url: "Links", page: "Pages",
  };

  const allFiles = modules.filter((m) => ["resource", "folder", "url", "page"].includes(m.modtype));
  const filtered = filter === "all" ? allFiles : allFiles.filter((m) => m.modtype === filter);

  const availableTypes = FILE_TYPES.filter(
    (t) => t === "all" || allFiles.some((m) => m.modtype === t)
  );

  const byCourse = filtered.reduce<Record<string, LmsModule[]>>((acc, m) => {
    (acc[m.lmsCourseId] ??= []).push(m);
    return acc;
  }, {});

  const courseMap = Object.fromEntries(courses.map((c) => [c.lmsCourseId, c]));

  if (allFiles.length === 0) {
    return <EmptyState icon={<FileText size={28} />} title="No files or resources found." sub="Run a sync to fetch course materials." />;
  }

  const tabActiveBg = isDark ? "bg-white/10" : "bg-gray-200";
  const tabActiveText = isDark ? "text-white" : "text-zinc-900";
  const tabInactiveText = isDark ? "text-neutral-500 hover:text-neutral-300" : "text-zinc-500 hover:text-zinc-700";
  const tabCountStyle = { color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)" };
  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg p-1 w-fit flex-wrap" style={{ background: isDark ? "#141414" : "#f3f4f6", border: isDark ? `1px solid #2a2a2a` : `1px solid rgba(0,0,0,0.12)` }}>
        {availableTypes.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              filter === t ? `${tabActiveBg} ${tabActiveText}` : tabInactiveText
            }`}
          >
            {FILE_TYPE_LABELS[t]}
            {t !== "all" && (
              <span className="ml-1" style={tabCountStyle}>({allFiles.filter((m) => m.modtype === t).length})</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<FileText size={24} />} title={`No ${FILE_TYPE_LABELS[filter].toLowerCase()} found.`} />
      ) : (
        <div className="space-y-4">
          {Object.entries(byCourse).map(([courseId, items]) => {
            const course = courseMap[courseId];
            return (
              <div key={courseId} className="rounded-xl overflow-hidden" style={{ background: cardBg(isDark), border: `1px solid ${cardBorder(isDark)}` }}>
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${borderSubtle(isDark)}` }}>
                  <BookOpen size={12} className={isDark ? "text-neutral-500" : "text-neutral-400"} />
                  <span className="text-xs font-medium truncate" style={{ color: textColor(isDark) }}>
                    {course?.shortName ?? course?.fullName ?? courseId}
                  </span>
                  <span className="text-xs ml-auto flex-shrink-0" style={{ color: textMuted(isDark) }}>{items.length}</span>
                </div>
                {items.map((m, i) => (
                  <div key={m.id} className={`flex items-center gap-3 px-4 py-2.5 ${i < items.length - 1 ? "border-b" : ""}`} style={{ borderBottomColor: borderSubtle(isDark) }}>
                    {modIcon(m.modtype, 13, isDark)}
                    <p className="flex-1 text-sm truncate" style={{ color: m.accessible ? textColor(isDark) : textMuted(isDark) }}>{m.name}</p>
                    {m.accessible && m.href ? (
                      <a href={m.href} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs transition-colors flex-shrink-0"
                        style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = isDark ? "#f0f0f0" : "#111")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)")}
                      >
                        Open <ExternalLink size={11} />
                      </a>
                    ) : (
                      <Lock size={11} className={isDark ? "text-neutral-700 flex-shrink-0" : "text-neutral-400 flex-shrink-0"} />
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Courses Tab ──────────────────────────────────────────────────────────────

function CoursesTab({ courses, modules }: { courses: LmsCourse[]; modules: LmsModule[] }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [openId, setOpenId] = useState<string | null>(null);

  if (courses.length === 0) {
    return <EmptyState icon={<BookOpen size={28} />} title="No courses synced yet." />;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: textMuted(isDark) }}>{courses.length} enrolled course{courses.length !== 1 ? "s" : ""}</p>
      {courses.map((course) => {
        const pending   = course.assignments.filter((a) => !a.submitted && a.dueDate);
        const courseModules = modules.filter((m) => m.lmsCourseId === course.lmsCourseId);
        const byType = courseModules.reduce<Record<string, number>>((acc, m) => {
          acc[m.modtype] = (acc[m.modtype] ?? 0) + 1;
          return acc;
        }, {});
        const isOpen = openId === course.lmsCourseId;

        return (
          <div key={course.id} className="rounded-xl overflow-hidden" style={{ background: cardBg(isDark), border: `1px solid ${cardBorder(isDark)}` }}>
            <button
              onClick={() => setOpenId(isOpen ? null : course.lmsCourseId)}
              className="w-full flex items-center justify-between px-4 py-3.5 transition-colors text-left"
              style={{
                backgroundColor: isOpen
                  ? (isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)")
                  : "transparent",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isOpen ? (isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)") : "transparent")}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: textColor(isDark) }}>{course.fullName}</p>
                {course.shortName && <p className="text-xs mt-0.5" style={{ color: textMuted(isDark) }}>{course.shortName}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                {pending.length > 0 && (
                  <span className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">
                    {pending.length} due
                  </span>
                )}
                {courseModules.length > 0 && (
                  <span className="text-xs" style={{ color: textMuted(isDark) }}>{courseModules.length} items</span>
                )}
                {isOpen ? <ChevronDown size={14} className={isDark ? "text-neutral-600" : "text-gray-400"} /> : <ChevronRight size={14} className={isDark ? "text-neutral-600" : "text-gray-400"} />}
              </div>
            </button>

            {isOpen && (
              <div className="px-4 py-3 space-y-3" style={{ borderTop: `1px solid ${borderSubtle(isDark)}` }}>
                {/* Module type breakdown */}
                {courseModules.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(byType).map(([type, count]) => (
                      <div key={type} className="flex items-center gap-1.5 rounded-md px-2.5 py-1" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}>
                        {modIcon(type, 11, isDark)}
                        <span className="text-xs capitalize" style={{ color: textMuted(isDark) }}>{type}</span>
                        <span className="text-xs" style={{ color: textSubtle(isDark) }}>({count})</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assignment status */}
                {course.assignments.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium" style={{ color: textMuted(isDark) }}>Assignments</p>
                    {course.assignments
                      .sort((a, b) => {
                        if (!a.dueDate && !b.dueDate) return 0;
                        if (!a.dueDate) return 1;
                        if (!b.dueDate) return -1;
                        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                      })
                      .map((a) => (
                        <div key={a.id} className="flex items-center gap-2 py-1">
                          <PenLine size={11} className={a.submitted ? (isDark ? "text-neutral-600" : "text-gray-400") : "text-blue-400"} />
                          <span className="text-xs flex-1 truncate" style={{ color: a.submitted ? textMuted(isDark) : textColor(isDark), textDecoration: a.submitted ? "line-through" : "none" }}>{a.name}</span>
                          {a.submitted ? (
                            <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />
                          ) : a.dueDate ? (
                            <DueBadge iso={a.dueDate} />
                          ) : null}
                        </div>
                      ))}
                  </div>
                )}

                {course.assignments.length === 0 && courseModules.length === 0 && (
                  <p className="text-xs" style={{ color: textMuted(isDark) }}>No data — run a sync.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "overview" | "deadlines" | "quizzes" | "files" | "courses" | "sync";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview",  label: "Overview",   icon: <LayoutDashboard size={13} /> },
  { key: "deadlines", label: "Deadlines",  icon: <Clock size={13} /> },
  { key: "quizzes",   label: "Quizzes",    icon: <HelpCircle size={13} /> },
  { key: "files",     label: "Files",      icon: <FileText size={13} /> },
  { key: "courses",   label: "Courses",    icon: <BookOpen size={13} /> },
  { key: "sync",      label: "Sync",       icon: <RefreshCw size={13} /> },
];

export default function LmsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [tab, setTab] = useState<Tab>("overview");
  const { data: courses,  fetch: fetchCourses,  loading: loadingCourses  } = useLmsCourses();
  const { data: upcoming, fetch: fetchUpcoming, loading: loadingUpcoming } = useLmsUpcoming();
  const { data: modules,  fetch: fetchModules,  loading: loadingModules  } = useLmsModules();

  useEffect(() => {
    fetchCourses();
    fetchUpcoming();
    fetchModules();
  }, []);

  useEffect(() => {
    if (tab === "overview" || tab === "deadlines") { fetchUpcoming(); fetchCourses(); }
    if (tab === "quizzes" || tab === "files")       { fetchModules(); fetchCourses(); }
    if (tab === "courses")                          { fetchCourses(); fetchModules(); }
  }, [tab]);

  const loading = loadingCourses || loadingUpcoming || loadingModules;

  return (
    <div className="p-6 sm:p-8 w-full min-w-0">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <BookMarked size={20} className={isDark ? "text-white/40" : "text-zinc-400"} />
        <h1 className="text-2xl font-bold" style={{ color: isDark ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.95)" }}>LMS</h1>
      </div>
      <p className="text-sm mb-6" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)" }}>
        lms.vit.ac.in — courses, deadlines, quizzes, and files
      </p>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg p-1 w-fit mb-6 flex-wrap" style={{ background: isDark ? "#141414" : "#f3f4f6", border: `1px solid ${isDark ? "#2a2a2a" : "rgba(0,0,0,0.12)"}` }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? (isDark ? "bg-white text-black" : "bg-zinc-900 text-zinc-100")
                : (isDark ? "text-neutral-400 hover:text-neutral-200" : "text-zinc-500 hover:text-zinc-900")
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && tab !== "sync" && (
        <div className="text-sm text-neutral-500 py-6 text-center">Loading...</div>
      )}

      {/* Tab content */}
      {!loading && (
        <>
          {tab === "overview"  && <OverviewTab courses={courses} upcoming={upcoming} modules={modules} onTabChange={setTab} isDark={isDark} />}
          {tab === "deadlines" && <DeadlinesTab courses={courses} />}
          {tab === "quizzes"   && <QuizzesTab modules={modules} courses={courses} />}
          {tab === "files"     && <FilesTab modules={modules} courses={courses} />}
          {tab === "courses"   && <CoursesTab courses={courses} modules={modules} />}
          {tab === "sync"      && <div className="max-w-xl sm:max-w-xl lg:max-w-2xl"><LmsSync /></div>}
        </>
      )}
    </div>
  );
}
