import { useState } from "react";
import { Button } from "../ui/Button";
import { FloatingInput } from "../ui/FloatingInput";
import { DateTimeInput } from "../ui/DateTimeInput";
import { Select } from "../ui/Select";
import type { Assignment, AssignmentPayload } from "../../hooks/api/assignments";
import type { Course } from "../../hooks/api/courses";
import { isoToLocalDatetime } from "../../lib/dateUtils";

interface AssignmentFormProps {
  initial?: Assignment;
  courses?: Course[];
  defaultCourseId?: string;
  onSubmit: (payload: AssignmentPayload) => Promise<void>;
  onCancel: () => void;
}

export function AssignmentForm({
  initial, courses, defaultCourseId, onSubmit, onCancel,
}: AssignmentFormProps) {
  const [title, setTitle]           = useState(initial?.title ?? "");
  const [description, setDesc]      = useState(initial?.description ?? "");
  const [dueDate, setDueDate]       = useState(isoToLocalDatetime(initial?.dueDate));
  const [weight, setWeight]         = useState(String(initial?.weight ?? "0"));
  const [isSubmitted, setSubmitted] = useState(initial?.isSubmitted ?? false);
  const [courseId, setCourseId]     = useState(
    initial?.courseId ?? defaultCourseId ?? courses?.[0]?.id ?? ""
  );
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) return setError("Title is required.");
    const w = parseFloat(weight);
    if (isNaN(w) || w < 0 || w > 100) return setError("Weight must be 0–100.");
    if (!courseId) return setError("Please select a course.");

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        courseId,
        weight: w,
        isSubmitted,
        ...(description && { description: description.trim() }),
        ...(dueDate     && { dueDate: new Date(dueDate).toISOString() }),
      });
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      <div className="space-y-4 w-full">
        <FloatingInput label="Assignment title" value={title} onChange={setTitle} disabled={loading} />
        <FloatingInput label="Description (optional)" value={description} onChange={setDesc} disabled={loading} />

        <div className="grid grid-cols-[1fr_1fr] gap-4 w-full min-w-0 items-stretch">
          <div className="min-w-0 w-full [&_input]:min-h-[48px]">
            <DateTimeInput label="Due date & time" value={dueDate} onChange={setDueDate} disabled={loading} />
          </div>
          <div className="min-w-0 w-full [&_input]:min-h-[54px]">
            <FloatingInput label="Weight (%)" type="number" value={weight} onChange={setWeight} disabled={loading} />
          </div>
        </div>

        {/* Course selector */}
        {courses && courses.length > 0 && !defaultCourseId && (
          <Select label="Course" value={courseId} onChange={e => setCourseId(e.target.value)} disabled={loading}>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </Select>
        )}

        {/* Submitted toggle */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div
            onClick={() => !loading && setSubmitted(v => !v)}
            className="w-9 h-5 rounded-full border transition-colors duration-150 flex items-center px-0.5 flex-shrink-0"
            style={isSubmitted
              ? { background: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.6)" }
              : { background: "transparent", borderColor: "#444" }}
          >
            <div
              className={`w-4 h-4 rounded-full shadow transition-transform duration-150 ${
                isSubmitted ? "translate-x-4" : "translate-x-0"
              }`}
              style={{ background: isSubmitted ? "#0a0a0a" : "#555" }}
            />
          </div>
          <span className="text-sm text-[#6b7280]">Mark as submitted</span>
        </label>

        {error && <p className="error-slide text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button type="submit" size="sm" loading={loading}>
            {initial ? "Save changes" : "Create assignment"}
          </Button>
        </div>
      </div>
    </form>
  );
}
