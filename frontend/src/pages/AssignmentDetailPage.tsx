import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Calendar, Percent, BarChart2,
  Plus, Pencil, Trash2, AlertCircle,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { AssignmentForm } from "../components/assignments/AssignmentForm";
import { GradeForm } from "../components/grades/GradeForm";
import { useToast } from "../hooks/useToast";
import { useCourse } from "../hooks/api/courses";
import {
  useAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
  deriveStatus,
} from "../hooks/api/assignments";
import {
  useGrades,
  useCreateGrade,
  useUpdateGrade,
  useDeleteGrade,
  letterGrade,
  type Grade,
} from "../hooks/api/grades";

function StatusBadge({ status }: { status: "submitted" | "overdue" | "pending" }) {
  if (status === "submitted") return (
    <span className="text-xs font-semibold text-[#10b981] bg-[#f0fdf4] border border-[#bbf7d0] rounded-full px-3 py-1">
      Submitted
    </span>
  );
  if (status === "overdue") return (
    <span className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 rounded-full px-3 py-1">
      Overdue
    </span>
  );
  return (
    <span className="text-xs font-semibold text-[#9ca3af] bg-[#f5f5f5] border border-[#e5e7eb] rounded-full px-3 py-1">
      Pending
    </span>
  );
}

function LetterBadge({ letter }: { letter: string }) {
  const colors: Record<string, string> = {
    A: "text-[#10b981] bg-[#f0fdf4] border-[#bbf7d0]",
    B: "text-[#3b82f6] bg-[#eff6ff] border-[#bfdbfe]",
    C: "text-[#f59e0b] bg-[#fffbeb] border-[#fde68a]",
    D: "text-[#f97316] bg-[#fff7ed] border-[#fed7aa]",
    F: "text-red-500 bg-red-50 border-red-100",
  };
  return (
    <span className={`text-xs font-bold border rounded-md px-2 py-0.5 flex-shrink-0 ${colors[letter] ?? colors.F}`}>
      {letter}
    </span>
  );
}

