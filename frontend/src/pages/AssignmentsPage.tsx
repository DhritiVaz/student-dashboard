import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ClipboardList, Pencil, Trash2, Calendar, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { SearchInput } from "../components/ui/SearchInput";
import { Select } from "../components/ui/Select";
import { SkeletonList } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { AssignmentForm } from "../components/assignments/AssignmentForm";
import { useToast } from "../hooks/useToast";
import { useSemesters } from "../hooks/api/semesters";
import { useCourses } from "../hooks/api/courses";
import {
  useAssignments,
  useCreateAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
  deriveStatus,
  type Assignment,
} from "../hooks/api/assignments";

type SortKey   = "dueDate" | "name" | "course";
type StatusFilter = "all" | "submitted" | "pending" | "overdue";
type DateRange = "all" | "week" | "month" | "past";

function statusConfig(s: "submitted" | "overdue" | "pending") {
  if (s === "submitted") return { label: "Submitted", dot: "bg-[#10b981]", text: "text-[#10b981]", bg: "bg-[#f0fdf4] border-[#bbf7d0]" };
  if (s === "overdue")   return { label: "Overdue",   dot: "bg-red-500",    text: "text-red-500",    bg: "bg-red-50 border-red-100" };
  return                        { label: "Pending",   dot: "bg-[#9ca3af]",  text: "text-[#9ca3af]",  bg: "bg-[#f5f5f5] border-[#e5e7eb]" };
}

function formatDue(iso?: string | null) {
  if (!iso) return "No due date";
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  if (diff === -1) return "Due yesterday";
  if (diff > 0 && diff < 7) return `Due in ${diff} days`;
  return `Due ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined })}`;
}

