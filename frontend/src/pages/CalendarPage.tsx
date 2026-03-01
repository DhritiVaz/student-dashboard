import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, X, Pencil, Trash2, Calendar, ClipboardList, CheckSquare, ExternalLink } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { EventForm } from "../components/calendar/EventForm";
import { useCourses } from "../hooks/api/courses";
import { useAssignments } from "../hooks/api/assignments";
import { useTasks } from "../hooks/api/tasks";
import {
  useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent,
  type CalendarEvent, type EventType,
} from "../hooks/api/events";

// ─── Constants ────────────────────────────────────────────────────────────────
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─── Color system ─────────────────────────────────────────────────────────────
type ItemStyle = { dot: string; bg: string; text: string; border: string; label: string };

const TYPE_STYLE: Record<string, ItemStyle> = {
  class:      { dot: "bg-blue-500",   bg: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-100",    label: "Class" },
  exam:       { dot: "bg-red-500",    bg: "bg-red-50",      text: "text-red-700",     border: "border-red-100",     label: "Exam" },
  deadline:   { dot: "bg-orange-500", bg: "bg-orange-50",   text: "text-orange-700",  border: "border-orange-100",  label: "Deadline" },
  personal:   { dot: "bg-violet-500", bg: "bg-violet-50",   text: "text-violet-700",  border: "border-violet-100",  label: "Personal" },
  assignment: { dot: "bg-sky-500",    bg: "bg-sky-50",      text: "text-sky-700",     border: "border-sky-100",     label: "Assignment" },
  task:       { dot: "bg-purple-500", bg: "bg-purple-50",   text: "text-purple-700",  border: "border-purple-100",  label: "Task" },
};

function getStyle(type: "event" | "assignment" | "task", eventType?: EventType, customColor?: string | null): ItemStyle {
  if (type === "assignment") return TYPE_STYLE.assignment;
  if (type === "task")       return TYPE_STYLE.task;
  const base = TYPE_STYLE[eventType ?? "personal"];
  if (customColor) return { ...base, dot: "", bg: "", text: "", border: "" }; // color override handled inline
  return base;
}

// ─── Unified calendar item ─────────────────────────────────────────────────────
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
  rawEvent?: CalendarEvent;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
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

/** Returns all Date cells needed to fill a calendar view for a given month */
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

// ─── Dot / pill inside calendar cell ──────────────────────────────────────────
function EventPill({ item, onClick }: { item: CalItem; onClick: () => void }) {
  const s = getStyle(item.type, item.eventType, item.customColor);
  const dotStyle = item.customColor ? { background: item.customColor } : undefined;
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      className={`w-full flex items-center gap-1 text-left px-1.5 py-0.5 rounded text-[10px] truncate transition-opacity hover:opacity-80 ${s.bg} ${s.text}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotStyle ? "" : s.dot}`}
        style={dotStyle}
      />
      <span className="truncate">{item.title}</span>
    </button>
  );
}

