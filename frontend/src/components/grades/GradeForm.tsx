import { useState } from "react";
import { Button } from "../ui/Button";
import { FloatingInput } from "../ui/FloatingInput";
import type { Grade } from "../../hooks/api/grades";

interface GradeFormProps {
  initial?: Grade;
  assignmentId: string;
  onSubmit: (payload: { score: number; maxScore: number; feedback?: string; assignmentId: string }) => Promise<void>;
  onCancel: () => void;
}

export function GradeForm({ initial, assignmentId, onSubmit, onCancel }: GradeFormProps) {
  const [score, setScore]       = useState(initial?.score != null ? String(initial.score) : "");
  const [maxScore, setMaxScore] = useState(initial?.maxScore != null ? String(initial.maxScore) : "100");
  const [feedback, setFeedback] = useState(initial?.feedback ?? "");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const scoreNum   = parseFloat(score);
  const maxNum     = parseFloat(maxScore);
  const pct        = !isNaN(scoreNum) && !isNaN(maxNum) && maxNum > 0 ? (scoreNum / maxNum) * 100 : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (isNaN(scoreNum))               return setError("Score is required.");
    if (isNaN(maxNum) || maxNum <= 0)  return setError("Max score must be greater than 0.");
    if (scoreNum < 0)                  return setError("Score cannot be negative.");
    if (scoreNum > maxNum)             return setError("Score cannot exceed max score.");

    setLoading(true);
    try {
      await onSubmit({
        score: scoreNum,
        maxScore: maxNum,
        assignmentId,
        ...(feedback.trim() && { feedback: feedback.trim() }),
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
        <div className="grid grid-cols-2 gap-3">
          <FloatingInput label="Score" type="number" value={score} onChange={setScore} disabled={loading} />
          <FloatingInput label="Max score" type="number" value={maxScore} onChange={setMaxScore} disabled={loading} />
        </div>

        {/* Live preview */}
        {pct !== null && (
          <div
            className="rounded-input px-4 py-3 flex items-center justify-between"
            style={{ background: "#1e1e1e", border: "1px solid #333" }}
          >
            <span className="text-sm font-semibold" style={{ color: "#f0f0f0" }}>{scoreNum} / {maxNum}</span>
            <span className="text-sm" style={{ color: "#a1a1aa" }}>{pct.toFixed(1)}%</span>
          </div>
        )}

        {/* Feedback textarea */}
        <div className="relative">
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            disabled={loading}
            placeholder="Feedback (optional)"
            rows={3}
            className="w-full rounded-input px-4 py-3 text-sm outline-none resize-none transition-all duration-150 disabled:opacity-50 placeholder:text-[#71717a]"
            style={{
              background: "#1e1e1e",
              border: "1px solid #333",
              color: "#f0f0f0",
              colorScheme: "dark",
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,255,255,0.06)";
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = "#333";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {error && <p className="error-slide text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button type="submit" size="sm" loading={loading}>
            {initial ? "Update grade" : "Add grade"}
          </Button>
        </div>
      </div>
    </form>
  );
}