function GradeCard({
  grade,
  onEdit,
  onDelete,
  deleting,
}: {
  grade: Grade;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const pct    = (grade.score / grade.maxScore) * 100;
  const letter = letterGrade(pct);

  return (
    <div className="pt-1">
      {/* Score display */}
      <div className="flex items-end justify-between gap-3 mb-2">
        <div>
          <p className="text-xl font-bold text-[#111] tracking-tight">
            {grade.score}
            <span className="text-base font-medium text-[#9ca3af] ml-0.5">/ {grade.maxScore}</span>
          </p>
          <p className="text-xs text-[#6b7280] mt-0.5">{pct.toFixed(1)}%</p>
        </div>
        <LetterBadge letter={letter} />
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-[#f0f0f0] rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(pct, 100)}%`, background: "rgba(255,255,255,0.75)" }}
        />
      </div>

      {/* Feedback */}
      {grade.feedback && (
        <blockquote className="text-xs text-[#6b7280] border-l-2 border-[#e5e7eb] pl-2.5 italic mb-3">
          "{grade.feedback}"
        </blockquote>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-[#f0f0f0]">
        <Button variant="secondary" size="sm" onClick={onEdit}>
          <Pencil size={13} /> Edit grade
        </Button>
        <Button variant="ghost" size="sm" loading={deleting} onClick={onDelete}
          className="text-red-500 hover:text-red-600 hover:bg-red-50">
          <Trash2 size={13} /> Remove
        </Button>
      </div>
    </div>
  );
}

export default function AssignmentDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const toast     = useToast();

  const { data: assignment, isLoading: loadingA } = useAssignment(id!);
  const { data: course }                          = useCourse(assignment?.courseId ?? "");
  const { data: grades, isLoading: loadingG }     = useGrades(id!);

  const updateAssignment = useUpdateAssignment(id!);
  const deleteAssignment = useDeleteAssignment();

  const createGrade = useCreateGrade(assignment?.courseId);
  const updateGrade = useUpdateGrade(assignment?.courseId);
  const deleteGrade = useDeleteGrade(assignment?.courseId);

  const [editingAssignment, setEditingAssignment] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState(false);
  const [showAddGrade, setShowAddGrade]           = useState(false);
  const [editingGrade, setEditingGrade]           = useState<Grade | null>(null);
  const [deletingGradeId, setDeletingGradeId]     = useState<string | null>(null);

  if (loadingA) return (
    <div className="p-6 sm:p-8 w-full min-w-0">
      <div className="w-24 h-5 bg-[#f0f0f0] rounded animate-pulse mb-8" />
      <div className="h-40 bg-[#f0f0f0] rounded-card animate-pulse mb-4" />
      <div className="h-48 bg-[#f0f0f0] rounded-card animate-pulse" />
    </div>
  );

  if (!assignment) return (
    <div className="p-6 sm:p-8 w-full min-w-0">
      <div className="flex items-center gap-3 text-sm text-[#9ca3af] mb-8">
        <AlertCircle size={16} />
        <span>Assignment not found.</span>
        <button onClick={() => navigate("/assignments")} className="text-[#111] hover:underline">
          Back to assignments
        </button>
      </div>
    </div>
  );

  const uiStatus   = deriveStatus(assignment);
  const gradeList  = grades ?? [];
  const firstGrade = gradeList[0] ?? null;

  const dueFormatted = assignment.dueDate
    ? new Date(assignment.dueDate).toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <div className="p-6 sm:p-8 w-full min-w-0">
      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-[#9ca3af] hover:text-[#111] transition-colors mb-6"
      >
        <ArrowLeft size={13} /> Back
      </button>

      {/* ─── Assignment header card ─────────────────────────────── */}
      <div className="bg-white border border-[#e5e7eb] rounded-card p-6 mb-4"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-[#111] tracking-tight leading-snug">
              {assignment.title}
            </h1>
            {course && (
              <Link
                to={`/courses/${course.id}`}
                className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-[#6b7280] bg-[#f5f5f5] border border-[#e5e7eb] rounded-md px-1.5 py-0.5 tracking-wide hover:bg-[#ebebeb] transition-colors"
                onClick={e => e.stopPropagation()}
              >
                {course.code} · {course.name}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={uiStatus} />
            <button
              onClick={() => setEditingAssignment(true)}
              className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#111] hover:bg-[#f5f5f5] transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => setDeletingAssignment(true)}
              className="group/btn p-1.5 rounded-lg text-[#9ca3af] hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} className="text-inherit group-hover/btn:text-red-500" />
            </button>
          </div>
        </div>

        {assignment.description && (
          <p className="text-sm text-[#6b7280] mb-4 leading-relaxed">{assignment.description}</p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {dueFormatted && (
            <span className="flex items-center gap-1.5 text-xs text-[#6b7280]">
              <Calendar size={13} className="text-[#9ca3af]" /> {dueFormatted}
            </span>
          )}
          {assignment.weight > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-[#6b7280]">
              <Percent size={12} className="text-[#9ca3af]" /> {assignment.weight}% of final grade
            </span>
          )}
        </div>
      </div>

      {/* ─── Grade section ──────────────────────────────────────── */}
      <div className="bg-white border border-[#e5e7eb] rounded-card p-5"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-[#9ca3af]" strokeWidth={1.8} />
            <h2 className="text-sm font-semibold text-[#111]">Grade</h2>
          </div>
        </div>

        {loadingG && (
          <div className="h-24 bg-[#f0f0f0] rounded-card animate-pulse" />
        )}

        {!loadingG && !firstGrade && (
          <div className="text-center py-6">
            <div className="w-10 h-10 rounded-full bg-[#f5f5f5] border border-[#e5e7eb] flex items-center justify-center mx-auto mb-3">
              <BarChart2 size={16} className="text-[#9ca3af]" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-[#6b7280] mb-4">No grade recorded yet.</p>
            <Button variant="secondary" size="sm" onClick={() => setShowAddGrade(true)}>
              <Plus size={13} /> Add grade
            </Button>
          </div>
        )}

        {!loadingG && firstGrade && (
          <GradeCard
            grade={firstGrade}
            onEdit={() => setEditingGrade(firstGrade)}
            onDelete={() => setDeletingGradeId(firstGrade.id)}
            deleting={deleteGrade.isPending}
          />
        )}
      </div>

      {/* ─── Modals ─────────────────────────────────────────────── */}

      {/* Edit assignment */}
      <Modal open={editingAssignment} onClose={() => setEditingAssignment(false)} title="Edit assignment">
        <AssignmentForm
          initial={assignment}
          onSubmit={async (p) => {
            await updateAssignment.mutateAsync(p);
            setEditingAssignment(false);
            toast.success("Assignment updated.");
          }}
          onCancel={() => setEditingAssignment(false)}
        />
      </Modal>

      {/* Delete assignment */}
      <Modal open={deletingAssignment} onClose={() => setDeletingAssignment(false)} title="Delete assignment" maxWidth={400}>
        <p className="text-sm text-[#6b7280] mb-5">
          Delete <strong>{assignment.title}</strong>? This will also remove any recorded grades.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDeletingAssignment(false)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleteAssignment.isPending}
            onClick={async () => {
              try {
                await deleteAssignment.mutateAsync({ id: assignment.id, courseId: assignment.courseId });
                toast.success("Assignment deleted.");
                navigate("/assignments");
              } catch {
                toast.error("Failed to delete assignment.");
              }
            }}>Delete</Button>
        </div>
      </Modal>

      {/* Add grade */}
      <Modal open={showAddGrade} onClose={() => setShowAddGrade(false)} title="Add grade">
        <GradeForm
          assignmentId={id!}
          onSubmit={async (p) => {
            await createGrade.mutateAsync(p);
            setShowAddGrade(false);
            toast.success("Grade saved.");
          }}
          onCancel={() => setShowAddGrade(false)}
        />
      </Modal>

      {/* Edit grade */}
      <Modal open={!!editingGrade} onClose={() => setEditingGrade(null)} title="Edit grade">
        {editingGrade && (
          <GradeForm
            initial={editingGrade}
            assignmentId={id!}
            onSubmit={async (p) => {
              await updateGrade.mutateAsync({ id: editingGrade.id, payload: { score: p.score, maxScore: p.maxScore, feedback: p.feedback } });
              setEditingGrade(null);
              toast.success("Grade updated.");
            }}
            onCancel={() => setEditingGrade(null)}
          />
        )}
      </Modal>

      {/* Delete grade */}
      <Modal open={!!deletingGradeId} onClose={() => setDeletingGradeId(null)} title="Remove grade" maxWidth={400}>
        <p className="text-sm text-[#6b7280] mb-5">Remove the grade for this assignment?</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDeletingGradeId(null)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleteGrade.isPending}
            onClick={async () => {
              if (!deletingGradeId) return;
              try {
                await deleteGrade.mutateAsync({ gradeId: deletingGradeId, assignmentId: id! });
                setDeletingGradeId(null);
                toast.success("Grade removed.");
              } catch {
                toast.error("Failed to remove grade.");
              }
            }}>Remove</Button>
        </div>
      </Modal>
    </div>
  );
}
