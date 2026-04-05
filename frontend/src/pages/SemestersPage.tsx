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
import { useTheme } from "../ThemeContext";
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
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const courseCount = semester._count?.courses ?? semester.courses?.length ?? 0;

  return (
    <div
      className="group card-hover rounded-card p-5 cursor-pointer flex flex-col gap-4"
      style={{
        background: isDark ? "#141414" : "#ffffff",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.05)",
      }}
      onClick={() => navigate(`/semesters/${semester.id}`)}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight truncate" style={{ color: isDark ? "#f0f0f0" : "#111" }}>{semester.name}</p>
          <p className="text-xs mt-0.5" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}>{semester.year}</p>
        </div>
        {/* Action buttons */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onEdit}
            aria-label="Edit semester"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = isDark ? "#f0f0f0" : "#111"; (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.05)" : "#f5f5f5"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = isDark ? "rgba(255,255,255,0.4)" : "#9ca3af"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <Pencil size={13} aria-hidden />
          </button>
          <button
            onClick={onDelete}
            aria-label="Delete semester"
            className="group/btn p-1.5 rounded-lg transition-colors"
            style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f87171"; (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(248,113,113,0.1)" : "#fef2f2"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = isDark ? "rgba(255,255,255,0.4)" : "#9ca3af"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <Trash2 size={13} aria-hidden />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs" style={{ color: isDark ? "rgba(255,255,255,0.45)" : "#6b7280" }}>
        <span className="flex items-center gap-1.5">
          <BookOpen size={12} style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }} />
          {courseCount} {courseCount === 1 ? "course" : "courses"}
        </span>
        {(semester.startDate || semester.endDate) && (
          <span style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}>
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
  const { theme } = useTheme();
  const isDark = theme === "dark";
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
    <div className="p-6 sm:p-8 w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: isDark ? "#f0f0f0" : "#111" }}>Semesters</h2>
          <p className="text-sm mt-0.5" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}>
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
        <p className="text-sm mb-5" style={{ color: isDark ? "rgba(255,255,255,0.6)" : "#6b7280" }}>
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
