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
import { useTheme } from "../ThemeContext";
import type { Course } from "../hooks/api/courses";
import {
  useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent,
  type CalendarEvent, type EventType,
} from "../hooks/api/events";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function normalizeSemLabel(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

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

type ItemStyle = { dotColor: string; bg: string; text: string; border: string; label: string };

const TYPE_STYLE: Record<string, { dark: ItemStyle; light: ItemStyle }> = {
  class:      { dark: { dotColor: "#3b82f6", bg: "rgba(23,37,84,1)",     text: "#60a5fa", border: "rgba(30,58,138,1)",  label: "Class" },
                light: { dotColor: "#3b82f6", bg: "rgba(239,246,255,1)", text: "#1d4ed8", border: "rgba(191,219,254,1)", label: "Class" } },
  exam:       { dark: { dotColor: "#ef4444", bg: "rgba(254,242,242,1)",  text: "#f87171", border: "rgba(254,202,202,1)", label: "Exam" },
                light: { dotColor: "#ef4444", bg: "rgba(254,242,242,1)", text: "#dc2626", border: "rgba(254,202,202,1)", label: "Exam" } },
  deadline:   { dark: { dotColor: "#f97316", bg: "rgba(255,247,237,1)",  text: "#fb923c", border: "rgba(254,215,170,1)", label: "Deadline" },
                light: { dotColor: "#f97316", bg: "rgba(255,247,237,1)", text: "#c2410c", border: "rgba(254,215,170,1)", label: "Deadline" } },
  personal:   { dark: { dotColor: "#8b5cf6", bg: "rgba(245,243,255,1)",  text: "#a78bfa", border: "rgba(221,214,254,1)", label: "Personal" },
                light: { dotColor: "#8b5cf6", bg: "rgba(245,243,255,1)", text: "#6d28d9", border: "rgba(221,214,254,1)", label: "Personal" } },
  assignment: { dark: { dotColor: "#0ea5e9", bg: "rgba(240,249,255,1)",  text: "#38bdf8", border: "rgba(186,230,253,1)", label: "Assignment" },
                light: { dotColor: "#0ea5e9", bg: "rgba(240,249,255,1)", text: "#0369a1", border: "rgba(186,230,253,1)", label: "Assignment" } },
  task:       { dark: { dotColor: "#a855f7", bg: "rgba(250,245,255,1)",  text: "#c084fc", border: "rgba(233,213,255,1)", label: "Task" },
                light: { dotColor: "#a855f7", bg: "rgba(250,245,255,1)", text: "#7e22ce", border: "rgba(233,213,255,1)", label: "Task" } },
  holiday:    { dark: { dotColor: "#10b981", bg: "rgba(2,44,34,1)",      text: "#34d399", border: "rgba(5,150,105,1)",    label: "Holiday" },
                light: { dotColor: "#10b981", bg: "rgba(236,253,245,1)", text: "#047857", border: "rgba(167,243,208,1)", label: "Holiday" } },
  exam_vtop:  { dark: { dotColor: "#ef4444", bg: "rgba(69,10,10,1)",     text: "#f87171", border: "rgba(127,29,29,1)",    label: "Exam" },
                light: { dotColor: "#ef4444", bg: "rgba(254,242,242,1)", text: "#dc2626", border: "rgba(254,202,202,1)", label: "Exam" } },
};

function getStyle(type: "event" | "assignment" | "task", eventType?: EventType, customColor?: string | null, isDark?: boolean): ItemStyle {
  const theme = isDark ? "dark" : "light";
  const styleMap = (type === "assignment" ? TYPE_STYLE.assignment
    : type === "task" ? TYPE_STYLE.task
    : TYPE_STYLE[eventType ?? "personal"] ?? TYPE_STYLE.personal);
  const base = styleMap[theme];
  if (customColor) return { ...base, dotColor: customColor, bg: "", text: "", border: "" };
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

function EventPill({ item, onClick, isDark }: { item: CalItem; onClick: () => void; isDark: boolean }) {
  const s = getStyle(item.type, item.eventType, item.customColor, isDark);
  const dotStyle = item.customColor ? { background: item.customColor } : undefined;
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{ display: "flex", alignItems: "center", gap: 4, width: "100%", textAlign: "left", padding: "2px 6px", borderRadius: 4, fontSize: 10, background: s.bg, color: s.text, overflow: "hidden", whiteSpace: "nowrap", transition: "opacity 0.1s" }}
      className="transition-opacity hover:opacity-80"
    >
      <span style={{ ...dotStyle, background: dotStyle?.background ?? s.dotColor, width: 6, height: 6, borderRadius: "9999px", flexShrink: 0 }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{item.title}</span>
    </button>
  );
}

function DayCell({ date, items, isCurrentMonth, isSelected, onClick, onItemClick, isDark }: {
  date: Date; items: CalItem[]; isCurrentMonth: boolean; isSelected: boolean;
  onClick: () => void; onItemClick: (item: CalItem) => void; isDark: boolean;
}) {
  const today   = isToday(date);
  const visible = items.slice(0, 3);
  const overflow = items.length - 3;

  const borderColor  = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const selBg         = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)";
  const hoverBg       = isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)";
  const todayBg       = isDark ? "rgba(255,255,255,0.9)" : "#e87040";
  const todayText     = isDark ? "#0a0a0a" : "#ffffff";
  const dateText      = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const overflowText  = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
  const overflowHover = isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)";

  return (
    <div
      onClick={onClick}
      className="min-h-[96px] p-1.5 cursor-pointer transition-colors duration-100"
      style={{
        borderRight: `1px solid ${borderColor}`,
        borderBottom: `1px solid ${borderColor}`,
        background: isSelected ? selBg : "transparent",
        opacity: !isCurrentMonth ? 0.3 : 1,
      }}
      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = hoverBg; }}
      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
    >
      <div className="flex justify-end mb-1">
        <span
          className="text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full"
          style={today ? { background: todayBg, color: todayText, fontWeight: 700 } : { color: dateText }}
        >
          {date.getDate()}
        </span>
      </div>
      <div className="space-y-0.5">
        {visible.map(item => (
          <EventPill key={`${item.type}-${item.id}`} item={item} onClick={() => onItemClick(item)} isDark={isDark} />
        ))}
        {overflow > 0 && (
          <button onClick={e => { e.stopPropagation(); onClick(); }}
            className="text-[10px] pl-1.5"
            style={{ color: overflowText }}
            onMouseEnter={e => (e.currentTarget.style.color = overflowHover)}
            onMouseLeave={e => (e.currentTarget.style.color = overflowText)}
          >
            +{overflow} more
          </button>
        )}
      </div>
    </div>
  );
}

