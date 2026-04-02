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
  if (s === "submitted") return { label: "Submitted", dot: "bg-[#10b981]", text: "text-[#10b981]",   border: "rgba(16,185,129,0.2)",  bg: "rgba(16,185,129,0.08)" };
  if (s === "overdue")   return { label: "Overdue",   dot: "bg-red-500",    text: "text-red-400",     border: "rgba(248,113,113,0.2)", bg: "rgba(248,113,113,0.08)" };
  return                        { label: "Pending",   dot: "bg-zinc-500",   text: "text-zinc-400",    border: "rgba(161,161,170,0.15)",bg: "rgba(161,161,170,0.06)" };
}

function formatDue(iso?: string | null) {
  if (!iso) return "No due date";
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  if (diff === -1) return "Due yesterday";
  if (diff > 0 && diff < 7) return `Due in ${diff} days`;
  return `Due ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined })}`;
}


function AssignmentRow({ assignment, onEdit, onDelete }: {
  assignment: Assignment; onEdit: () => void; onDelete: () => void;
}) {
  const navigate = useNavigate();
  const uiStatus = deriveStatus(assignment);
  const sc = statusConfig(uiStatus);

  return (
    <div
      className="group flex items-center gap-4 px-5 py-4 cursor-pointer transition-all duration-150"
      style={{
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
      }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.11)"}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.06)"}
      onClick={() => navigate(`/assignments/${assignment.id}`)}
    >
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
            {assignment.title}
          </span>
          {assignment.course && (
            <span className="text-[10px] font-semibold rounded-md px-1.5 py-0.5 tracking-wide flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {assignment.course.code}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs flex items-center gap-1" style={{ color: "rgba(255,255,255,0.3)" }}>
            <Calendar size={11} /> {formatDue(assignment.dueDate)}
          </span>
          {assignment.weight > 0 && (
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              Weight: {assignment.weight}%
            </span>
          )}
        </div>
      </div>

      <span className="hidden sm:inline-block text-[10px] font-semibold rounded-full px-2.5 py-0.5 flex-shrink-0"
        style={{ color: sc.text.replace("text-", ""), border: `1px solid ${sc.border}`, background: sc.bg }}>
        {sc.label}
      </span>

      <div
        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onEdit} aria-label="Edit"
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "rgba(255,255,255,0.3)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
          <Pencil size={13} />
        </button>
        <button onClick={onDelete} aria-label="Delete"
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "rgba(255,255,255,0.3)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
          <Trash2 size={13} />
        </button>
        <ChevronRight size={13} style={{ color: "rgba(255,255,255,0.15)" }} />
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  const toast = useToast();
  const { data: semesters }                  = useSemesters();
  const { data: allCourses }                 = useCourses();
  const { data: allAssignments, isLoading }  = useAssignments();

  const createAssignment = useCreateAssignment();
  const deleteAssignment = useDeleteAssignment();

  const [courseFilter,    setCourseFilter]    = useState("");
  const [statusFilter,    setStatusFilter]    = useState<StatusFilter>("all");
  const [dateRange,       setDateRange]       = useState<DateRange>("all");
  const [search,          setSearch]          = useState("");
  const [sortBy,          setSortBy]          = useState<SortKey>("dueDate");
  const [semesterFilter,  setSemesterFilter]  = useState("");
  const [showCreate,      setShowCreate]      = useState(false);
  const [editingId,       setEditingId]       = useState<string | null>(null);
  const [deletingId,      setDeletingId]      = useState<string | null>(null);

  const editingAssignment  = allAssignments?.find(a => a.id === editingId)  ?? null;
  const deletingAssignment = allAssignments?.find(a => a.id === deletingId) ?? null;
  const updateAssignment   = useUpdateAssignment(editingId ?? "");

  const filteredCourses = useMemo(() => {
    if (!allCourses) return [];
    if (!semesterFilter) return allCourses;
    return allCourses.filter(c => c.semesterId === semesterFilter);
  }, [allCourses, semesterFilter]);

  const now = new Date();

  const filtered = useMemo(() => {
    let list = allAssignments ?? [];
    if (courseFilter) list = list.filter(a => a.courseId === courseFilter);
    if (statusFilter !== "all") list = list.filter(a => deriveStatus(a) === statusFilter);
    if (dateRange !== "all") {
      list = list.filter(a => {
        if (!a.dueDate) return false;
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
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [allAssignments, courseFilter, statusFilter, dateRange, search, sortBy, now]);

  const activeFilters = [courseFilter, statusFilter !== "all", dateRange !== "all", search.trim()].filter(Boolean).length;

  return (
    <div className="p-6 sm:p-8 w-full min-w-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>Assignments</h2>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {filtered.length} assignment{filtered.length !== 1 ? "s" : ""}
            {activeFilters > 0 && <span className="ml-1">· {activeFilters} filter{activeFilters > 1 ? "s" : ""} active</span>}
            {!isLoading && (allAssignments?.length ?? 0) === 0 && activeFilters === 0 && (
              <span className="ml-1" style={{ color: "rgba(255,255,255,0.22)" }}>· sample below</span>
            )}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> New assignment</Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…" className="w-52" />
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

      {isLoading && <SkeletonList count={8} layout="list" cardHeight={64} />}

      {!isLoading && filtered.length === 0 && activeFilters > 0 && (
        <EmptyState
          icon={<ClipboardList size={18} strokeWidth={1.6} style={{ color: "rgba(255,255,255,0.3)" }} />}
          title="No assignments match your filters"
          description="Try adjusting your search or filters."
        />
      )}

      {!isLoading && filtered.length === 0 && activeFilters === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>No assignments yet</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map(a => (
            <AssignmentRow key={a.id} assignment={a} onEdit={() => setEditingId(a.id)} onDelete={() => setDeletingId(a.id)} />
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New assignment">
        <AssignmentForm courses={allCourses}
          onSubmit={async (p) => { await createAssignment.mutateAsync(p); setShowCreate(false); toast.success("Assignment created."); }}
          onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal open={!!editingAssignment} onClose={() => setEditingId(null)} title="Edit assignment">
        {editingAssignment && (
          <AssignmentForm initial={editingAssignment} courses={allCourses}
            onSubmit={async (p) => { await updateAssignment.mutateAsync(p); setEditingId(null); toast.success("Assignment updated."); }}
            onCancel={() => setEditingId(null)} />
        )}
      </Modal>

      <Modal open={!!deletingAssignment} onClose={() => setDeletingId(null)} title="Delete assignment" maxWidth={400}>
        <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>
          Delete <strong style={{ color: "rgba(255,255,255,0.85)" }}>{deletingAssignment?.title}</strong>? All grades will also be removed.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDeletingId(null)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleteAssignment.isPending}
            onClick={async () => {
              if (!deletingId || !deletingAssignment) return;
              try {
                await deleteAssignment.mutateAsync({ id: deletingId, courseId: deletingAssignment.courseId });
                setDeletingId(null); toast.success("Assignment deleted.");
              } catch { toast.error("Failed to delete assignment."); }
            }}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}