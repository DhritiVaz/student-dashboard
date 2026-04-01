import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { CourseForm } from "../components/courses/CourseForm";
import { PlaceholderPage } from "../components/PlaceholderPage";
import { useCourse, useCourseGpa, useUpdateCourse, useDeleteCourse } from "../hooks/api/courses";
import { useSemesters } from "../hooks/api/semesters";
import { ClipboardList, FileText, Calendar, Settings, BarChart2 } from "lucide-react";
import { useVtopMarks } from "../hooks/api/vtop";

type Tab = "assignments" | "notes" | "events" | "marks" | "settings";

const tabs: { key: Tab; label: string }[] = [
  { key: "assignments", label: "Assignments" },
  { key: "notes",       label: "Notes" },
  { key: "events",      label: "Events" },
  { key: "marks",       label: "Marks (VTOP)" },
  { key: "settings",    label: "Settings" },
];

export default function CourseDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate     = useNavigate();

  const { data: course,  isLoading } = useCourse(id);
  const { data: gpaData }            = useCourseGpa(id);
  const { data: semesters }          = useSemesters();

  const updateCourse = useUpdateCourse(id);
  const deleteCourse = useDeleteCourse();

  const [activeTab, setActiveTab] = useState<Tab>("assignments");
  const [showEdit, setShowEdit]   = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const { data: vtopMarks, fetch: fetchMarks, loading: marksLoading } = useVtopMarks();

  useEffect(() => {
    if (activeTab === "marks") fetchMarks();
  }, [activeTab, fetchMarks]);

  if (isLoading) {
    return (
      <div className="p-6 sm:p-8 w-full min-w-0 space-y-4">
        <div className="h-8 bg-[#f0f0f0] rounded-lg w-56 animate-pulse" />
        <div className="h-4 bg-[#f0f0f0] rounded w-32 animate-pulse" />
        <div className="h-40 bg-[#f0f0f0] rounded-card animate-pulse mt-6" />
      </div>
    );
  }

  if (!course) {
    return <div className="p-8 text-sm text-[#9ca3af]">Course not found.</div>;
  }

  const gpa = gpaData?.gpa != null ? gpaData.gpa.toFixed(2) : "—";

  return (
    <div className="p-6 sm:p-8 w-full min-w-0">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-[#9ca3af] hover:text-[#111] transition-colors mb-6"
      >
        <ArrowLeft size={13} /> Back
      </button>

      {/* Course header card */}
      <div
        className="bg-white border border-[#e5e7eb] rounded-card p-6 mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-xl font-bold text-[#111] tracking-tight">{course.name}</h2>
            <span className="text-xs font-semibold text-[#6b7280] bg-[#f5f5f5] border border-[#e5e7eb] rounded-md px-2 py-0.5">
              {course.code}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-[#9ca3af]">
            {(course.professor ?? course.instructor) && <span>{course.professor ?? course.instructor}</span>}
            <span>{course.credits} {course.credits === 1 ? "credit" : "credits"}</span>
            {course.semester && (
              <span className="text-[10px] font-medium bg-[#f5f5f5] border border-[#e5e7eb] rounded-full px-2 py-0.5 text-[#6b7280]">
                {course.semester.name} {course.semester.year}
              </span>
            )}
          </div>

          {course.description && (
            <p className="mt-3 text-sm text-[#6b7280] leading-relaxed">{course.description}</p>
          )}
        </div>

        {/* GPA + actions */}
        <div className="flex items-start gap-4 flex-shrink-0">
          <div className="text-right">
            <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest">GPA</p>
            <p className="text-3xl font-bold text-[#111] leading-none mt-1">{gpa}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>
              <Pencil size={13} /> Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
              <Trash2 size={13} /> Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[#e5e7eb] mb-6">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors duration-150 ${
              activeTab === key
                ? "border-[#111] text-[#111]"
                : "border-transparent text-[#9ca3af] hover:text-[#6b7280]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "assignments" && (
        <PlaceholderPage title="Assignments" description="Assignments for this course will appear here." icon={ClipboardList} />
      )}
      {activeTab === "notes" && (
        <PlaceholderPage title="Notes" description="Your markdown notes for this course." icon={FileText} />
      )}
      {activeTab === "events" && (
        <PlaceholderPage title="Events" description="Lectures, exams, and deadlines for this course." icon={Calendar} />
      )}
      {activeTab === "marks" && (
        <div className="bg-white border border-[#e5e7eb] rounded-card overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div className="px-5 py-3 border-b border-[#e5e7eb] flex items-center gap-2">
            <BarChart2 size={14} className="text-[#9ca3af]" />
            <span className="text-sm font-semibold text-[#111]">VTOP marks</span>
            <span className="text-xs text-[#9ca3af] ml-auto">{course.code}</span>
          </div>
          {marksLoading ? (
            <p className="p-6 text-sm text-[#9ca3af]">Loading…</p>
          ) : (() => {
            const rows = vtopMarks.filter(
              (m) => m.courseCode.replace(/\s/g, "").toUpperCase() === course.code.replace(/\s/g, "").toUpperCase()
            );
            if (rows.length === 0) {
              return (
                <p className="p-6 text-sm text-[#9ca3af]">
                  No mark rows synced for this course. Run VTOP sync; marks appear when the portal exposes them.
                </p>
              );
            }
            return (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e7eb]">
                    <th className="text-left px-5 py-2 text-xs font-medium text-[#9ca3af]">Component</th>
                    <th className="text-right px-5 py-2 text-xs font-medium text-[#9ca3af]">Scored</th>
                    <th className="text-right px-5 py-2 text-xs font-medium text-[#9ca3af]">Max</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m) => (
                    <tr key={m.id} className="border-b border-[#f0f0f0]">
                      <td className="px-5 py-2 text-[#111]">{m.component}</td>
                      <td className="px-5 py-2 text-right text-[#111]">{m.scored ?? "—"}</td>
                      <td className="px-5 py-2 text-right text-[#6b7280]">{m.maxScore ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>
      )}
      {activeTab === "settings" && (
        <PlaceholderPage title="Course settings" description="Update course info or remove it from this semester." icon={Settings} />
      )}

      {/* GPA breakdown */}
      {activeTab === "assignments" && gpaData?.breakdown && gpaData.breakdown.length > 0 && (
        <div className="mt-6 bg-white border border-[#e5e7eb] rounded-card overflow-hidden"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div className="px-5 py-3 border-b border-[#e5e7eb]">
            <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest">GPA Breakdown</p>
          </div>
          <div className="divide-y divide-[#f0f0f0]">
            {gpaData.breakdown.map((row) => (
              <div key={row.assignmentId} className="px-5 py-3 flex items-center justify-between text-sm">
                <span className="text-[#111]">{row.title}</span>
                <div className="flex items-center gap-4 text-xs text-[#9ca3af]">
                  <span>Weight: {row.weight}%</span>
                  <span className="font-medium text-[#111]">
                    {row.percentage != null ? `${row.percentage.toFixed(1)}%` : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit course">
        <CourseForm
          initial={course}
          semesters={semesters}
          onSubmit={async (p) => { await updateCourse.mutateAsync(p); setShowEdit(false); }}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>

      {/* Delete confirm */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete course" maxWidth={400}>
        <p className="text-sm text-[#6b7280] mb-5">
          Delete <strong>{course.name}</strong>? All assignments, notes, and events will be removed.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleteCourse.isPending}
            onClick={async () => {
              await deleteCourse.mutateAsync({ id, semesterId: course.semesterId });
              navigate("/courses", { replace: true });
            }}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