function DayPanel({ date, items, onItemClick, onClose, onCreateEvent, isDark }: {
  date: Date; items: CalItem[]; onItemClick: (item: CalItem) => void; onClose: () => void; onCreateEvent: () => void; isDark: boolean;
}) {
  const grouped: Record<CalItemType, CalItem[]> = { event: [], assignment: [], task: [] };
  items.forEach(i => grouped[i.type].push(i));
  const panelLabel = isToday(date) ? "Today" : date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const groupLabels: Record<CalItemType, string> = { event: "Events", assignment: "Assignments", task: "Tasks" };
  const iconColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
  const groupIcons: Record<CalItemType, React.ReactNode> = {
    event: <Calendar size={12} style={{ color: iconColor }} />,
    assignment: <ClipboardList size={12} style={{ color: iconColor }} />,
    task: <CheckSquare size={12} style={{ color: iconColor }} />,
  };

  const cardBg        = isDark ? "#111111" : "#ffffff";
  const cardBorder    = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const textColor     = isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)";
  const secondaryText = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
  const titleText     = isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)";
  const hoverBg       = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const badgeBg       = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const badgeText     = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const badgeBorder   = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const btnHoverCol   = isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)";

  function Group({ type, list }: { type: CalItemType; list: CalItem[] }) {
    if (!list.length) return null;
    const linkTo = type === "assignment" ? `/assignments` : type === "task" ? `/tasks` : undefined;
    return (
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          {groupIcons[type]}
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: secondaryText }}>{groupLabels[type]}</span>
        </div>
        <div className="space-y-1">
          {list.map(item => {
            const s = getStyle(item.type, item.eventType, item.customColor, isDark);
            const dotStyle = item.customColor ? { background: item.customColor } : undefined;
            return (
              <div key={`${item.type}-${item.id}`}
                className="flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer group"
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = hoverBg}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                onClick={() => onItemClick(item)}>
                <span style={{ background: dotStyle?.background ?? s.dotColor, width: 8, height: 8, borderRadius: "9999px", flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: titleText }}>{item.title}</p>
                  {item.time && <p className="text-[10px]" style={{ color: secondaryText }}>{item.time}</p>}
                  {item.courseCode && (
                    <span className="text-[9px] font-semibold rounded px-1 py-0.5" style={{ background: badgeBg, color: badgeText, border: `1px solid ${badgeBorder}` }}>
                      {item.courseCode}
                    </span>
                  )}
                </div>
                {linkTo && (
                  <Link to={linkTo} onClick={e => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: secondaryText }}>
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
    <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${cardBorder}` }}>
        <span className="text-sm font-semibold" style={{ color: textColor }}>{panelLabel}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onCreateEvent} className="p-1 rounded-lg" style={{ color: secondaryText }}
            onMouseEnter={e => (e.currentTarget.style.color = btnHoverCol)} onMouseLeave={e => (e.currentTarget.style.color = secondaryText)}>
            <Plus size={14} />
          </button>
          <button type="button" onClick={onClose} className="p-1 rounded-lg" style={{ color: secondaryText }}
            onMouseEnter={e => (e.currentTarget.style.color = btnHoverCol)} onMouseLeave={e => (e.currentTarget.style.color = secondaryText)}>
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="p-4 space-y-4" style={{ maxHeight: 400, overflowY: "auto" }}>
        {!items.length ? (
          <p className="text-xs text-center py-4" style={{ color: secondaryText }}>Nothing scheduled.</p>
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

function UpcomingSidebar({ items, onItemClick, isDark }: { items: CalItem[]; onItemClick: (item: CalItem) => void; isDark: boolean }) {
  const now    = new Date();
  const next10 = items
    .filter(i => new Date(i.dateKey) >= new Date(dateKey(now)))
    .sort((a, b) => a.sortTime - b.sortTime)
    .slice(0, 10);
  const byDate = new Map<string, CalItem[]>();
  next10.forEach(i => { if (!byDate.has(i.dateKey)) byDate.set(i.dateKey, []); byDate.get(i.dateKey)!.push(i); });

  const cardBg        = isDark ? "#111111" : "#ffffff";
  const cardBorder    = isDark ? "rgba(255,255,255,0.06)" : "#e5e7eb";
  const headerBorder  = isDark ? "rgba(255,255,255,0.06)" : "#f0f0f0";
  const textColor     = isDark ? "rgba(255,255,255,0.9)" : "#111";
  const secondaryText = isDark ? "rgba(255,255,255,0.4)" : "#9ca3af";
  const hoverBg       = isDark ? "rgba(255,255,255,0.04)" : "#f5f5f5";

  function dateLabel(key: string) {
    const d = new Date(key + "T00:00:00");
    if (isToday(d)) return "Today";
    if (isSameDay(d, new Date(Date.now() + 86400000))) return "Tomorrow";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  return (
    <div className="rounded-card overflow-hidden" style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${headerBorder}` }}>
        <span className="text-sm font-semibold" style={{ color: textColor }}>Upcoming</span>
      </div>
      <div className="p-3 max-h-[520px] overflow-y-auto space-y-4">
        {!next10.length ? (
          <p className="text-xs text-center py-6" style={{ color: secondaryText }}>Nothing coming up.</p>
        ) : (
          [...byDate.entries()].map(([key, dayItems]) => (
            <div key={key}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: secondaryText }}>{dateLabel(key)}</p>
              <div className="space-y-1">
                {dayItems.map(item => {
                  const s = getStyle(item.type, item.eventType, item.customColor, isDark);
                  return (
                    <button key={`${item.type}-${item.id}`} onClick={() => onItemClick(item)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors"
                      onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <span style={{ background: s.dotColor, width: 8, height: 8, borderRadius: "9999px", flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: textColor }}>{item.title}</p>
                        <p className="text-[10px]" style={{ color: secondaryText }}>{item.time ?? (item.isAllDay ? "All day" : "")}{item.courseCode && ` · ${item.courseCode}`}</p>
                      </div>
                      <span className="text-[9px] font-semibold border rounded-full px-1.5 py-0.5 flex-shrink-0" style={{ color: s.text, background: s.bg, borderColor: s.border }}>{s.label}</span>
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

function EventDetailModal({ item, onEdit, onDelete, onClose, deleting, isDark }: {
  item: CalItem; onEdit: () => void; onDelete: () => void; onClose: () => void; deleting: boolean; isDark: boolean;
}) {
  const s = getStyle(item.type, item.eventType, item.customColor, isDark);
  const dotStyle = item.customColor ? { background: item.customColor } : undefined;
  const ev = item.rawEvent;
  const textColor    = isDark ? "rgba(255,255,255,0.9)" : "#111";
  const secondaryText = isDark ? "rgba(255,255,255,0.4)" : "#6b7280";
  const mutedText    = isDark ? "rgba(255,255,255,0.35)" : "#9ca3af";
  const borderColor  = isDark ? "rgba(255,255,255,0.06)" : "#f0f0f0";
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span style={{ background: dotStyle?.background ?? s.dotColor, width: 12, height: 12, borderRadius: "9999px", flexShrink: 0, marginTop: 4 }} />
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold leading-tight" style={{ color: textColor }}>{item.title}</p>
          <span className="inline-block mt-1 text-[10px] font-semibold border rounded-full px-2 py-0.5" style={{ color: s.text, background: s.bg, borderColor: s.border }}>{s.label}</span>
        </div>
      </div>
      {item.time && <p className="text-sm" style={{ color: secondaryText }}>{item.time}</p>}
      {ev && (
        <div className="space-y-2 text-sm" style={{ color: secondaryText }}>
          <div className="flex items-start gap-2">
            <Calendar size={14} style={{ color: mutedText, marginTop: 2, flexShrink: 0 }} />
            <span>{ev.isAllDay ? fmtShortDate(ev.startDate) : `${fmtShortDate(ev.startDate)}, ${fmtTime(ev.startDate)} – ${fmtTime(ev.endDate)}`}</span>
          </div>
          {ev.course && <p className="text-xs" style={{ color: mutedText }}>{ev.course.name} ({ev.course.code})</p>}
          {ev.description && <p className="text-sm leading-relaxed pt-3" style={{ color: secondaryText, borderTop: `1px solid ${borderColor}` }}>{ev.description}</p>}
        </div>
      )}
      {item.type !== "event" && <p className="text-sm" style={{ color: secondaryText }}>{item.type === "assignment" ? "Assignment due" : "Task due"} — {fmtShortDate(item.dateKey)}</p>}
      <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${borderColor}` }}>
        <div className="flex items-center gap-2 flex-wrap">
          {item.courseId && (
            <Link to={`/courses/${item.courseId}`}>
              <Button variant="secondary" size="sm"><ExternalLink size={13} /> Course page</Button>
            </Link>
          )}
          {item.type === "event" && item.rawEvent && (
            <>
              <Button variant="secondary" size="sm" onClick={onEdit}><Pencil size={13} /> Edit</Button>
              <Button variant="ghost" size="sm" loading={deleting} onClick={onDelete} style={{ color: "#ef4444" }} className="hover:bg-red-50 hover:text-red-600"><Trash2 size={13} /> Delete</Button>
            </>
          )}
          {item.type === "assignment" && <Link to={`/assignments/${item.id}`}><Button variant="secondary" size="sm"><ExternalLink size={13} /> View assignment</Button></Link>}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

function courseColorFromCode(code: string, courses: Course[] | undefined): string | null {
  if (!courses) return null;
  const normalized = code.replace(/\s/g, "").toUpperCase();
  // Try exact match first
  let match = courses.find(c => c.code?.replace(/\s/g, "").toUpperCase() === normalized);
  if (!match) {
    // Try base code match (strip trailing L/P for lab matching)
    const base = normalized.replace(/[LP]$/, "");
    match = courses.find(c => c.code?.replace(/\s/g, "").toUpperCase().replace(/[LP]$/, "") === base);
  }
  return match?.color ?? null;
}

function TimetableGrid({ entries, courses, isDark }: { entries: VtopTimetableEntry[]; courses: Course[] | undefined; isDark: boolean }) {
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

  const cardBg      = isDark ? "#111111" : "#ffffff";
  const cardBorder  = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const headerBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const rowBorder   = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const stickyBg    = isDark ? "#111" : "#ffffff";
  const timeText    = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const headerText  = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
  const dayHeaderText = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)";
  const courseText  = isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)";
  const detailText  = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
  const defaultBorder = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)";

  if (!entries.length) {
    return (
      <p className="text-sm py-16 text-center rounded-xl" style={{ color: headerText, border: `1px solid ${cardBorder}` }}>
        No timetable synced yet. Run VTOP sync from the dashboard.
      </p>
    );
  }

  return (
    <div className="rounded-xl overflow-auto" style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
      <table className="w-full text-xs min-w-[720px]">
        <thead>
          <tr style={{ borderBottom: `1px solid ${headerBorder}` }}>
            <th className="text-left p-3 font-semibold sticky left-0 z-10" style={{ background: stickyBg, color: headerText }}>Time</th>
            {days.map((d, i) => (
              <th key={d} className="p-3 text-center font-semibold" style={{ color: dayHeaderText, borderLeft: `1px solid ${rowBorder}` }}>
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
            <tr key={rowKey} style={{ borderTop: `1px solid ${rowBorder}` }}>
              <td className="p-3 font-mono text-[11px] sticky left-0 z-10 whitespace-nowrap" style={{ background: stickyBg, color: timeText }}>{timeLabel}</td>
              {days.map((day) => {
                const hits = entries.filter(
                  (e) => e.startTime === startTime && e.endTime === endTime && e.dayOfWeek === day
                );
                return (
                  <td key={`${rowKey}-${day}`} className="p-1.5 align-top min-w-[108px]" style={{ borderLeft: `1px solid ${rowBorder}` }}>
                    {hits.map((h) => {
                      const cid = codeToId.get(h.courseCode.replace(/\s/g, "").toUpperCase());
                      const inner = (
                        <div className="rounded-lg p-2" style={{
                          background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                          borderLeft: `3px solid ${courseColorFromCode(h.courseCode, courses) ?? defaultBorder}`,
                        }}>
                          <div className="font-semibold" style={{ color: courseText }}>{h.courseCode}</div>
                          <div className="text-[10px]" style={{ color: detailText }}>{h.courseType} · {h.venue}</div>
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
    const byLabel = timetable.filter(e =>
      e.semesterLabel && normalizeSemLabel(e.semesterLabel) === normalizeSemLabel(currentSemester.name)
    );
    if (byLabel.length > 0) return byLabel;
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

    const holidayDateKeys = new Set<string>();
    academicEvents.forEach(e => {
      if (e.eventType.toLowerCase().includes("holiday")) {
        holidayDateKeys.add(e.date.slice(0, 10));
      }
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
          if (holidayDateKeys.has(key)) return;
          const [sh, sm] = entry.startTime.split(":").map(Number);
          const cid = codeToId.get(entry.courseCode.replace(/\s/g, "").toUpperCase());
          const courseColor = courses?.find(c =>
            c.code?.replace(/\s/g, "").toUpperCase() === entry.courseCode.replace(/\s/g, "").toUpperCase() ||
            c.code?.replace(/\s/g, "").toUpperCase().replace(/[LP]$/, "") === entry.courseCode.replace(/\s/g, "").toUpperCase().replace(/[LP]$/, "")
          )?.color ?? null;

          add(key, {
            id: `${entry.id}-${key}`,
            title: `${entry.courseCode} · ${formatCompactTimeRange(entry.startTime, entry.endTime)}`,
            dateKey: key,
            sortTime: new Date(cell).setHours(sh, sm),
            type: "event",
            eventType: "class" as EventType,
            customColor: courseColor,
            time: `${entry.startTime} – ${entry.endTime}`,
            courseCode: entry.courseCode,
            courseId: cid,
          });
        });
      });
    }

    map.forEach((v, k) => map.set(k, v.sort((a, b) => a.sortTime - b.sortTime)));
    return map;
  }, [events, assignments, tasks, academicEvents, timetableInSemester, cells, month, showTimetable, coursesInSemester, currentSemester, semesterCourseIds, courses]);

  const allItems = useMemo(() => [...itemsByDate.values()].flat(), [itemsByDate]);

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); setSelectedDate(null); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); setSelectedDate(null); }
  function goToday() { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelectedDate(today); }

  const selectedItems = selectedDate ? (itemsByDate.get(dateKey(selectedDate)) ?? []) : [];
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const tabBorder     = isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";
  const tabBg         = isDark ? "rgba(255,255,255,0.06)" : "#f4f4f5";
  const tabActiveBg   = isDark ? "#222222" : "#ffffff";
  const tabActiveText = isDark ? "rgba(255,255,255,0.9)" : "#111";
  const tabInactiveText = isDark ? "rgba(255,255,255,0.4)" : "#6b7280";
  const pageTitle     = isDark ? "rgba(255,255,255,0.9)" : "#111";
  const btnIcon       = isDark ? "rgba(255,255,255,0.4)" : "#6b7280";
  const btnIconHover  = isDark ? "rgba(255,255,255,0.8)" : "#111";
  const btnBorder     = isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";

  const toggleBg       = isDark ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.1)";
  const toggleBorder   = isDark ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.4)";
  const toggleTextOn   = isDark ? "#60a5fa" : "#2563eb";
  const toggleBorderOff = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)";
  const toggleTextOff  = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
  const toggleTextHover = isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)";
  const toggleBorderHover = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";

  const legendText   = isDark ? "rgba(255,255,255,0.4)" : "#9ca3af";

  const cardBg       = isDark ? "#111111" : "#ffffff";
  const cardBorder   = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const headerText   = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";

  const detailMuted  = isDark ? "rgba(255,255,255,0.4)" : "#6b7280";

  return (
    <div className="p-6 sm:p-8 w-full min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg p-0.5 border" style={{ borderColor: tabBorder, background: tabBg }}>
            <button
              type="button"
              onClick={() => setMainView("calendar")}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              style={{
                background: mainView === "calendar" ? tabActiveBg : "transparent",
                color: mainView === "calendar" ? tabActiveText : tabInactiveText,
                boxShadow: mainView === "calendar" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              Calendar
            </button>
            <button
              type="button"
              onClick={() => setMainView("timetable")}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1"
              style={{
                background: mainView === "timetable" ? tabActiveBg : "transparent",
                color: mainView === "timetable" ? tabActiveText : tabInactiveText,
                boxShadow: mainView === "timetable" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <Grid3X3 size={12} /> Timetable
            </button>
          </div>
          {mainView === "calendar" && (
            <>
              <h2 className="text-xl font-bold tracking-tight" style={{ color: pageTitle }}>{MONTHS[month]} {year}</h2>
              <div className="flex items-center gap-1">
                <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg transition-colors"
                  style={{ color: btnIcon }} onMouseEnter={e => (e.currentTarget.style.color = btnIconHover)} onMouseLeave={e => (e.currentTarget.style.color = btnIcon)}><ChevronLeft size={16} /></button>
                <button type="button" onClick={goToday} className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border"
                  style={{ color: btnIcon, borderColor: btnBorder }}
                  onMouseEnter={e => { e.currentTarget.style.color = btnIconHover; }} onMouseLeave={e => { e.currentTarget.style.color = btnIcon; }}>Today</button>
                <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg transition-colors"
                  style={{ color: btnIcon }} onMouseEnter={e => (e.currentTarget.style.color = btnIconHover)} onMouseLeave={e => (e.currentTarget.style.color = btnIcon)}><ChevronRight size={16} /></button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {mainView === "calendar" && (
            <button
              type="button"
              onClick={() => setShowTimetable((t) => !t)}
              className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
              style={{
                background: showTimetable ? toggleBg : "transparent",
                borderColor: showTimetable ? toggleBorder : toggleBorderOff,
                color: showTimetable ? toggleTextOn : toggleTextOff,
              }}
              onMouseEnter={e => { if (!showTimetable) { e.currentTarget.style.color = toggleTextHover; e.currentTarget.style.borderColor = toggleBorderHover; } }}
              onMouseLeave={e => { if (!showTimetable) { e.currentTarget.style.color = toggleTextOff; e.currentTarget.style.borderColor = toggleBorderOff; } }}
            >
              {showTimetable ? "Hide Classes" : "Show Classes"}
            </button>
          )}

          <div className="hidden md:flex items-center gap-3">
            {(["class","exam","deadline","personal","assignment","task","holiday"] as const).map(t => {
              const ts = TYPE_STYLE[t];
              const s = isDark ? ts.dark : ts.light;
              return (
                <span key={t} className="flex items-center gap-1 text-[10px]" style={{ color: legendText }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: s.dotColor }} />
                  {s.label}
                </span>
              );
            })}
          </div>

          <Button size="sm" onClick={() => { setDefaultDate(undefined); setShowCreate(true); }}>
            <Plus size={14} /> New event
          </Button>
        </div>
      </div>

      {mainView === "timetable" ? (
        <TimetableGrid entries={timetableInSemester} courses={coursesInSemester} isDark={isDark} />
      ) : (
        <div className="flex gap-5 items-start">
          <div className="flex-1 min-w-0 rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
            <div className="grid grid-cols-7" style={{ borderBottom: `1px solid ${cardBorder}` }}>
              {WEEKDAYS.map(d => <div key={d} className="py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: headerText }}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {cells.map(cell => {
                const key   = dateKey(cell);
                const items = itemsByDate.get(key) ?? [];
                const inMonth = cell.getMonth() === month;
                const isSel   = selectedDate ? isSameDay(cell, selectedDate) : false;
                const cellDate = cell;
                return <DayCell key={key} date={cellDate} items={items} isCurrentMonth={inMonth} isSelected={isSel} onClick={() => setSelectedDate(isSel ? null : cellDate)} onItemClick={item => setSelectedItem(item)} isDark={isDark} />;
              })}
            </div>
          </div>

          <div className="w-72 flex-shrink-0 hidden lg:block sticky top-6 space-y-4">
            {selectedDate ? (
              <DayPanel date={selectedDate} items={selectedItems} onItemClick={item => setSelectedItem(item)} onClose={() => setSelectedDate(null)}
                onCreateEvent={() => { setDefaultDate(dateKey(selectedDate)); setShowCreate(true); }}
                isDark={isDark}
              />
            ) : (
              <UpcomingSidebar items={allItems} onItemClick={item => setSelectedItem(item)} isDark={isDark} />
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
            isDark={isDark}
          />
        )}
      </Modal>

      <Modal open={!!showDeleteId} onClose={() => setShowDeleteId(null)} title="Delete event" maxWidth={400}>
        <p className="text-sm mb-5" style={{ color: detailMuted }}>Delete this event? This cannot be undone.</p>
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