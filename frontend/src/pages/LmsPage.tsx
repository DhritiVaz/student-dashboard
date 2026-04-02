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
  overdue:  "text-red-400 bg-red-500/10 border-red-500/20",
  today:    "text-orange-400 bg-orange-500/10 border-orange-500/20",
  tomorrow: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  week:     "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  later:    "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
};

function DueBadge({ iso }: { iso: string }) {
  const { label, urgency } = relDue(iso);
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded border flex-shrink-0 ${URGENCY_CLS[urgency]}`}>
      {label}
    </span>
  );
}

function modIcon(modtype: string, size = 13) {
  switch (modtype) {
    case "assign":   return <PenLine size={size} className="text-blue-400 flex-shrink-0" />;
    case "quiz":     return <HelpCircle size={size} className="text-purple-400 flex-shrink-0" />;
    case "resource": return <FileText size={size} className="text-amber-400 flex-shrink-0" />;
    case "folder":   return <FolderOpen size={size} className="text-emerald-400 flex-shrink-0" />;
    case "url":      return <LinkIcon size={size} className="text-sky-400 flex-shrink-0" />;
    case "page":     return <FileText size={size} className="text-violet-400 flex-shrink-0" />;
    default:         return <BookOpen size={size} className="text-neutral-400 flex-shrink-0" />;
  }
}

function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: React.ReactNode }) {
  return (
    <div className="bg-[#141414] border border-neutral-800 rounded-xl p-10 text-center">
      <div className="flex justify-center mb-3 text-neutral-700">{icon}</div>
      <p className="text-sm text-neutral-500 mb-1">{title}</p>
      {sub && <p className="text-xs text-neutral-600">{sub}</p>}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  courses, upcoming, modules, onTabChange,
}: {
  courses: LmsCourse[];
  upcoming: LmsAssignment[];
  modules: LmsModule[];
  onTabChange: (t: Tab) => void;
}) {
  const overdue  = upcoming.filter((a) => a.dueDate && relDue(a.dueDate).urgency === "overdue");
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
          <div key={s.label} className="bg-[#141414] border border-neutral-800 rounded-xl px-4 py-4">
            <div className={`mb-2 ${s.color}`}>{s.icon}</div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
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
          <div className="bg-[#141414] border border-red-500/20 rounded-xl overflow-hidden">
            {overdue.map((a, i) => (
              <div key={a.id} className={`flex items-start gap-3 px-4 py-3 ${i < overdue.length - 1 ? "border-b border-neutral-800/50" : ""}`}>
                <PenLine size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{a.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{a.course?.shortName ?? a.course?.fullName}</p>
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
          <div className="bg-[#141414] border border-orange-500/20 rounded-xl overflow-hidden">
            {dueToday.map((a, i) => (
              <div key={a.id} className={`flex items-start gap-3 px-4 py-3 ${i < dueToday.length - 1 ? "border-b border-neutral-800/50" : ""}`}>
                <PenLine size={12} className="text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{a.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{a.course?.shortName ?? a.course?.fullName}</p>
                  {a.dueDate && (
                    <p className="text-xs text-neutral-600 mt-0.5">
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
        <div className="bg-[#141414] border border-neutral-800 rounded-xl p-8 text-center">
          <CheckCircle2 size={28} className="text-emerald-600 mx-auto mb-2" />
          <p className="text-sm text-neutral-400">All caught up — no pending assignments.</p>
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

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-[#141414] border border-neutral-800 rounded-lg p-1 w-fit">
        {filterBtns.map((b) => (
          <button
            key={b.key}
            onClick={() => setFilter(b.key)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              filter === b.key ? "bg-white/10 text-white" : "text-neutral-500 hover:text-neutral-300"
            }`}
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
      <p className="text-xs text-neutral-500">{quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""} across {Object.keys(byCourse).length} course{Object.keys(byCourse).length !== 1 ? "s" : ""}</p>
      {Object.entries(byCourse).map(([courseId, items]) => {
        const course = courseMap[courseId];
        return (
          <div key={courseId} className="bg-[#141414] border border-neutral-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-neutral-800/60 flex items-center gap-2">
              <HelpCircle size={12} className="text-purple-400" />
              <span className="text-xs font-medium text-neutral-300 truncate">
                {course?.shortName ?? course?.fullName ?? courseId}
              </span>
              <span className="text-xs text-neutral-600 ml-auto flex-shrink-0">{items.length}</span>
            </div>
            {items.map((m, i) => (
              <div key={m.id} className={`flex items-center gap-3 px-4 py-2.5 ${i < items.length - 1 ? "border-b border-neutral-800/40" : ""}`}>
                <HelpCircle size={13} className="text-purple-400 flex-shrink-0" />
                <p className={`flex-1 text-sm truncate ${m.accessible ? "text-white" : "text-neutral-500"}`}>{m.name}</p>
                {m.accessible && m.href ? (
                  <a href={m.href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors flex-shrink-0">
                    Open <ExternalLink size={11} />
                  </a>
                ) : (
                  <Lock size={11} className="text-neutral-700 flex-shrink-0" />
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

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-[#141414] border border-neutral-800 rounded-lg p-1 w-fit flex-wrap">
        {availableTypes.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              filter === t ? "bg-white/10 text-white" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {FILE_TYPE_LABELS[t]}
            {t !== "all" && (
              <span className="ml-1 text-neutral-600">({allFiles.filter((m) => m.modtype === t).length})</span>
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
              <div key={courseId} className="bg-[#141414] border border-neutral-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-neutral-800/60 flex items-center gap-2">
                  <BookOpen size={12} className="text-neutral-500" />
                  <span className="text-xs font-medium text-neutral-300 truncate">
                    {course?.shortName ?? course?.fullName ?? courseId}
                  </span>
                  <span className="text-xs text-neutral-600 ml-auto flex-shrink-0">{items.length}</span>
                </div>
                {items.map((m, i) => (
                  <div key={m.id} className={`flex items-center gap-3 px-4 py-2.5 ${i < items.length - 1 ? "border-b border-neutral-800/40" : ""}`}>
                    {modIcon(m.modtype)}
                    <p className={`flex-1 text-sm truncate ${m.accessible ? "text-white" : "text-neutral-500"}`}>{m.name}</p>
                    {m.accessible && m.href ? (
                      <a href={m.href} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-200 transition-colors flex-shrink-0">
                        Open <ExternalLink size={11} />
                      </a>
                    ) : (
                      <Lock size={11} className="text-neutral-700 flex-shrink-0" />
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
  const [openId, setOpenId] = useState<string | null>(null);

  if (courses.length === 0) {
    return <EmptyState icon={<BookOpen size={28} />} title="No courses synced yet." />;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-500">{courses.length} enrolled course{courses.length !== 1 ? "s" : ""}</p>
      {courses.map((course) => {
        const pending   = course.assignments.filter((a) => !a.submitted && a.dueDate);
        const courseModules = modules.filter((m) => m.lmsCourseId === course.lmsCourseId);
        const byType = courseModules.reduce<Record<string, number>>((acc, m) => {
          acc[m.modtype] = (acc[m.modtype] ?? 0) + 1;
          return acc;
        }, {});
        const isOpen = openId === course.lmsCourseId;

        return (
          <div key={course.id} className="bg-[#141414] border border-neutral-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenId(isOpen ? null : course.lmsCourseId)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.02] transition-colors text-left"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{course.fullName}</p>
                {course.shortName && <p className="text-xs text-neutral-500 mt-0.5">{course.shortName}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                {pending.length > 0 && (
                  <span className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">
                    {pending.length} due
                  </span>
                )}
                {courseModules.length > 0 && (
                  <span className="text-xs text-neutral-600">{courseModules.length} items</span>
                )}
                {isOpen ? <ChevronDown size={14} className="text-neutral-600" /> : <ChevronRight size={14} className="text-neutral-600" />}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-neutral-800/60 px-4 py-3 space-y-3">
                {/* Module type breakdown */}
                {courseModules.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(byType).map(([type, count]) => (
                      <div key={type} className="flex items-center gap-1.5 bg-white/5 rounded-md px-2.5 py-1">
                        {modIcon(type, 11)}
                        <span className="text-xs text-neutral-400 capitalize">{type}</span>
                        <span className="text-xs text-neutral-600">({count})</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assignment status */}
                {course.assignments.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-neutral-600 font-medium">Assignments</p>
                    {course.assignments
                      .sort((a, b) => {
                        if (!a.dueDate && !b.dueDate) return 0;
                        if (!a.dueDate) return 1;
                        if (!b.dueDate) return -1;
                        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                      })
                      .map((a) => (
                        <div key={a.id} className="flex items-center gap-2 py-1">
                          <PenLine size={11} className={a.submitted ? "text-neutral-600" : "text-blue-400"} />
                          <span className={`text-xs flex-1 truncate ${a.submitted ? "line-through text-neutral-600" : "text-neutral-300"}`}>{a.name}</span>
                          {a.submitted ? (
                            <CheckCircle2 size={11} className="text-emerald-600 flex-shrink-0" />
                          ) : a.dueDate ? (
                            <DueBadge iso={a.dueDate} />
                          ) : null}
                        </div>
                      ))}
                  </div>
                )}

                {course.assignments.length === 0 && courseModules.length === 0 && (
                  <p className="text-xs text-neutral-600">No data — run a sync.</p>
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
        <BookMarked size={20} className="text-white/40" />
        <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>LMS</h1>
      </div>
      <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.35)" }}>
        lms.vit.ac.in — courses, deadlines, quizzes, and files
      </p>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#141414] border border-neutral-800 rounded-lg p-1 w-fit mb-6 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? "bg-white text-black" : "text-neutral-400 hover:text-white"
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
          {tab === "overview"  && <OverviewTab courses={courses} upcoming={upcoming} modules={modules} onTabChange={setTab} />}
          {tab === "deadlines" && <DeadlinesTab courses={courses} />}
          {tab === "quizzes"   && <QuizzesTab modules={modules} courses={courses} />}
          {tab === "files"     && <FilesTab modules={modules} courses={courses} />}
          {tab === "courses"   && <CoursesTab courses={courses} modules={modules} />}
          {tab === "sync"      && <div className="max-w-xl"><LmsSync /></div>}
        </>
      )}
    </div>
  );
}
