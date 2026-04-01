import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, BookOpen, Pencil, Trash2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { SearchInput } from "../components/ui/SearchInput";
import { Select } from "../components/ui/Select";
import { SkeletonList } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { CourseForm } from "../components/courses/CourseForm";
import { useToast } from "../hooks/useToast";
import { useSemesters } from "../hooks/api/semesters";
import {
  useCourses,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  type Course,
} from "../hooks/api/courses";

type SortKey = "name" | "credits" | "code";

function CourseCard({
  course,
  onEdit,
  onDelete,
}: {
  course: Course;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div
      className="group relative cursor-pointer rounded-xl p-5 transition-all duration-200"
      style={{
        background: "#141414",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.12)";
        (e.currentTarget as HTMLDivElement).style.background = "#181818";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.06)";
        (e.currentTarget as HTMLDivElement).style.background = "#141414";
      }}
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      {/* Action buttons */}
      <div
        className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onEdit}
          aria-label="Edit course"
          className="p-1.5 rounded-lg transition-colors duration-150"
          style={{ color: "rgba(255,255,255,0.3)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={onDelete}
          aria-label="Delete course"
          className="p-1.5 rounded-lg transition-colors duration-150"
          style={{ color: "rgba(255,255,255,0.3)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Course name */}
      <p
        className="font-semibold text-sm leading-snug mb-1 pr-14 truncate"
        style={{ color: "rgba(255,255,255,0.9)" }}
      >
        {course.name}
      </p>

      {/* Code badge */}
      <span
        className="inline-block text-[10px] font-semibold tracking-wide rounded-md px-1.5 py-0.5 mb-3"
        style={{
          background: "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.4)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {course.code}
      </span>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            {course.credits} {course.credits === 1 ? "credit" : "credits"}
          </span>
          {(course.professor ?? course.instructor) && (
            <span
              className="text-xs truncate max-w-[100px]"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              · {course.professor ?? course.instructor}
            </span>
          )}
        </div>
        {course.semester && (
          <span
            className="text-[10px] font-medium rounded-full px-2 py-0.5"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.3)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {course.semester.name}
          </span>
        )}
      </div>

      {course.description && (
        <p
          className="mt-2 text-xs line-clamp-2"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          {course.description}
        </p>
      )}
    </div>
  );
}

export default function CoursesPage() {
  const toast = useToast();
  const { data: semesters } = useSemesters();
  const { data: allCourses, isLoading } = useCourses();

  const createCourse = useCreateCourse();
  const deleteCourse = useDeleteCourse();

  const [semesterFilter, setSemesterFilter] = useState("");
  const [search, setSearch]                 = useState("");
  const [sortBy, setSortBy]                 = useState<SortKey>("name");
  const [showCreate, setShowCreate]         = useState(false);
  const [editingCourse, setEditingCourse]   = useState<Course | null>(null);
  const [deletingId, setDeletingId]         = useState<string | null>(null);

  const updateCourse = useUpdateCourse(editingCourse?.id ?? "");

  const filtered = useMemo(() => {
    let list = allCourses ?? [];
    if (semesterFilter) list = list.filter(c => c.semesterId === semesterFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortBy === "credits") return b.credits - a.credits;
      if (sortBy === "code")    return a.code.localeCompare(b.code);
      return a.name.localeCompare(b.name);
    });
  }, [allCourses, semesterFilter, search, sortBy]);

  const deletingCourse = allCourses?.find(c => c.id === deletingId);

  return (
    <div className="p-6 sm:p-8 w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>Courses</h2>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{filtered.length} course{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> New course
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <SearchInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or code…"
          className="w-56"
        />
        <Select
          value={semesterFilter}
          onChange={e => setSemesterFilter(e.target.value)}
          className="w-44"
        >
          <option value="">All semesters</option>
          {semesters?.map(s => (
            <option key={s.id} value={s.id}>{s.name}{s.year != null ? ` (${s.year})` : ""}</option>
          ))}
        </Select>
        <Select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)} className="w-36">
          <option value="name">Sort: Name</option>
          <option value="code">Sort: Code</option>
          <option value="credits">Sort: Credits</option>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && <SkeletonList count={6} layout="grid" cardHeight={112} />}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={<BookOpen size={18} className="text-[#9ca3af]" strokeWidth={1.6} />}
          title={search || semesterFilter ? "No courses match your filters" : "No courses yet"}
          description={
            search || semesterFilter
              ? "Try adjusting your search or filters."
              : "Create a semester first, then add courses."
          }
        />
      )}

      {/* Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <CourseCard
              key={c.id}
              course={c}
              onEdit={() => setEditingCourse(c)}
              onDelete={() => setDeletingId(c.id)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New course">
        <CourseForm
          semesters={semesters}
          onSubmit={async (p) => {
            await createCourse.mutateAsync(p);
            setShowCreate(false);
            toast.success("Course created.");
          }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editingCourse} onClose={() => setEditingCourse(null)} title="Edit course">
        {editingCourse && (
          <CourseForm
            initial={editingCourse}
            semesters={semesters}
            onSubmit={async (p) => {
              await updateCourse.mutateAsync(p);
              setEditingCourse(null);
              toast.success("Course updated.");
            }}
            onCancel={() => setEditingCourse(null)}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deletingId} onClose={() => setDeletingId(null)} title="Delete course" maxWidth={400}>
        <p className="text-sm text-[#6b7280] mb-5">
          Delete <strong>{deletingCourse?.name}</strong>? All assignments, notes, and events will be removed.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDeletingId(null)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleteCourse.isPending}
            onClick={async () => {
              if (!deletingId || !deletingCourse) return;
              try {
                await deleteCourse.mutateAsync({ id: deletingId, semesterId: deletingCourse.semesterId });
                setDeletingId(null);
                toast.success("Course deleted.");
              } catch {
                toast.error("Failed to delete course.");
              }
            }}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