// ─── Calendar day cell ─────────────────────────────────────────────────────────
function DayCell({
  date, items, isCurrentMonth, isSelected, onClick, onItemClick,
}: {
  date: Date;
  items: CalItem[];
  isCurrentMonth: boolean;
  isSelected: boolean;
  onClick: () => void;
  onItemClick: (item: CalItem) => void;
}) {
  const today    = isToday(date);
  const visible  = items.slice(0, 3);
  const overflow = items.length - 3;

  return (
    <div
      onClick={onClick}
      className={`min-h-[96px] p-1.5 cursor-pointer border-r border-b border-[#f0f0f0] transition-colors duration-100 ${
        isSelected ? "bg-[#f0f0f0]" : "hover:bg-[#fafafa]"
      } ${!isCurrentMonth ? "opacity-40" : ""}`}
    >
      {/* Day number */}
      <div className="flex justify-end mb-1">
        <span
          className="text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full"
          style={
            today
              ? { background: "#ffffff", color: "#0a0a0a", fontWeight: 700 }
              : isSelected
                ? { background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)" }
                : { color: "#71717a" }
          }
        >
          {date.getDate()}
        </span>
      </div>

      {/* Events */}
      <div className="space-y-0.5">
        {visible.map(item => (
          <EventPill key={`${item.type}-${item.id}`} item={item} onClick={() => onItemClick(item)} />
        ))}
        {overflow > 0 && (
          <button
            onClick={e => { e.stopPropagation(); onClick(); }}
            className="text-[10px] text-[#9ca3af] hover:text-[#111] pl-1.5 transition-colors"
          >
            +{overflow} more
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Day detail panel ──────────────────────────────────────────────────────────
function DayPanel({
  date, items, onItemClick, onClose, onCreateEvent,
}: {
  date: Date;
  items: CalItem[];
  onItemClick: (item: CalItem) => void;
  onClose: () => void;
  onCreateEvent: () => void;
}) {
  const grouped: Record<CalItemType, CalItem[]> = { event: [], assignment: [], task: [] };
  items.forEach(i => grouped[i.type].push(i));

  const label = isToday(date)
    ? "Today"
    : date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  function Group({ type, list }: { type: CalItemType; list: CalItem[] }) {
    if (!list.length) return null;
    const icons: Record<CalItemType, React.ReactNode> = {
      event:      <Calendar size={12} className="text-[#9ca3af]" />,
      assignment: <ClipboardList size={12} className="text-[#9ca3af]" />,
      task:       <CheckSquare size={12} className="text-[#9ca3af]" />,
    };
    const labels: Record<CalItemType, string> = { event: "Events", assignment: "Assignments", task: "Tasks" };
    return (
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          {icons[type]}
          <span className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">{labels[type]}</span>
        </div>
        <div className="space-y-1">
          {list.map(item => {
            const s = getStyle(item.type, item.eventType, item.customColor);
            const dotStyle = item.customColor ? { background: item.customColor } : undefined;
            const linkTo = type === "assignment" ? `/assignments/${item.id}` : type === "task" ? `/tasks` : undefined;
            return (
              <div key={`${item.type}-${item.id}`}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer group"
                onClick={() => onItemClick(item)}>
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${dotStyle ? "" : s.dot}`}
                  style={dotStyle}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#111] truncate">{item.title}</p>
                  {item.time && <p className="text-[10px] text-[#9ca3af]">{item.time}</p>}
                  {item.courseCode && (
                    <span className="text-[9px] font-semibold text-[#6b7280] bg-[#f5f5f5] border border-[#e5e7eb] rounded px-1 py-0.5">
                      {item.courseCode}
                    </span>
                  )}
                </div>
                {linkTo && (
                  <Link to={linkTo} onClick={e => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#9ca3af] hover:text-[#111]">
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
    <div className="bg-white border border-[#e5e7eb] rounded-card overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
        <span className="text-sm font-semibold text-[#111]">{label}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onCreateEvent} aria-label="Add event"
            className="p-1 rounded text-[#9ca3af] hover:text-[#111] hover:bg-[#f5f5f5] transition-colors"
            title="Add event">
            <Plus size={14} aria-hidden />
          </button>
          <button type="button" onClick={onClose} aria-label="Close"
            className="p-1 rounded text-[#9ca3af] hover:text-[#111] hover:bg-[#f5f5f5] transition-colors">
            <X size={14} aria-hidden />
          </button>
        </div>
      </div>
      <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
        {!items.length ? (
          <p className="text-xs text-[#9ca3af] text-center py-4">Nothing scheduled.</p>
        ) : (
          <>
            <Group type="event"      list={grouped.event} />
            <Group type="assignment" list={grouped.assignment} />
            <Group type="task"       list={grouped.task} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Upcoming sidebar ─────────────────────────────────────────────────────────
function UpcomingSidebar({ items, onItemClick }: { items: CalItem[]; onItemClick: (item: CalItem) => void }) {
  const now   = new Date();
  const next10 = items
    .filter(i => new Date(i.dateKey) >= new Date(dateKey(now)))
    .sort((a, b) => a.sortTime - b.sortTime)
    .slice(0, 10);

  // Group by date key for display
  const byDate = new Map<string, CalItem[]>();
  next10.forEach(i => {
    if (!byDate.has(i.dateKey)) byDate.set(i.dateKey, []);
    byDate.get(i.dateKey)!.push(i);
  });

  function dateLabel(key: string) {
    const d = new Date(key + "T00:00:00");
    if (isToday(d)) return "Today";
    if (isSameDay(d, new Date(Date.now() + 86400000))) return "Tomorrow";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-card overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div className="px-4 py-3 border-b border-[#f0f0f0]">
        <span className="text-sm font-semibold text-[#111]">Upcoming</span>
      </div>
      <div className="p-3 max-h-[520px] overflow-y-auto space-y-4">
        {!next10.length ? (
          <p className="text-xs text-[#9ca3af] text-center py-6">Nothing coming up.</p>
        ) : (
          [...byDate.entries()].map(([key, dayItems]) => (
            <div key={key}>
              <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1.5">
                {dateLabel(key)}
              </p>
              <div className="space-y-1">
                {dayItems.map(item => {
                  const s = getStyle(item.type, item.eventType, item.customColor);
                  const dotStyle = item.customColor ? { background: item.customColor } : undefined;
                  return (
                    <button key={`${item.type}-${item.id}`}
                      onClick={() => onItemClick(item)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-left hover:bg-[#f5f5f5] transition-colors">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${dotStyle ? "" : s.dot}`}
                        style={dotStyle}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#111] truncate">{item.title}</p>
                        <p className="text-[10px] text-[#9ca3af]">
                          {item.time ?? (item.isAllDay ? "All day" : "")}
                          {item.courseCode && ` · ${item.courseCode}`}
                        </p>
                      </div>
                      <span className={`text-[9px] font-semibold border rounded-full px-1.5 py-0.5 flex-shrink-0 ${s.text} ${s.bg} ${s.border}`}>
                        {s.label}
                      </span>
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

// ─── Event detail modal ────────────────────────────────────────────────────────
function EventDetailModal({
  item, onEdit, onDelete, onClose, deleting,
}: {
  item: CalItem;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  deleting: boolean;
}) {
  const s = getStyle(item.type, item.eventType, item.customColor);
  const dotStyle = item.customColor ? { background: item.customColor } : undefined;
  const ev = item.rawEvent;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span
          className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${dotStyle ? "" : s.dot}`}
          style={dotStyle}
        />
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-[#111] leading-tight">{item.title}</p>
          <span className={`inline-block mt-1 text-[10px] font-semibold border rounded-full px-2 py-0.5 ${s.text} ${s.bg} ${s.border}`}>
            {s.label}
          </span>
        </div>
      </div>

      {ev && (
        <div className="space-y-2 text-sm text-[#6b7280]">
          <div className="flex items-start gap-2">
            <Calendar size={14} className="text-[#9ca3af] mt-0.5 flex-shrink-0" />
            <span>
              {ev.isAllDay
                ? fmtShortDate(ev.startDate)
                : `${fmtShortDate(ev.startDate)}, ${fmtTime(ev.startDate)} – ${fmtTime(ev.endDate)}`}
            </span>
          </div>
          {ev.course && (
            <p className="text-xs text-[#9ca3af]">{ev.course.name} ({ev.course.code})</p>
          )}
          {ev.description && (
            <p className="text-sm text-[#6b7280] leading-relaxed border-t border-[#f0f0f0] pt-3">{ev.description}</p>
          )}
        </div>
      )}

      {item.type !== "event" && (
        <p className="text-sm text-[#6b7280]">
          {item.type === "assignment" ? "Assignment due" : "Task due"} — {fmtShortDate(item.dateKey)}
        </p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-[#f0f0f0]">
        <div className="flex items-center gap-2">
          {item.type === "event" && (
            <>
              <Button variant="secondary" size="sm" onClick={onEdit}>
                <Pencil size={13} /> Edit
              </Button>
              <Button variant="ghost" size="sm" loading={deleting} onClick={onDelete}
                className="text-red-500 hover:text-red-600 hover:bg-red-50">
                <Trash2 size={13} /> Delete
              </Button>
            </>
          )}
          {item.type === "assignment" && (
            <Link to={`/assignments/${item.id}`}>
              <Button variant="secondary" size="sm"><ExternalLink size={13} /> View assignment</Button>
            </Link>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
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

  // ── Date range for event fetching (full calendar view = includes padding days) ──
  const cells     = useMemo(() => getCalendarCells(year, month), [year, month]);
  const rangeStart = dateKey(cells[0]);
  const rangeEnd   = dateKey(cells[cells.length - 1]);

  const { data: events      = [] } = useEvents(rangeStart, rangeEnd);
  const { data: assignments = [] } = useAssignments();
  const { data: tasks       = [] } = useTasks();
  const { data: courses }          = useCourses();

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent(editingEvent?.id ?? "");
  const deleteEvent = useDeleteEvent();

  // ── Build unified item map ────────────────────────────────────────────────
  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalItem[]>();
    function add(key: string, item: CalItem) {
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }

    events.forEach(e => {
      const key = e.startDate.slice(0, 10);
      add(key, {
        id: e.id, title: e.title, dateKey: key,
        sortTime: new Date(e.startDate).getTime(),
        type: "event", eventType: e.eventType, customColor: e.color,
        isAllDay: e.isAllDay,
        time: e.isAllDay ? undefined : fmtTime(e.startDate),
        courseCode: e.course?.code,
        rawEvent: e,
      });
    });

    assignments.forEach(a => {
      if (!a.dueDate) return;
      const key = a.dueDate.slice(0, 10);
      add(key, {
        id: a.id, title: a.title, dateKey: key,
        sortTime: new Date(a.dueDate).getTime(),
        type: "assignment",
        time: fmtTime(a.dueDate),
        courseCode: a.course?.code,
      });
    });

    tasks.forEach(t => {
      if (!t.dueDate || t.isCompleted) return;
      const key = t.dueDate.slice(0, 10);
      add(key, {
        id: t.id, title: t.title, dateKey: key,
        sortTime: new Date(t.dueDate).getTime(),
        type: "task",
        courseCode: t.course?.code,
      });
    });

    // Sort each day's items by time
    map.forEach((v, k) => map.set(k, v.sort((a, b) => a.sortTime - b.sortTime)));
    return map;
  }, [events, assignments, tasks]);

  // ── All items flat (for upcoming sidebar) ─────────────────────────────────
  const allItems = useMemo(() => [...itemsByDate.values()].flat(), [itemsByDate]);

  // ── Navigation ────────────────────────────────────────────────────────────
  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  }
  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDate(today);
  }

  const selectedItems = selectedDate ? (itemsByDate.get(dateKey(selectedDate)) ?? []) : [];

  return (
    <div className="p-6 sm:p-8 w-full">
      {/* ── Header bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-[#111] tracking-tight">
            {MONTHS[month]} {year}
          </h2>
          <div className="flex items-center gap-1">
            <button type="button" onClick={prevMonth} aria-label="Previous month" className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#111] hover:bg-[#f5f5f5] transition-colors">
              <ChevronLeft size={16} aria-hidden />
            </button>
            <button type="button" onClick={goToday} aria-label="Go to today" className="text-xs font-medium text-[#6b7280] hover:text-[#111] px-3 py-1.5 rounded-lg hover:bg-[#f5f5f5] transition-colors border border-[#e5e7eb]">
              Today
            </button>
            <button type="button" onClick={nextMonth} aria-label="Next month" className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#111] hover:bg-[#f5f5f5] transition-colors">
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>
        </div>

        {/* Legend + create */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            {(["class","exam","deadline","personal","assignment","task"] as const).map(t => (
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

      {/* ── Body: grid + sidebar ──────────────────────────────────────────── */}
      <div className="flex gap-5 items-start">
        {/* Calendar grid */}
        <div className="flex-1 min-w-0 bg-white border border-[#e5e7eb] rounded-card overflow-hidden"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          {/* Week header */}
          <div className="grid grid-cols-7 border-b border-[#f0f0f0]">
            {WEEKDAYS.map(d => (
              <div key={d} className="py-2.5 text-center text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map(cell => {
              const key  = dateKey(cell);
              const items = itemsByDate.get(key) ?? [];
              const inMonth = cell.getMonth() === month;
              const isSel   = selectedDate ? isSameDay(cell, selectedDate) : false;
              return (
                <DayCell
                  key={key}
                  date={cell}
                  items={items}
                  isCurrentMonth={inMonth}
                  isSelected={isSel}
                  onClick={() => setSelectedDate(isSel ? null : cell)}
                  onItemClick={item => setSelectedItem(item)}
                />
              );
            })}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-72 flex-shrink-0 hidden lg:block sticky top-6 space-y-4">
          {selectedDate ? (
            <DayPanel
              date={selectedDate}
              items={selectedItems}
              onItemClick={item => setSelectedItem(item)}
              onClose={() => setSelectedDate(null)}
              onCreateEvent={() => {
                setDefaultDate(dateKey(selectedDate));
                setShowCreate(true);
              }}
            />
          ) : (
            <UpcomingSidebar items={allItems} onItemClick={item => setSelectedItem(item)} />
          )}
        </div>
      </div>

      {/* ── Create event modal ────────────────────────────────────────────── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New event" maxWidth={520}>
        <EventForm
          courses={courses}
          defaultDate={defaultDate}
          onSubmit={async (p) => { await createEvent.mutateAsync(p); setShowCreate(false); }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* ── Edit event modal ──────────────────────────────────────────────── */}
      <Modal open={!!editingEvent} onClose={() => setEditingEvent(null)} title="Edit event" maxWidth={520}>
        {editingEvent && (
          <EventForm
            initial={editingEvent}
            courses={courses}
            onSubmit={async (p) => {
              await updateEvent.mutateAsync(p);
              setEditingEvent(null);
              setSelectedItem(null);
            }}
            onCancel={() => setEditingEvent(null)}
          />
        )}
      </Modal>

      {/* ── Event detail modal ────────────────────────────────────────────── */}
      <Modal
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title=""
        maxWidth={440}
      >
        {selectedItem && (
          <EventDetailModal
            item={selectedItem}
            onEdit={() => {
              if (selectedItem.rawEvent) {
                setEditingEvent(selectedItem.rawEvent);
                setSelectedItem(null);
              }
            }}
            onDelete={() => {
              if (selectedItem.rawEvent) setShowDeleteId(selectedItem.rawEvent.id);
            }}
            onClose={() => setSelectedItem(null)}
            deleting={deleteEvent.isPending}
          />
        )}
      </Modal>

      {/* ── Delete event confirm ──────────────────────────────────────────── */}
      <Modal open={!!showDeleteId} onClose={() => setShowDeleteId(null)} title="Delete event" maxWidth={400}>
        <p className="text-sm text-[#6b7280] mb-5">Delete this event? This cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowDeleteId(null)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleteEvent.isPending}
            onClick={async () => {
              if (!showDeleteId) return;
              await deleteEvent.mutateAsync(showDeleteId);
              setShowDeleteId(null);
              setSelectedItem(null);
            }}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
