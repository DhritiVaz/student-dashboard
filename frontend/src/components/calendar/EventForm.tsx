import { useState } from "react";
import { Button } from "../ui/Button";
import { FloatingInput } from "../ui/FloatingInput";
import { DateInput } from "../ui/DateInput";
import { DateTimeInput } from "../ui/DateTimeInput";
import { Select } from "../ui/Select";
import type { CalendarEvent, EventPayload, EventType } from "../../hooks/api/events";
import type { Course } from "../../hooks/api/courses";
import { isoToLocalDate, isoToLocalDatetime } from "../../lib/dateUtils";
import { toErrorString } from "../../lib/api";

interface EventFormProps {
  initial?: CalendarEvent;
  defaultDate?: string; // "YYYY-MM-DD" pre-fill from clicked date
  courses?: Course[];
  onSubmit: (payload: EventPayload) => Promise<void>;
  onCancel: () => void;
}

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "class",    label: "Class" },
  { value: "exam",     label: "Exam" },
  { value: "deadline", label: "Deadline" },
  { value: "personal", label: "Personal" },
];

const PRESET_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f97316",
  "#8b5cf6", "#ec4899", "#06b6d4", "#6b7280",
];

export function EventForm({ initial, defaultDate, courses, onSubmit, onCancel }: EventFormProps) {
  const todayDate = defaultDate ?? new Date().toISOString().slice(0, 10);

  const [title,      setTitle]      = useState(initial?.title ?? "");
  const [description, setDesc]      = useState(initial?.description ?? "");
  const [eventType,  setEventType]  = useState<EventType>(initial?.eventType ?? "personal");
  const [isAllDay,   setIsAllDay]   = useState(initial?.isAllDay ?? false);
  const [startDate,  setStartDate]  = useState(
    initial ? (isAllDay ? isoToLocalDate(initial.startDate) : isoToLocalDatetime(initial.startDate))
             : (isAllDay ? todayDate : `${todayDate}T09:00`)
  );
  const [endDate, setEndDate]       = useState(
    initial ? (isAllDay ? isoToLocalDate(initial.endDate) : isoToLocalDatetime(initial.endDate))
             : (isAllDay ? todayDate : `${todayDate}T10:00`)
  );
  const [courseId,   setCourseId]   = useState(initial?.courseId ?? "");
  const [color,      setColor]      = useState(initial?.color ?? "");
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);

  function handleAllDayToggle(checked: boolean) {
    setIsAllDay(checked);
    if (checked) {
      setStartDate(startDate.slice(0, 10));
      setEndDate(endDate.slice(0, 10));
    } else {
      setStartDate(`${startDate.slice(0, 10)}T09:00`);
      setEndDate(`${endDate.slice(0, 10)}T10:00`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) return setError("Title is required.");
    if (!startDate)    return setError("Start date is required.");
    if (!endDate)      return setError("End date is required.");

    const start = new Date(startDate);
    const end   = new Date(endDate);
    if (end < start) return setError("End date must be on or after start date.");

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        eventType,
        isAllDay,
        startDate: start.toISOString(),
        endDate:   end.toISOString(),
        ...(description.trim() && { description: description.trim() }),
        ...(courseId            && { courseId }),
        ...(color               && { color }),
      });
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
      setError(toErrorString(raw));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4">
        <FloatingInput label="Event title" value={title} onChange={setTitle} disabled={loading} />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Event type" value={eventType} onChange={e => setEventType(e.target.value as EventType)} disabled={loading}>
            {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>

          {courses && courses.length > 0 && (
            <Select label="Course (optional)" value={courseId} onChange={e => setCourseId(e.target.value)} disabled={loading}>
              <option value="">No course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          )}
        </div>

        {/* All-day toggle */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div
            onClick={() => !loading && handleAllDayToggle(!isAllDay)}
            className="w-9 h-5 rounded-full border transition-colors duration-150 flex items-center px-0.5 flex-shrink-0"
            style={isAllDay
              ? { background: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.6)" }
              : { background: "transparent", borderColor: "#444" }}
          >
            <div
              className={`w-4 h-4 rounded-full shadow transition-transform duration-150 ${isAllDay ? "translate-x-4" : "translate-x-0"}`}
              style={{ background: isAllDay ? "#0a0a0a" : "#555" }}
            />
          </div>
          <span className="text-sm text-[#6b7280]">All-day event</span>
        </label>

        {/* Date/time fields */}
        <div className="grid grid-cols-2 gap-3">
          {isAllDay ? (
            <DateInput
              label="Start date"
              value={startDate}
              onChange={setStartDate}
              disabled={loading}
            />
          ) : (
            <DateTimeInput
              label="Start"
              value={startDate}
              onChange={setStartDate}
              disabled={loading}
            />
          )}
          {isAllDay ? (
            <DateInput
              label="End date"
              value={endDate}
              onChange={setEndDate}
              disabled={loading}
            />
          ) : (
            <DateTimeInput
              label="End"
              value={endDate}
              onChange={setEndDate}
              disabled={loading}
            />
          )}
        </div>

        {/* Color picker */}
        <div>
          <p className="text-xs text-[#9ca3af] mb-2">Accent color (optional)</p>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(color === c ? "" : c)}
                aria-label={color === c ? `Color ${c}, selected` : `Select color ${c}`}
                className={`w-6 h-6 rounded-full border-2 transition-all duration-100 ${
                  color === c ? "border-[#111] scale-110" : "border-transparent hover:scale-105"
                }`}
                style={{ background: c }}
              />
            ))}
            {color && (
              <button type="button" onClick={() => setColor("")} aria-label="Clear color"
                className="text-xs text-[#9ca3af] hover:text-[#111] ml-1">clear</button>
            )}
          </div>
        </div>

        <FloatingInput label="Description (optional)" value={description} onChange={setDesc} disabled={loading} />

        {error && <p className="error-slide text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button type="submit" size="sm" loading={loading}>
            {initial ? "Save changes" : "Create event"}
          </Button>
        </div>
      </div>
    </form>
  );
}
