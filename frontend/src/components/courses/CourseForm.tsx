import { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { FloatingInput } from "../ui/FloatingInput";
import { Select } from "../ui/Select";
import type { Course, CoursePayload } from "../../hooks/api/courses";
import type { Semester } from "../../hooks/api/semesters";

interface CourseFormProps {
  initial?: Course;
  semesters?: Pick<Semester, "id" | "name" | "year">[];
  defaultSemesterId?: string;
  onSubmit: (payload: CoursePayload) => Promise<void>;
  onCancel: () => void;
}

export function CourseForm({ initial, semesters, defaultSemesterId, onSubmit, onCancel }: CourseFormProps) {
  const [name, setName]           = useState(initial?.name ?? "");
  const [code, setCode]           = useState(initial?.code ?? "");
  const [credits, setCredits]     = useState(String(initial?.credits ?? "3"));
  const [professor, setProfessor] = useState(initial?.professor ?? initial?.instructor ?? "");
  const [description, setDesc]    = useState(initial?.description ?? "");
  const [semesterId, setSemesterId] = useState(
    initial?.semesterId ?? defaultSemesterId ?? semesters?.[0]?.id ?? ""
  );
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  // Sync form when initial changes (e.g. switching between courses in edit modal)
  useEffect(() => {
    if (initial) {
      setName(initial.name ?? "");
      setCode(initial.code ?? "");
      setCredits(String(initial.credits ?? "3"));
      setProfessor(initial.professor ?? initial.instructor ?? "");
      setDesc(initial.description ?? "");
      setSemesterId(initial.semesterId ?? "");
    }
  }, [initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Course name is required.");
    if (!code.trim()) return setError("Course code is required.");
    const creditsNum = parseFloat(credits);
    if (isNaN(creditsNum) || creditsNum < 0 || creditsNum > 20) return setError("Credits must be 0–20.");
    if (!semesterId) return setError("Please select a semester.");

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        code: code.trim(),
        credits: creditsNum,
        semesterId,
        instructor: professor.trim(),
        description: description.trim(),
      });
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
      const msg = typeof raw === "string"
        ? raw
        : raw && typeof raw === "object" && !Array.isArray(raw)
          ? (Object.values(raw).flat().filter(Boolean) as string[]).join(" ") || "Something went wrong."
          : "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4">
        <FloatingInput label="Course name" value={name} onChange={setName} disabled={loading} />

        <div className="grid grid-cols-2 gap-3">
          <FloatingInput label="Code" value={code} onChange={setCode} disabled={loading} />
          <FloatingInput label="Credits" type="number" value={credits} onChange={setCredits} disabled={loading} />
        </div>

        <FloatingInput label="Professor (optional)" value={professor} onChange={setProfessor} disabled={loading} />
        <FloatingInput label="Description (optional)" value={description} onChange={setDesc} disabled={loading} />

        {/* Semester selector — shown only when list is provided and not locked */}
        {semesters && semesters.length > 0 && !defaultSemesterId && (
          <Select
            label="Semester"
            value={semesterId}
            onChange={(e) => setSemesterId(e.target.value)}
            disabled={loading}
          >
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>{s.name}{s.year != null ? ` (${s.year})` : ""}</option>
            ))}
          </Select>
        )}

        {error && <p className="error-slide text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button type="submit" size="sm" loading={loading}>
            {initial ? "Save changes" : "Create course"}
          </Button>
        </div>
      </div>
    </form>
  );
}
