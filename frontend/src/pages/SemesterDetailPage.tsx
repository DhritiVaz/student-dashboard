import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, Pencil, Trash2, BookOpen } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { SkeletonList } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { SemesterForm } from "../components/semesters/SemesterForm";
import { CourseForm } from "../components/courses/CourseForm";
import { useToast } from "../hooks/useToast";
import { useTheme } from "../ThemeContext";
import { useSemester, useUpdateSemester, useDeleteSemester } from "../hooks/api/semesters";
import {
  useCourses,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  type Course,
} from "../hooks/api/courses";

function formatDate(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

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
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div
      className="group card-hover rounded-card p-5 cursor-pointer transition-all duration-150 flex flex-col gap-3"
      style={{
        boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.05)",
        background: isDark ? "#141414" : "#ffffff",
        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb",
        borderLeft: course.color ? `3px solid ${course.color}` : (isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb"),
      }}
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: isDark ? "#f0f0f0" : "#111" }}>{course.name}</p>
          <span className="inline-block mt-1 text-[10px] font-semibold rounded-md px-1.5 py-0.5 tracking-wide" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280", background: isDark ? "rgba(255,255,255,0.05)" : "#f5f5f5", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}` }}>
            {course.code}
          </span>
        </div>
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onEdit} aria-label="Edit course" className="p-1.5 rounded-lg transition-colors" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.color = isDark ? "#f0f0f0" : "#111"; (e.target as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.05)" : "#f5f5f5"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.color = isDark ? "rgba(255,255,255,0.4)" : "#9ca3af"; (e.target as HTMLElement).style.background = "transparent"; }}
          >
            <Pencil size={13} aria-hidden />
          </button>
          <button onClick={onDelete} aria-label="Delete course" className="group/btn p-1.5 rounded-lg transition-colors" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "#f87171"; (e.target as HTMLElement).style.background = isDark ? "rgba(248,113,113,0.1)" : "#fef2f2"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.color = isDark ? "rgba(255,255,255,0.4)" : "#9ca3af"; (e.target as HTMLElement).style.background = "transparent"; }}
          >
            <Trash2 size={13} aria-hidden />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}>
        <span>{course.credits} {course.credits === 1 ? "credit" : "credits"}</span>
        {(course.professor ?? course.instructor) && <span className="truncate">{course.professor ?? course.instructor}</span>}
      </div>
      {course.description && (
        <p className="mt-2 text-xs line-clamp-2" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280" }}>{course.description}</p>
      )}
    </div>
  );
}

export default function SemesterDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const toast       = useToast();
  const { theme }   = useTheme();
  const isDark      = theme === "dark";

  const { data: semester, isLoading: loadingSemester } = useSemester(id);
  const { data: courses,  isLoading: loadingCourses  } = useCourses(id);

  const updateSemester = useUpdateSemester(id);
  const deleteSemester = useDeleteSemester();
  const createCourse   = useCreateCourse();
  const deleteCourse   = useDeleteCourse();

  const [showEdit, setShowEdit]             = useState(false);
  const [showDeleteSem, setShowDeleteSem]   = useState(false);
  const [showAddCourse, setShowAddCourse]   = useState(false);
  const [editingCourse, setEditingCourse]   = useState<Course | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  // Per-course update mutation — needs the course id
  const updateCourse = useUpdateCourse(editingCourse?.id ?? "");

  if (loadingSemester) {
    return (
      <div className="p-6 sm:p-8 w-full min-w-0 space-y-6">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <SkeletonList count={6} layout="grid" cardHeight={112} />
      </div>
    );
  }

  if (!semester) {
    return <div className="p-8 text-sm" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}>Semester not found.</div>;
  }

  return (
    <div className="p-6 sm:p-8 w-full min-w-0">
      {/* Back */}
      <button
        onClick={() => navigate("/semesters")}
        className="flex items-center gap-1.5 text-xs transition-colors mb-6"
        style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = isDark ? "#f0f0f0" : "#111")}
        onMouseLeave={(e) => (e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.4)" : "#9ca3af")}
      >
        <ArrowLeft size={13} /> Back to semesters
      </button>

      {/* Semester header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: isDark ? "#f0f0f0" : "#111" }}>{semester.name}</h2>
          <p className="text-sm mt-1" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}>
            {semester.year}
            {(semester.startDate || semester.endDate) && (
              <> {formatDate(semester.startDate)}{semester.startDate && semester.endDate && " → "}{formatDate(semester.endDate)}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil size={13} /> Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setShowDeleteSem(true)}>
            <Trash2 size={13} /> Delete
          </Button>
        </div>
      </div>

      {/* Courses sub-header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}>
          Courses · {courses?.length ?? 0}
        </p>
        <Button size="sm" onClick={() => setShowAddCourse(true)}>
          <Plus size={14} /> New course
        </Button>
      </div>

      {loadingCourses && <SkeletonList count={6} layout="grid" cardHeight={112} />}

      {!loadingCourses && courses?.length === 0 && (
        <EmptyState
          icon={<BookOpen size={16} className="text-[#9ca3af]" strokeWidth={1.6} />}
          title="No courses in this semester"
          description="Add a course to start tracking assignments and grades."
        />
      )}

      {!loadingCourses && (courses?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses!.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              onEdit={() => setEditingCourse(c)}
              onDelete={() => setDeletingCourseId(c.id)}
            />
          ))}
        </div>
      )}

      {/* — Modals — */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit semester">
        <SemesterForm
          initial={semester}
          onSubmit={async (p) => {
            await updateSemester.mutateAsync(p);
            setShowEdit(false);
            toast.success("Semester updated.");
          }}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>

      <Modal open={showDeleteSem} onClose={() => setShowDeleteSem(false)} title="Delete semester" maxWidth={400}>
        <p className="text-sm text-[#6b7280] mb-5">
          Deleting <strong>{semester.name}</strong> will also remove all courses and data. This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowDeleteSem(false)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleteSemester.isPending}
            onClick={async () => {
              try {
                await deleteSemester.mutateAsync(id);
                toast.success("Semester deleted.");
                navigate("/semesters", { replace: true });
              } catch {
                toast.error("Failed to delete semester.");
              }
            }}>
            Delete
          </Button>
        </div>
      </Modal>

      <Modal open={showAddCourse} onClose={() => setShowAddCourse(false)} title="New course">
        <CourseForm
          defaultSemesterId={id}
          onSubmit={async (p) => {
            await createCourse.mutateAsync(p);
            setShowAddCourse(false);
            toast.success("Course added.");
          }}
          onCancel={() => setShowAddCourse(false)}
        />
      </Modal>

      <Modal open={!!editingCourse} onClose={() => setEditingCourse(null)} title="Edit course">
        {editingCourse && (
          <CourseForm
            initial={editingCourse}
            onSubmit={async (p) => {
              await updateCourse.mutateAsync(p);
              setEditingCourse(null);
              toast.success("Course updated.");
            }}
            onCancel={() => setEditingCourse(null)}
          />
        )}
      </Modal>

      <Modal open={!!deletingCourseId} onClose={() => setDeletingCourseId(null)} title="Delete course" maxWidth={400}>
        <p className="text-sm text-[#6b7280] mb-5">
          This will delete the course and all its assignments, notes, and events.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDeletingCourseId(null)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleteCourse.isPending}
            onClick={async () => {
              if (!deletingCourseId) return;
              try {
                await deleteCourse.mutateAsync({ id: deletingCourseId, semesterId: id });
                setDeletingCourseId(null);
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
