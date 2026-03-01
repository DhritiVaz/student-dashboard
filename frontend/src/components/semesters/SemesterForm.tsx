import { useState } from "react";
import { Button } from "../ui/Button";
import { FloatingInput } from "../ui/FloatingInput";
import { DateInput } from "../ui/DateInput";
import type { Semester, SemesterPayload } from "../../hooks/api/semesters";
import { isoToLocalDate } from "../../lib/dateUtils";

interface SemesterFormProps {
  initial?: Semester;
  onSubmit: (payload: SemesterPayload) => Promise<void>;
  onCancel: () => void;
}

export function SemesterForm({ initial, onSubmit, onCancel }: SemesterFormProps) {
  const [name, setName]           = useState(initial?.name ?? "");
  const [year, setYear]           = useState(String(initial?.year ?? new Date().getFullYear()));
  const [startDate, setStartDate] = useState(isoToLocalDate(initial?.startDate));
  const [endDate, setEndDate]     = useState(isoToLocalDate(initial?.endDate));
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Name is required.");
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) return setError("Enter a valid year.");
    if (startDate && endDate && endDate < startDate) return setError("End date must be after start date.");

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        year: yearNum,
        ...(startDate && { startDate: new Date(startDate).toISOString() }),
        ...(endDate   && { endDate:   new Date(endDate).toISOString() }),
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
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4">
        <FloatingInput label="Semester name" value={name} onChange={setName} disabled={loading} />
        <FloatingInput label="Year" type="number" value={year} onChange={setYear} disabled={loading} />
        <div className="grid grid-cols-2 gap-3">
          <DateInput label="Start date" value={startDate} onChange={setStartDate} disabled={loading} />
          <DateInput label="End date" value={endDate} onChange={setEndDate} disabled={loading} />
        </div>

        {error && (
          <p className="error-slide text-xs text-red-500">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button type="submit" size="sm" loading={loading}>
            {initial ? "Save changes" : "Create semester"}
          </Button>
        </div>
      </div>
    </form>
  );
}
