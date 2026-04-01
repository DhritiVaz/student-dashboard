import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, X, Pencil, Trash2, Calendar, ClipboardList, CheckSquare, ExternalLink, Grid3X3 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { EventForm } from "../components/calendar/EventForm";
import { useCourses } from "../hooks/api/courses";
import { useSemesters } from "../hooks/api/semesters";
import { useAssignments } from "../hooks/api/assignments";
import { useTasks } from "../hooks/api/tasks";
import { useVtopAcademicEvents, useVtopTimetable, type VtopTimetableEntry } from "../hooks/api/vtop";
import type { Course } from "../hooks/api/courses";
import {
  useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent,
  type CalendarEvent, type EventType,
} from "../hooks/api/events";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

/** e.g. 08:00 + 08:50 → "8–8:50"; 09:50 + 10:40 → "9:50–10:40" */
function formatCompactTimeRange(start: string, end: string): string {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const left = sm === 0 ? String(sh) : `${sh}:${String(sm).padStart(2, "0")}`;
  const right = em === 0 ? String(eh) : `${eh}:${String(em).padStart(2, "0")}`;
  return `${left}–${right}`;
}

type ItemStyle = { dot: string; bg: string; text: string; border: string; label: string };

const TYPE_STYLE: Record<string, ItemStyle> = {
  class:      { dot: "bg-blue-500",    bg: "bg-blue-950",     text: "text-blue-400",    border: "border-blue-900",    label: "Class" },
  exam:       { dot: "bg-red-500",     bg: "bg-red-50",       text: "text-red-700",     border: "border-red-100",     label: "Exam" },
  deadline:   { dot: "bg-orange-500",  bg: "bg-orange-50",    text: "text-orange-700",  border: "border-orange-100",  label: "Deadline" },
  personal:   { dot: "bg-violet-500",  bg: "bg-violet-50",    text: "text-violet-700",  border: "border-violet-100",  label: "Personal" },
  assignment: { dot: "bg-sky-500",     bg: "bg-sky-50",       text: "text-sky-700",     border: "border-sky-100",     label: "Assignment" },
  task:       { dot: "bg-purple-500",  bg: "bg-purple-50",    text: "text-purple-700",  border: "border-purple-100",  label: "Task" },
  holiday:    { dot: "bg-emerald-500", bg: "bg-emerald-950",  text: "text-emerald-400", border: "border-emerald-900", label: "Holiday" },
  exam_vtop:  { dot: "bg-red-500",     bg: "bg-red-950",      text: "text-red-400",     border: "border-red-900",     label: "Exam" },
};

function getStyle(type: "event" | "assignment" | "task", eventType?: EventType, customColor?: string | null): ItemStyle {
  if (type === "assignment") return TYPE_STYLE.assignment;
  if (type === "task")       return TYPE_STYLE.task;
  const base = TYPE_STYLE[eventType ?? "personal"] ?? TYPE_STYLE.personal;
  if (customColor) return { ...base, dot: "", bg: "", text: "", border: "" };
  return base;
}

type CalItemType = "event" | "assignment" | "task";
interface CalItem {
  id: string;
  title: string;
  dateKey: string;
  sortTime: number;
  type: CalItemType;
  eventType?: EventType;
  customColor?: string | null;
  time?: string;
  isAllDay?: boolean;
  courseCode?: string;
  courseId?: string;
  rawEvent?: CalendarEvent;
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function isToday(d: Date) {
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}
function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

function EventPill({ item, onClick }: { item: CalItem; onClick: () => void }) {
  const s = getStyle(item.type, item.eventType, item.customColor);
  const dotStyle = item.customColor ? { background: item.customColor } : undefined;
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      className={`w-full flex items-center gap-1 text-left px-1.5 py-0.5 rounded text-[10px] truncate transition-opacity hover:opacity-80 ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotStyle ? "" : s.dot}`} style={dotStyle} />
      <span className="truncate">{item.title}</span>
    </button>
  );
}

