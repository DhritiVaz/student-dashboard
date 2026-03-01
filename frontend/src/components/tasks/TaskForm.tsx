import { useState } from "react";
import { Button } from "../ui/Button";
import { FloatingInput } from "../ui/FloatingInput";
import { DateTimeInput } from "../ui/DateTimeInput";
import { Select } from "../ui/Select";
import type { Task, TaskPayload, Priority } from "../../hooks/api/tasks";
import type { Course } from "../../hooks/api/courses";
import { isoToLocalDatetime } from "../../lib/dateUtils";

interface TaskFormProps {
  initial?: Task;
  courses?: Course[];
  onSubmit: (payload: TaskPayload) => Promise<void>;
  onCancel: () => void;
}

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "low",    label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high",   label: "High" },
];

export function TaskForm({ initial, courses, onSubmit, onCancel }: TaskFormProps) {
  const [title,       setTitle]       = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [dueDate,     setDueDate]     = useState(isoToLocalDatetime(initial?.dueDate) || "");
  const [priority,    setPriority]    = useState<Priority>((initial?.priority ?? "medium").toLowerCase() as Priority);
  const [courseId,    setCourseId]    = useState(initial?.courseId ?? "");
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) return setError("Title is required.");
    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        priority,
        ...(description.trim() && { description: description.trim() }),
        ...(dueDate             && { dueDate: new Date(dueDate).toISOString() }),
        ...(courseId            && { courseId }),
      });
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
      const msg = typeof raw === "string" ? raw : (raw && typeof raw === "object" && !Array.isArray(raw)
        ? (Object.values(raw).flat().filter(Boolean) as string[]).join(" ") || "Something went wrong."
        : "Something went wrong.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      <div className="space-y-4 w-full">
        <FloatingInput label="Task title" value={title} onChange={setTitle} disabled={loading} />
        <FloatingInput label="Description (optional)" value={description} onChange={setDescription} disabled={loading} />

        <div className="grid grid-cols-2 gap-4 items-end w-full min-w-0">
          <div className="min-w-0 w-full [&_input]:min-h-[48px]">
            <DateTimeInput label="Due date & time" value={dueDate} onChange={setDueDate} disabled={loading} />
          </div>
          <div className="min-w-0 w-full [&_button]:min-h-[48px]">
            <Select label="Priority" value={priority} onChange={e => setPriority(e.target.value as Priority)} disabled={loading}>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </Select>
          </div>
        </div>

        {courses && courses.length > 0 && (
          <Select label="Course (optional)" value={courseId} onChange={e => setCourseId(e.target.value)} disabled={loading}>
            <option value="">No course</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </Select>
        )}

        {error && <p className="error-slide text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button type="submit" size="sm" loading={loading}>
            {initial ? "Save changes" : "Create task"}
          </Button>
        </div>
      </div>
    </form>
  );
}
