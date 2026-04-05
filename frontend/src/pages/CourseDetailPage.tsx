import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { CourseForm } from "../components/courses/CourseForm";
import { PlaceholderPage } from "../components/PlaceholderPage";
import { useCourse, useUpdateCourse, useDeleteCourse } from "../hooks/api/courses";
import { useSemesters } from "../hooks/api/semesters";
import { ClipboardList, FileText, Calendar, Settings, BarChart2 } from "lucide-react";
import { useVtopMarks } from "../hooks/api/vtop";
import { useTheme } from "../ThemeContext";

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
  const { theme }    = useTheme();
  const isDark       = theme === "dark";

  const { data: course,  isLoading } = useCourse(id);
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
        <div className="h-8 rounded-lg w-56 animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "#f0f0f0" }} />
        <div className="h-4 rounded w-32 animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "#f0f0f0" }} />
        <div className="h-40 rounded-card animate-pulse mt-6" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "#f0f0f0" }} />
      </div>
    );
  }

  if (!course) {
    return <div className="p-8 text-sm" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}>Course not found.</div>;
  }

  return (
    <div className="p-6 sm:p-8 w-full min-w-0">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs transition-colors mb-6"
        style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = isDark ? "#f0f0f0" : "#111")}
        onMouseLeave={(e) => (e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.4)" : "#9ca3af")}
      >
        <ArrowLeft size={13} /> Back
      </button>

      {/* Course header card */}
      <div
        className="border rounded-card p-6 mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
        style={{ background: isDark ? "#141414" : "#ffffff", borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb", boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.05)" }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-xl font-bold tracking-tight" style={{ color: isDark ? "#f0f0f0" : "#111" }}>{course.name}</h2>
            <span className="text-xs font-semibold rounded-md px-2 py-0.5" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280", background: isDark ? "rgba(255,255,255,0.05)" : "#f5f5f5", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}` }}>
              {course.code}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm">
            {(course.professor ?? course.instructor) && <span style={{ color: isDark ? "rgba(255,255,255,0.45)" : "#9ca3af" }}>{course.professor ?? course.instructor}</span>}
            <span style={{ color: isDark ? "rgba(255,255,255,0.45)" : "#9ca3af" }}>{course.credits} {course.credits === 1 ? "credit" : "credits"}</span>
            {course.semester && (
              <span className="text-[10px] font-medium rounded-full px-2 py-0.5" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280", background: isDark ? "rgba(255,255,255,0.05)" : "#f5f5f5", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}` }}>
                {course.semester.name} {course.semester.year}
              </span>
            )}
          </div>

          {course.description && (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280" }}>{course.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-start gap-2 flex-shrink-0">
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
      <div className="flex gap-0 border-b mb-6" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb" }}>
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="font-semibold px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors duration-150"
            style={{
              borderBottomColor: activeTab === key ? (isDark ? "#f0f0f0" : "#111") : "transparent",
              color: activeTab === key ? (isDark ? "#f0f0f0" : "#111") : (isDark ? "rgba(255,255,255,0.4)" : "#9ca3af"),
            }}
            onMouseEnter={(e) => { if (activeTab !== key) (e.currentTarget as HTMLElement).style.color = isDark ? "rgba(255,255,255,0.7)" : "#6b7280"; }}
            onMouseLeave={(e) => { if (activeTab !== key) (e.currentTarget as HTMLElement).style.color = isDark ? "rgba(255,255,255,0.4)" : "#9ca3af"; }}
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
        <div className="border rounded-card overflow-hidden" style={{ background: isDark ? "#141414" : "#ffffff", borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb", boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb" }}>
            <BarChart2 size={14} style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }} />
            <span className="text-sm font-semibold" style={{ color: isDark ? "#f0f0f0" : "#111" }}>VTOP marks</span>
            <span className="text-xs ml-auto" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}>{course.code}</span>
          </div>
          {marksLoading ? (
            <p className="p-6 text-sm" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}>Loading…</p>
          ) : (() => {
            const rows = vtopMarks?.filter(
              (m) => m.courseCode.replace(/\s/g, "").toUpperCase() === course.code.replace(/\s/g, "").toUpperCase()
            );
            if (!rows || rows.length === 0) {
              return (
                <p className="p-6 text-sm" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}>
                  No mark rows synced for this course. Run VTOP sync; marks appear when the portal exposes them.
                </p>
              );
            }
            return (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb" }}>
                    <th className="text-left px-5 py-2 text-[11px] font-medium" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}>Component</th>
                    <th className="text-right px-5 py-2 text-[11px] font-medium" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}>Scored</th>
                    <th className="text-right px-5 py-2 text-[11px] font-medium" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}>Max</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m) => (
                    <tr key={m.id} className="border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "#f0f0f0" }}>
                      <td className="px-5 py-2" style={{ color: isDark ? "#f0f0f0" : "#111" }}>{m.component}</td>
                      <td className="px-5 py-2 text-right" style={{ color: isDark ? "#f0f0f0" : "#111" }}>{m.scored ?? "—"}</td>
                      <td className="px-5 py-2 text-right" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280" }}>{m.maxScore ?? "—"}</td>
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
        <p className="text-sm mb-5" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280" }}>
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