function DayCell({ date, items, isCurrentMonth, isSelected, onClick, onItemClick }: {
  date: Date; items: CalItem[]; isCurrentMonth: boolean; isSelected: boolean;
  onClick: () => void; onItemClick: (item: CalItem) => void;
}) {
  const today   = isToday(date);
  const visible = items.slice(0, 3);
  const overflow = items.length - 3;

  return (
    <div
      onClick={onClick}
      className="min-h-[96px] p-1.5 cursor-pointer transition-colors duration-100"
      style={{
        borderRight: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: isSelected ? "rgba(255,255,255,0.04)" : "transparent",
        opacity: !isCurrentMonth ? 0.3 : 1,
      }}
      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"; }}
      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
    >
      <div className="flex justify-end mb-1">
        <span
          className="text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full"
          style={today ? { background: "rgba(255,255,255,0.9)", color: "#0a0a0a", fontWeight: 700 } : { color: "rgba(255,255,255,0.4)" }}
        >
          {date.getDate()}
        </span>
      </div>
      <div className="space-y-0.5">
        {visible.map(item => (
          <EventPill key={`${item.type}-${item.id}`} item={item} onClick={() => onItemClick(item)} />
        ))}
        {overflow > 0 && (
          <button onClick={e => { e.stopPropagation(); onClick(); }}
            className="text-[10px] pl-1.5"
            style={{ color: "rgba(255,255,255,0.3)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
          >
            +{overflow} more
          </button>
        )}
      </div>
    </div>
  );
}

function DayPanel({ date, items, onItemClick, onClose, onCreateEvent }: {
  date: Date; items: CalItem[]; onItemClick: (item: CalItem) => void; onClose: () => void; onCreateEvent: () => void;
}) {
  const grouped: Record<CalItemType, CalItem[]> = { event: [], assignment: [], task: [] };
  items.forEach(i => grouped[i.type].push(i));
  const panelLabel = isToday(date) ? "Today" : date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const groupLabels: Record<CalItemType, string> = { event: "Events", assignment: "Assignments", task: "Tasks" };
  const groupIcons: Record<CalItemType, React.ReactNode> = {
    event: <Calendar size={12} style={{ color: "rgba(255,255,255,0.3)" }} />,
    assignment: <ClipboardList size={12} style={{ color: "rgba(255,255,255,0.3)" }} />,
    task: <CheckSquare size={12} style={{ color: "rgba(255,255,255,0.3)" }} />,
  };

  function Group({ type, list }: { type: CalItemType; list: CalItem[] }) {
    if (!list.length) return null;
    const linkTo = type === "assignment" ? `/assignments` : type === "task" ? `/tasks` : undefined;
    return (
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          {groupIcons[type]}
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>{groupLabels[type]}</span>
        </div>
        <div className="space-y-1">
          {list.map(item => {
            const s = getStyle(item.type, item.eventType, item.customColor);
            const dotStyle = item.customColor ? { background: item.customColor } : undefined;
            return (
              <div key={`${item.type}-${item.id}`}
                className="flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer group"
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                onClick={() => onItemClick(item)}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotStyle ? "" : s.dot}`} style={dotStyle} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "rgba(255,255,255,0.85)" }}>{item.title}</p>
                  {item.time && <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{item.time}</p>}
                  {item.courseCode && (
                    <span className="text-[9px] font-semibold rounded px-1 py-0.5" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      {item.courseCode}
                    </span>
                  )}
                </div>
                {linkTo && (
                  <Link to={linkTo} onClick={e => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "rgba(255,255,255,0.3)" }}>
                    <ExternalLink size={11} />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{panelLabel}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onCreateEvent} className="p-1 rounded-lg" style={{ color: "rgba(255,255,255,0.3)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
            <Plus size={14} />
          </button>
          <button type="button" onClick={onClose} className="p-1 rounded-lg" style={{ color: "rgba(255,255,255,0.3)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="p-4 space-y-4" style={{ maxHeight: 400, overflowY: "auto" }}>
        {!items.length ? (
          <p className="text-xs text-center py-4" style={{ color: "rgba(255,255,255,0.3)" }}>Nothing scheduled.</p>
        ) : (
          <>
            <Group type="event" list={grouped.event} />
            <Group type="assignment" list={grouped.assignment} />
            <Group type="task" list={grouped.task} />
          </>
        )}
      </div>
    </div>
  );
}

function UpcomingSidebar({ items, onItemClick }: { items: CalItem[]; onItemClick: (item: CalItem) => void }) {
  const now    = new Date();
  const next10 = items
    .filter(i => new Date(i.dateKey) >= new Date(dateKey(now)))
    .sort((a, b) => a.sortTime - b.sortTime)
    .slice(0, 10);
  const byDate = new Map<string, CalItem[]>();
  next10.forEach(i => { if (!byDate.has(i.dateKey)) byDate.set(i.dateKey, []); byDate.get(i.dateKey)!.push(i); });

  function dateLabel(key: string) {
    const d = new Date(key + "T00:00:00");
    if (isToday(d)) return "Today";
    if (isSameDay(d, new Date(Date.now() + 86400000))) return "Tomorrow";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-card overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div className="px-4 py-3 border-b border-[#f0f0f0]">
        <span className="text-sm font-semibold text-[#111]">Upcoming</span>
      </div>
      <div className="p-3 max-h-[520px] overflow-y-auto space-y-4">
        {!next10.length ? (
          <p className="text-xs text-[#9ca3af] text-center py-6">Nothing coming up.</p>
        ) : (
          [...byDate.entries()].map(([key, dayItems]) => (
            <div key={key}>
              <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1.5">{dateLabel(key)}</p>
              <div className="space-y-1">
                {dayItems.map(item => {
                  const s = getStyle(item.type, item.eventType, item.customColor);
                  const dotStyle = item.customColor ? { background: item.customColor } : undefined;
                  return (
                    <button key={`${item.type}-${item.id}`} onClick={() => onItemClick(item)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-left hover:bg-[#f5f5f5] transition-colors">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotStyle ? "" : s.dot}`} style={dotStyle} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#111] truncate">{item.title}</p>
                        <p className="text-[10px] text-[#9ca3af]">{item.time ?? (item.isAllDay ? "All day" : "")}{item.courseCode && ` · ${item.courseCode}`}</p>
                      </div>
                      <span className={`text-[9px] font-semibold border rounded-full px-1.5 py-0.5 flex-shrink-0 ${s.text} ${s.bg} ${s.border}`}>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EventDetailModal({ item, onEdit, onDelete, onClose, deleting }: {
  item: CalItem; onEdit: () => void; onDelete: () => void; onClose: () => void; deleting: boolean;
}) {
  const s = getStyle(item.type, item.eventType, item.customColor);
  const dotStyle = item.customColor ? { background: item.customColor } : undefined;
  const ev = item.rawEvent;
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${dotStyle ? "" : s.dot}`} style={dotStyle} />
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-[#111] leading-tight">{item.title}</p>
          <span className={`inline-block mt-1 text-[10px] font-semibold border rounded-full px-2 py-0.5 ${s.text} ${s.bg} ${s.border}`}>{s.label}</span>
        </div>
      </div>
      {item.time && <p className="text-sm text-[#6b7280]">{item.time}</p>}
      {ev && (
        <div className="space-y-2 text-sm text-[#6b7280]">
          <div className="flex items-start gap-2">
            <Calendar size={14} className="text-[#9ca3af] mt-0.5 flex-shrink-0" />
            <span>{ev.isAllDay ? fmtShortDate(ev.startDate) : `${fmtShortDate(ev.startDate)}, ${fmtTime(ev.startDate)} – ${fmtTime(ev.endDate)}`}</span>
          </div>
          {ev.course && <p className="text-xs text-[#9ca3af]">{ev.course.name} ({ev.course.code})</p>}
          {ev.description && <p className="text-sm text-[#6b7280] leading-relaxed border-t border-[#f0f0f0] pt-3">{ev.description}</p>}
        </div>
      )}
      {item.type !== "event" && <p className="text-sm text-[#6b7280]">{item.type === "assignment" ? "Assignment due" : "Task due"} — {fmtShortDate(item.dateKey)}</p>}
      <div className="flex items-center justify-between pt-2 border-t border-[#f0f0f0]">
        <div className="flex items-center gap-2 flex-wrap">
          {item.courseId && (
            <Link to={`/courses/${item.courseId}`}>
              <Button variant="secondary" size="sm"><ExternalLink size={13} /> Course page</Button>
            </Link>
          )}
          {item.type === "event" && item.rawEvent && (
            <>
              <Button variant="secondary" size="sm" onClick={onEdit}><Pencil size={13} /> Edit</Button>
              <Button variant="ghost" size="sm" loading={deleting} onClick={onDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 size={13} /> Delete</Button>
            </>
          )}
          {item.type === "assignment" && <Link to={`/assignments/${item.id}`}><Button variant="secondary" size="sm"><ExternalLink size={13} /> View assignment</Button></Link>}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

function TimetableGrid({ entries, courses }: { entries: VtopTimetableEntry[]; courses: Course[] | undefined }) {
  const codeToId = useMemo(() => {
    const m = new Map<string, string>();
    (courses ?? []).forEach((c) => {
      if (c.code) m.set(c.code.replace(/\s/g, "").toUpperCase(), c.id);
    });
    return m;
  }, [courses]);

  const timeRows = useMemo(() => {
    const byKey = new Map<string, { startTime: string; endTime: string }>();
    for (const e of entries) {
      const k = `${e.startTime}\t${e.endTime}`;
      if (!byKey.has(k)) byKey.set(k, { startTime: e.startTime, endTime: e.endTime });
    }
    return [...byKey.values()].sort(
      (a, b) =>
        parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime) ||
        parseTimeToMinutes(a.endTime) - parseTimeToMinutes(b.endTime)
    );
  }, [entries]);
  const days = [1, 2, 3, 4, 5, 6];
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (!entries.length) {
    return (
      <p className="text-sm py-16 text-center rounded-xl" style={{ color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
        No timetable synced yet. Run VTOP sync from the dashboard.
      </p>
    );
  }

  return (
    <div className="rounded-xl overflow-auto" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
      <table className="w-full text-xs min-w-[720px]">
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <th className="text-left p-3 font-semibold sticky left-0 z-10" style={{ background: "#111", color: "rgba(255,255,255,0.35)" }}>Time</th>
            {days.map((d, i) => (
              <th key={d} className="p-3 text-center font-semibold border-l border-white/5" style={{ color: "rgba(255,255,255,0.55)" }}>
                {labels[i]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeRows.map(({ startTime, endTime }) => {
            const rowKey = `${startTime}-${endTime}`;
            const timeLabel = formatCompactTimeRange(startTime, endTime);
            return (
            <tr key={rowKey} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <td className="p-3 font-mono text-[11px] sticky left-0 z-10 whitespace-nowrap" style={{ background: "#111", color: "rgba(255,255,255,0.4)" }}>{timeLabel}</td>
              {days.map((day) => {
                const hits = entries.filter(
                  (e) => e.startTime === startTime && e.endTime === endTime && e.dayOfWeek === day
                );
                return (
                  <td key={`${rowKey}-${day}`} className="p-1.5 align-top border-l border-white/5 min-w-[108px]">
                    {hits.map((h) => {
                      const cid = codeToId.get(h.courseCode.replace(/\s/g, "").toUpperCase());
                      const inner = (
                        <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <div className="font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{h.courseCode}</div>
                          <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{h.courseType} · {h.venue}</div>
                        </div>
                      );
                      return cid ? (
                        <Link key={h.id} to={`/courses/${cid}`} className="block mb-1 hover:opacity-90">
                          {inner}
                        </Link>
                      ) : (
                        <div key={h.id} className="mb-1">{inner}</div>
                      );
                    })}
                  </td>
                );
              })}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function CalendarPage() {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate,  setSelectedDate]  = useState<Date | null>(null);
  const [selectedItem,  setSelectedItem]  = useState<CalItem | null>(null);
  const [editingEvent,  setEditingEvent]  = useState<CalendarEvent | null>(null);
  const [showCreate,    setShowCreate]    = useState(false);
  const [defaultDate,   setDefaultDate]   = useState<string | undefined>();
  const [showDeleteId,  setShowDeleteId]  = useState<string | null>(null);
  const [showTimetable, setShowTimetable] = useState(true);
  const [mainView, setMainView] = useState<"calendar" | "timetable">("calendar");

  const cells      = useMemo(() => getCalendarCells(year, month), [year, month]);
  const rangeStart = dateKey(cells[0]);
  const rangeEnd   = dateKey(cells[cells.length - 1]);

  const { data: events      = [] } = useEvents(rangeStart, rangeEnd);
  const { data: assignments = [] } = useAssignments();
  const { data: tasks       = [] } = useTasks();
  const { data: semesters }        = useSemesters();
  const { data: courses }          = useCourses();
  const { data: academicEvents, fetch: fetchAcademicEvents } = useVtopAcademicEvents();
  const { data: timetable, fetch: fetchTimetable } = useVtopTimetable();

  useEffect(() => { fetchAcademicEvents(); fetchTimetable(); }, []);

  const currentSemester = useMemo(() => {
    const day = new Date();
    if (!semesters?.length) return null;
    const active = semesters.find(s => {
      const start = s.startDate ? new Date(s.startDate) : null;
      const end   = s.endDate ? new Date(s.endDate) : null;
      return start != null && end != null && day >= start && day <= end;
    });
    return active ?? [...semesters].sort((a, b) => b.year - a.year)[0];
  }, [semesters]);

  /** Courses in the active semester — used for timetable + calendar filtering. */
  const semesterCourseIds = useMemo(() => {
    if (!currentSemester) return null;
    return new Set((courses ?? []).filter(c => c.semesterId === currentSemester.id).map(c => c.id));
  }, [currentSemester, courses]);

  const coursesInSemester = useMemo(() => {
    const list = courses ?? [];
    if (!currentSemester) return list;
    return list.filter(c => c.semesterId === currentSemester.id);
  }, [currentSemester, courses]);

  const timetableInSemester = useMemo(() => {
    if (!currentSemester) return timetable;
    const codes = new Set(
      (courses ?? [])
        .filter(c => c.semesterId === currentSemester.id)
        .map(c => c.code.replace(/\s/g, "").toUpperCase())
    );
    if (codes.size === 0) return [];
    return timetable.filter(e => codes.has(e.courseCode.replace(/\s/g, "").toUpperCase()));
  }, [timetable, currentSemester, courses]);

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent(editingEvent?.id ?? "");
  const deleteEvent = useDeleteEvent();

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalItem[]>();
    function add(key: string, item: CalItem) {
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }

    const applySemester = currentSemester != null && semesterCourseIds != null;
    const semStart = currentSemester?.startDate ? new Date(currentSemester.startDate) : null;
    const semEnd   = currentSemester?.endDate ? new Date(currentSemester.endDate) : null;
    if (semStart) semStart.setHours(0, 0, 0, 0);
    if (semEnd) semEnd.setHours(0, 0, 0, 0);

    function inSemesterWallClock(iso: string): boolean {
      if (!applySemester || !semStart || !semEnd) return true;
      const d = new Date(iso.slice(0, 10));
      d.setHours(0, 0, 0, 0);
      return d >= semStart && d <= semEnd;
    }

    const codeToId = new Map<string, string>();
    coursesInSemester.forEach((c) => {
      if (c.code) codeToId.set(c.code.replace(/\s/g, "").toUpperCase(), c.id);
    });

    events.forEach(e => {
      if (applySemester) {
        if (e.courseId) {
          if (!semesterCourseIds!.has(e.courseId)) return;
        } else if (!inSemesterWallClock(e.startDate)) {
          return;
        }
      }
      const key = e.startDate.slice(0, 10);
      add(key, { id: e.id, title: e.title, dateKey: key, sortTime: new Date(e.startDate).getTime(), type: "event", eventType: e.eventType, customColor: e.color, isAllDay: e.isAllDay, time: e.isAllDay ? undefined : fmtTime(e.startDate), courseCode: e.course?.code, courseId: e.course?.id, rawEvent: e });
    });

    assignments.forEach(a => {
      if (applySemester && !semesterCourseIds!.has(a.courseId)) return;
      if (!a.dueDate) return;
      const key = a.dueDate.slice(0, 10);
      add(key, { id: a.id, title: a.title, dateKey: key, sortTime: new Date(a.dueDate).getTime(), type: "assignment", time: fmtTime(a.dueDate), courseCode: a.course?.code, courseId: a.course?.id });
    });

    tasks.forEach(t => {
      if (!t.dueDate || t.isCompleted) return;
      if (applySemester) {
        if (t.courseId) {
          if (!semesterCourseIds!.has(t.courseId)) return;
        } else if (!inSemesterWallClock(t.dueDate)) {
          return;
        }
      }
      const key = t.dueDate.slice(0, 10);
      add(key, { id: t.id, title: t.title, dateKey: key, sortTime: new Date(t.dueDate).getTime(), type: "task", courseCode: t.course?.code, courseId: t.course?.id });
    });

    academicEvents.forEach(e => {
      const key = e.date.slice(0, 10);
      const isHoliday = e.eventType.toLowerCase().includes("holiday");
      const isExam = e.eventType.toLowerCase().includes("cat") || e.eventType.toLowerCase().includes("exam") || e.eventType.toLowerCase().includes("fat");
      if (!isHoliday && !isExam) return;
      if (applySemester && !inSemesterWallClock(e.date)) return;
      add(key, { id: e.id, title: e.eventType + (e.label ? ` ${e.label}` : ""), dateKey: key, sortTime: new Date(key).getTime(), type: "event", eventType: "personal" as EventType, customColor: isHoliday ? "#10b981" : "#ef4444" });
    });

    if (showTimetable) {
      timetableInSemester.forEach(entry => {
        cells.forEach(cell => {
          if (cell.getDay() !== entry.dayOfWeek) return;
          if (cell.getMonth() !== month) return;
          const key = dateKey(cell);
          const [sh, sm] = entry.startTime.split(":").map(Number);
          const cid = codeToId.get(entry.courseCode.replace(/\s/g, "").toUpperCase());
          add(key, {
            id: `${entry.id}-${key}`,
            title: `${entry.courseCode} · ${formatCompactTimeRange(entry.startTime, entry.endTime)}`,
            dateKey: key,
            sortTime: new Date(cell).setHours(sh, sm),
            type: "event",
            eventType: "class" as EventType,
            time: `${entry.startTime} – ${entry.endTime}`,
            courseCode: entry.courseCode,
            courseId: cid,
          });
        });
      });
    }

    map.forEach((v, k) => map.set(k, v.sort((a, b) => a.sortTime - b.sortTime)));
    return map;
  }, [events, assignments, tasks, academicEvents, timetableInSemester, cells, month, showTimetable, coursesInSemester, currentSemester, semesterCourseIds]);

  const allItems = useMemo(() => [...itemsByDate.values()].flat(), [itemsByDate]);

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); setSelectedDate(null); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); setSelectedDate(null); }
  function goToday() { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelectedDate(today); }

  const selectedItems = selectedDate ? (itemsByDate.get(dateKey(selectedDate)) ?? []) : [];

  return (
    <div className="p-6 sm:p-8 w-full min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg p-0.5 border border-[#e5e7eb] bg-[#fafafa]">
            <button
              type="button"
              onClick={() => setMainView("calendar")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mainView === "calendar" ? "bg-white text-[#111] shadow-sm" : "text-[#6b7280] hover:text-[#111]"
              }`}
            >
              Calendar
            </button>
            <button
              type="button"
              onClick={() => setMainView("timetable")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                mainView === "timetable" ? "bg-white text-[#111] shadow-sm" : "text-[#6b7280] hover:text-[#111]"
              }`}
            >
              <Grid3X3 size={12} /> Timetable
            </button>
          </div>
          {mainView === "calendar" && (
            <>
              <h2 className="text-xl font-bold text-[#111] tracking-tight">{MONTHS[month]} {year}</h2>
              <div className="flex items-center gap-1">
                <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#111] hover:bg-[#f5f5f5] transition-colors"><ChevronLeft size={16} /></button>
                <button type="button" onClick={goToday} className="text-xs font-medium text-[#6b7280] hover:text-[#111] px-3 py-1.5 rounded-lg hover:bg-[#f5f5f5] transition-colors border border-[#e5e7eb]">Today</button>
                <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#111] hover:bg-[#f5f5f5] transition-colors"><ChevronRight size={16} /></button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {mainView === "calendar" && (
            <button
              type="button"
              onClick={() => setShowTimetable((t) => !t)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                showTimetable
                  ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                  : "border-neutral-700 text-neutral-500 hover:text-white hover:border-neutral-500"
              }`}
            >
              {showTimetable ? "Hide Classes" : "Show Classes"}
            </button>
          )}

          <div className="hidden md:flex items-center gap-3">
            {(["class","exam","deadline","personal","assignment","task","holiday"] as const).map(t => (
              <span key={t} className="flex items-center gap-1 text-[10px] text-[#9ca3af]">
                <span className={`w-2 h-2 rounded-full ${TYPE_STYLE[t].dot}`} />
                {TYPE_STYLE[t].label}
              </span>
            ))}
          </div>

          <Button size="sm" onClick={() => { setDefaultDate(undefined); setShowCreate(true); }}>
            <Plus size={14} /> New event
          </Button>
        </div>
      </div>

      {mainView === "timetable" ? (
        <TimetableGrid entries={timetableInSemester} courses={coursesInSemester} />
      ) : (
        <div className="flex gap-5 items-start">
          <div className="flex-1 min-w-0 rounded-xl overflow-hidden" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
            <div className="grid grid-cols-7" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {WEEKDAYS.map(d => <div key={d} className="py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {cells.map(cell => {
                const key   = dateKey(cell);
                const items = itemsByDate.get(key) ?? [];
                const inMonth = cell.getMonth() === month;
                const isSel   = selectedDate ? isSameDay(cell, selectedDate) : false;
                return <DayCell key={key} date={cell} items={items} isCurrentMonth={inMonth} isSelected={isSel} onClick={() => setSelectedDate(isSel ? null : cell)} onItemClick={item => setSelectedItem(item)} />;
              })}
            </div>
          </div>

          <div className="w-72 flex-shrink-0 hidden lg:block sticky top-6 space-y-4">
            {selectedDate ? (
              <DayPanel date={selectedDate} items={selectedItems} onItemClick={item => setSelectedItem(item)} onClose={() => setSelectedDate(null)}
                onCreateEvent={() => { setDefaultDate(dateKey(selectedDate)); setShowCreate(true); }}
              />
            ) : (
              <UpcomingSidebar items={allItems} onItemClick={item => setSelectedItem(item)} />
            )}
          </div>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New event" maxWidth={520}>
        <EventForm courses={coursesInSemester.length > 0 ? coursesInSemester : (courses ?? [])} defaultDate={defaultDate} onSubmit={async (p) => { await createEvent.mutateAsync(p); setShowCreate(false); }} onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal open={!!editingEvent} onClose={() => setEditingEvent(null)} title="Edit event" maxWidth={520}>
        {editingEvent && <EventForm initial={editingEvent} courses={coursesInSemester.length > 0 ? coursesInSemester : (courses ?? [])} onSubmit={async (p) => { await updateEvent.mutateAsync(p); setEditingEvent(null); setSelectedItem(null); }} onCancel={() => setEditingEvent(null)} />}
      </Modal>

      <Modal open={!!selectedItem} onClose={() => setSelectedItem(null)} title="" maxWidth={440}>
        {selectedItem && (
          <EventDetailModal item={selectedItem}
            onEdit={() => { if (selectedItem.rawEvent) { setEditingEvent(selectedItem.rawEvent); setSelectedItem(null); } }}
            onDelete={() => { if (selectedItem.rawEvent) setShowDeleteId(selectedItem.rawEvent.id); }}
            onClose={() => setSelectedItem(null)} deleting={deleteEvent.isPending}
          />
        )}
      </Modal>

      <Modal open={!!showDeleteId} onClose={() => setShowDeleteId(null)} title="Delete event" maxWidth={400}>
        <p className="text-sm text-[#6b7280] mb-5">Delete this event? This cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowDeleteId(null)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleteEvent.isPending}
            onClick={async () => { if (!showDeleteId) return; await deleteEvent.mutateAsync(showDeleteId); setShowDeleteId(null); setSelectedItem(null); }}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}