function AssignmentRow({
  assignment,
  onEdit,
  onDelete,
}: {
  assignment: Assignment;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const uiStatus = deriveStatus(assignment);
  const sc = statusConfig(uiStatus);

  return (
    <div
      className="group card-hover flex items-center gap-4 bg-white border border-[#e5e7eb] rounded-card px-5 py-4
                 hover:border-[#d1d5db] cursor-pointer transition-all duration-150"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      onClick={() => navigate(`/assignments/${assignment.id}`)}
    >
      {/* Status dot */}
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-[#111] truncate">{assignment.title}</span>
          {assignment.course && (
            <span className="text-[10px] font-semibold text-[#6b7280] bg-[#f5f5f5] border border-[#e5e7eb] rounded-md px-1.5 py-0.5 tracking-wide flex-shrink-0">
              {assignment.course.code}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-[#9ca3af] flex items-center gap-1">
            <Calendar size={11} /> {formatDue(assignment.dueDate)}
          </span>
          {assignment.weight > 0 && (
            <span className="text-xs text-[#9ca3af]">Weight: {assignment.weight}%</span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <span className={`hidden sm:inline-block text-[10px] font-semibold border rounded-full px-2.5 py-0.5 flex-shrink-0 ${sc.text} ${sc.bg}`}>
        {sc.label}
      </span>

      {/* Actions */}
      <div
        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onEdit} aria-label="Edit assignment" className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#111] hover:bg-[#f5f5f5] transition-colors">
          <Pencil size={13} aria-hidden />
        </button>
        <button onClick={onDelete} aria-label="Delete assignment" className="group/btn p-1.5 rounded-lg text-[#9ca3af] hover:text-red-500 hover:bg-red-50 transition-colors">
          <Trash2 size={13} aria-hidden className="text-inherit group-hover/btn:text-red-500" />
        </button>
        <ChevronRight size={13} className="text-[#d1d5db] ml-0.5" />
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  const toast = useToast();
  const { data: semesters }            = useSemesters();
  const { data: allCourses }           = useCourses();
  const { data: allAssignments, isLoading } = useAssignments();

  const createAssignment = useCreateAssignment();
  const deleteAssignment = useDeleteAssignment();

  const [courseFilter, setCourseFilter]   = useState("");
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>("all");
  const [dateRange, setDateRange]         = useState<DateRange>("all");
  const [search, setSearch]               = useState("");
  const [sortBy, setSortBy]               = useState<SortKey>("dueDate");
  const [semesterFilter, setSemesterFilter] = useState("");

  const [showCreate, setShowCreate]       = useState(false);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);

  const editingAssignment  = allAssignments?.find(a => a.id === editingId)  ?? null;
  const deletingAssignment = allAssignments?.find(a => a.id === deletingId) ?? null;
  const updateAssignment = useUpdateAssignment(editingId ?? "");

  const filteredCourses = useMemo(() => {
    if (!allCourses) return [];
    if (!semesterFilter) return allCourses;
    return allCourses.filter(c => c.semesterId === semesterFilter);
  }, [allCourses, semesterFilter]);

  const now = new Date();

  const filtered = useMemo(() => {
    let list = allAssignments ?? [];

    if (courseFilter) list = list.filter(a => a.courseId === courseFilter);

    if (statusFilter !== "all") {
      list = list.filter(a => deriveStatus(a) === statusFilter);
    }

    if (dateRange !== "all") {
      list = list.filter(a => {
        if (!a.dueDate) return false; // exclude no-due-date items from date filters
        const due = new Date(a.dueDate);
        if (dateRange === "past")  return due < now;
        if (dateRange === "week")  return due >= now && due <= new Date(+now + 7  * 86400000);
        if (dateRange === "month") return due >= now && due <= new Date(+now + 30 * 86400000);
        return true;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(q));
    }

    return [...list].sort((a, b) => {
      if (sortBy === "name")   return a.title.localeCompare(b.title);
      if (sortBy === "course") return (a.course?.name ?? "").localeCompare(b.course?.name ?? "");
      // dueDate — nulls last
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [allAssignments, courseFilter, statusFilter, dateRange, search, sortBy, now]);

  const activeFilters = [courseFilter, statusFilter !== "all", dateRange !== "all", search.trim()].filter(Boolean).length;

  return (
    <div className="p-6 sm:p-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#111] tracking-tight">Assignments</h2>
          <p className="text-sm text-[#9ca3af] mt-0.5">
            {filtered.length} assignment{filtered.length !== 1 ? "s" : ""}
            {activeFilters > 0 && <span className="ml-1">· {activeFilters} filter{activeFilters > 1 ? "s" : ""} active</span>}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> New assignment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…" className="w-52" />

        {/* Semester → Course cascade */}
        <Select value={semesterFilter} onChange={e => { setSemesterFilter(e.target.value); setCourseFilter(""); }} className="w-40">
          <option value="">All semesters</option>
          {semesters?.map(s => <option key={s.id} value={s.id}>{s.name}{s.year != null ? ` (${s.year})` : ""}</option>)}
        </Select>

        <Select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} className="w-44">
          <option value="">All courses</option>
          {filteredCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>

        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)} className="w-36">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="submitted">Submitted</option>
          <option value="overdue">Overdue</option>
        </Select>

        <Select value={dateRange} onChange={e => setDateRange(e.target.value as DateRange)} className="w-36">
          <option value="all">All dates</option>
          <option value="week">Due this week</option>
          <option value="month">Due this month</option>
          <option value="past">Past due</option>
        </Select>

        <Select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)} className="w-36">
          <option value="dueDate">Sort: Due date</option>
          <option value="name">Sort: Name</option>
          <option value="course">Sort: Course</option>
        </Select>
      </div>

      {/* Loading skeletons */}
      {isLoading && <SkeletonList count={8} layout="list" cardHeight={64} />}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={<ClipboardList size={18} className="text-[#9ca3af]" strokeWidth={1.6} />}
          title={activeFilters > 0 ? "No assignments match your filters" : "No assignments yet"}
          description={
            activeFilters > 0
              ? "Try adjusting your search or filters."
              : "Create a course first, then add assignments to it."
          }
        />
      )}

      {/* Assignment list */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map(a => (
            <AssignmentRow
              key={a.id}
              assignment={a}
              onEdit={() => setEditingId(a.id)}
              onDelete={() => setDeletingId(a.id)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New assignment">
        <AssignmentForm
          courses={allCourses}
          onSubmit={async (p) => {
            await createAssignment.mutateAsync(p);
            setShowCreate(false);
            toast.success("Assignment created.");
          }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editingAssignment} onClose={() => setEditingId(null)} title="Edit assignment">
        {editingAssignment && (
          <AssignmentForm
            initial={editingAssignment}
            courses={allCourses}
            onSubmit={async (p) => {
              await updateAssignment.mutateAsync(p);
              setEditingId(null);
              toast.success("Assignment updated.");
            }}
            onCancel={() => setEditingId(null)}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deletingAssignment} onClose={() => setDeletingId(null)} title="Delete assignment" maxWidth={400}>
        <p className="text-sm text-[#6b7280] mb-5">
          Delete <strong>{deletingAssignment?.title}</strong>? All grades will also be removed.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDeletingId(null)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleteAssignment.isPending}
            onClick={async () => {
              if (!deletingId || !deletingAssignment) return;
              try {
                await deleteAssignment.mutateAsync({ id: deletingId, courseId: deletingAssignment.courseId });
                setDeletingId(null);
                toast.success("Assignment deleted.");
              } catch {
                toast.error("Failed to delete assignment.");
              }
            }}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
