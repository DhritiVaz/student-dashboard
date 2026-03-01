import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, GraduationCap, BookOpen } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { SkeletonList } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { AnimatedList } from "../components/AnimatedList";
import { SemesterForm } from "../components/semesters/SemesterForm";
import { useToast } from "../hooks/useToast";
import {
  useSemesters,
  useCreateSemester,
  useUpdateSemester,
  useDeleteSemester,
  type Semester,
} from "../hooks/api/semesters";

function formatDate(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function SemesterCard({
  semester,
  onEdit,
  onDelete,
}: {
  semester: Semester;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const courseCount = semester._count?.courses ?? semester.courses?.length ?? 0;

  return (
    <div
      className="group card-hover bg-white border border-[#e5e7eb] rounded-card p-5 cursor-pointer
                 hover:border-[#d1d5db] flex flex-col gap-4"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
      onClick={() => navigate(`/semesters/${semester.id}`)}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-[#111] text-sm leading-tight truncate">{semester.name}</p>
          <p className="text-xs text-[#9ca3af] mt-0.5">{semester.year}</p>
        </div>
        {/* Action buttons */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onEdit}
            aria-label="Edit semester"
            className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#111] hover:bg-[#f5f5f5] transition-colors"
          >
            <Pencil size={13} aria-hidden />
          </button>
          <button
            onClick={onDelete}
            aria-label="Delete semester"
            className="group/btn p-1.5 rounded-lg text-[#9ca3af] hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} aria-hidden className="text-inherit group-hover/btn:text-red-500" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-[#6b7280]">
        <span className="flex items-center gap-1.5">
          <BookOpen size={12} className="text-[#9ca3af]" />
          {courseCount} {courseCount === 1 ? "course" : "courses"}
        </span>
        {(semester.startDate || semester.endDate) && (
          <span className="text-[#9ca3af]">
            {formatDate(semester.startDate)}
            {semester.startDate && semester.endDate && " → "}
            {formatDate(semester.endDate)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function SemestersPage() {
  const toast = useToast();
  const { data: semesters, isLoading } = useSemesters();
  const createMutation = useCreateSemester();
  const deleteMutation = useDeleteSemester();

  const [showCreate, setShowCreate]     = useState(false);
  const [editing, setEditing]           = useState<Semester | null>(null);
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  // Per-card update mutation — key changes when editing changes
  const updateMutation = useUpdateSemester(editing?.id ?? "");

  async function handleCreate(payload: Parameters<typeof createMutation.mutateAsync>[0]) {
    await createMutation.mutateAsync(payload);
    setShowCreate(false);
    toast.success("Semester created.");
  }

  async function handleUpdate(payload: Parameters<typeof updateMutation.mutateAsync>[0]) {
    await updateMutation.mutateAsync(payload);
    setEditing(null);
    toast.success("Semester updated.");
  }

  async function handleDelete() {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      setDeletingId(null);
      toast.success("Semester deleted.");
    } catch {
      toast.error("Failed to delete semester.");
    }
  }

  return (
    <div className="p-6 sm:p-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-[#111] tracking-tight">Semesters</h2>
          <p className="text-sm text-[#9ca3af] mt-0.5">
            {semesters?.length ?? 0} semester{semesters?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> New semester
        </Button>
      </div>

      {/* Loading */}
      {isLoading && <SkeletonList count={6} layout="grid" cardHeight={112} />}

      {/* Empty state */}
      {!isLoading && semesters?.length === 0 && (
        <EmptyState
          icon={<GraduationCap size={18} className="text-[#9ca3af]" strokeWidth={1.6} />}
          title="No semesters yet"
          description="Add your first semester to get started."
        />
      )}

      {/* Grid */}
      {!isLoading && (semesters?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatedList staggerDelay={50} animateOnlyOnce>
            {semesters!.map((s) => (
              <SemesterCard
                key={s.id}
                semester={s}
                onEdit={() => setEditing(s)}
                onDelete={() => setDeletingId(s.id)}
              />
            ))}
          </AnimatedList>
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New semester">
        <SemesterForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit semester">
        {editing && (
          <SemesterForm
            initial={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deletingId} onClose={() => setDeletingId(null)} title="Delete semester" maxWidth={400}>
        <p className="text-sm text-[#6b7280] mb-5">
          This will permanently delete the semester and all its courses. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDeletingId(null)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleteMutation.isPending} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
