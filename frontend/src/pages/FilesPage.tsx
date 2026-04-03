import { useMemo, useState } from "react";
import {
  FolderOpen,
  Plus,
  Download,
  Pencil,
  Trash2,
  File,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { SearchInput } from "../components/ui/SearchInput";
import { Select } from "../components/ui/Select";
import { FloatingInput } from "../components/ui/FloatingInput";
import { SkeletonList } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { useToast } from "../hooks/useToast";
import { useSemesters } from "../hooks/api/semesters";
import { useCourses } from "../hooks/api/courses";
import {
  useStudentFiles,
  useUploadStudentFile,
  useUpdateStudentFile,
  useDeleteStudentFile,
  downloadStudentFile,
  type StudentFile,
} from "../hooks/api/files";
import { PLACEHOLDER_FILES } from "../lib/placeholders";

const CATEGORIES = [
  { value: "", label: "None" },
  { value: "Slides", label: "Slides" },
  { value: "Syllabus", label: "Syllabus" },
  { value: "Lecture notes", label: "Lecture notes" },
  { value: "Lab", label: "Lab" },
  { value: "Assignment", label: "Assignment" },
  { value: "Exam prep", label: "Exam prep" },
  { value: "Other", label: "Other" },
];

function formatSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function FileCard({
  f,
  onEdit,
  onDelete,
  onDownload,
}: {
  f: StudentFile;
  onEdit: () => void;
  onDelete: () => void;
  onDownload: () => void;
}) {
  return (
    <div
      className="group relative rounded-xl p-5 transition-all duration-200"
      style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.12)";
        (e.currentTarget as HTMLDivElement).style.background = "#161616";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.06)";
        (e.currentTarget as HTMLDivElement).style.background = "#111111";
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 rounded-lg p-2.5"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <File size={20} className="text-white/50" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate" style={{ color: "rgba(255,255,255,0.9)" }}>
            {f.title}
          </p>
          <p className="text-xs truncate mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {f.originalName} · {formatSize(f.sizeBytes)}
          </p>
          {f.description && (
            <p className="text-xs mt-2 line-clamp-2" style={{ color: "rgba(255,255,255,0.4)" }}>
              {f.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {f.course && (
              <span
                className="text-[10px] font-semibold rounded-md px-1.5 py-0.5 tracking-wide"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.45)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {f.course.code}
              </span>
            )}
            {f.category && (
              <span
                className="text-[10px] rounded-md px-1.5 py-0.5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.35)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {f.category}
              </span>
            )}
            <span className="text-[10px] ml-auto" style={{ color: "rgba(255,255,255,0.2)" }}>
              {relativeDate(f.updatedAt)}
            </span>
          </div>
        </div>
        <div
          className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onDownload}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "rgba(255,255,255,0.35)" }}
            title="Download"
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
          >
            <Download size={14} />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "rgba(255,255,255,0.35)" }}
            title="Edit details"
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "rgba(255,255,255,0.35)" }}
            title="Delete"
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FilesPage() {
  const toast = useToast();
  const { data: semesters } = useSemesters();
  const { data: allCourses } = useCourses();
  const { data: files, isLoading } = useStudentFiles();
  const upload = useUploadStudentFile();
  const deleteFile = useDeleteStudentFile();

  const [semesterFilter, setSemesterFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [editing, setEditing] = useState<StudentFile | null>(null);
  const [deleting, setDeleting] = useState<StudentFile | null>(null);

  const filteredCourses = useMemo(() => {
    if (!allCourses) return [];
    return semesterFilter ? allCourses.filter((c) => c.semesterId === semesterFilter) : allCourses;
  }, [allCourses, semesterFilter]);

  const activeFilters = [courseFilter, search.trim()].filter(Boolean).length;

  const filtered = useMemo(() => {
    let list = files ?? [];
    const isActuallyEmpty = !isLoading && list.length === 0 && activeFilters === 0;
    if (isActuallyEmpty) {
      list = PLACEHOLDER_FILES;
    }

    if (courseFilter) list = list.filter((f) => f.courseId === courseFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.originalName.toLowerCase().includes(q) ||
          (f.description && f.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [files, courseFilter, search, isLoading, activeFilters]);

  return (
    <div className="p-6 sm:p-8 w-full min-w-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>
            Files
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Digital materials linked to your courses
            {activeFilters > 0 && (
              <span className="ml-1">
                · {activeFilters} filter{activeFilters > 1 ? "s" : ""} active
              </span>
            )}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowUpload(true)}>
          <Plus size={14} /> Upload file
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title or filename…"
          className="w-52"
        />
        <Select
          value={semesterFilter}
          onChange={(e) => {
            setSemesterFilter(e.target.value);
            setCourseFilter("");
          }}
          className="w-44"
        >
          <option value="">All semesters</option>
          {semesters?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.year != null ? ` (${s.year})` : ""}
            </option>
          ))}
        </Select>
        <Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="w-48">
          <option value="">All courses</option>
          {filteredCourses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </Select>
      </div>

      {isLoading && <SkeletonList count={6} layout="grid" cardHeight={140} />}

      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={<FolderOpen size={18} strokeWidth={1.6} style={{ color: "rgba(255,255,255,0.3)" }} />}
          title={activeFilters > 0 ? "No files match your filters" : "No files yet"}
          description={
            activeFilters > 0
              ? "Try adjusting search or course filter."
              : "Upload PDFs, slides, or other documents and tie them to a course."
          }
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((f) => (
            <FileCard
              key={f.id}
              f={f}
              onEdit={() => setEditing(f)}
              onDelete={() => setDeleting(f)}
              onDownload={async () => {
                try {
                  await downloadStudentFile(f.id, f.originalName);
                  toast.success("Download started.");
                } catch {
                  toast.error("Download failed.");
                }
              }}
            />
          ))}
        </div>
      )}

      <Modal open={showUpload} onClose={() => !upload.isPending && setShowUpload(false)} title="Upload file">
        <UploadForm
          courses={allCourses}
          loading={upload.isPending}
          onCancel={() => setShowUpload(false)}
          onSubmit={async (fd) => {
            try {
              await upload.mutateAsync(fd);
              setShowUpload(false);
              toast.success("File uploaded.");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Upload failed.");
            }
          }}
        />
      </Modal>

      {editing && (
        <EditFileModal
          key={editing.id}
          file={editing}
          courses={allCourses}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            toast.success("Saved.");
          }}
        />
      )}

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete file" maxWidth={400}>
        <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>
          Remove <strong style={{ color: "rgba(255,255,255,0.85)" }}>{deleting?.title}</strong> from your
          library? The file will be deleted from storage.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={deleteFile.isPending}
            onClick={async () => {
              if (!deleting) return;
              try {
                await deleteFile.mutateAsync(deleting.id);
                setDeleting(null);
                toast.success("File deleted.");
              } catch {
                toast.error("Could not delete file.");
              }
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function UploadForm({
  courses,
  loading,
  onSubmit,
  onCancel,
}: {
  courses?: { id: string; name: string; code: string }[];
  loading: boolean;
  onSubmit: (fd: FormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [category, setCategory] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!file) {
      setErr("Choose a file to upload.");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title.trim() || file.name.replace(/\.[^.]+$/, "") || "Untitled");
    if (description.trim()) fd.append("description", description.trim());
    if (courseId) fd.append("courseId", courseId);
    if (category) fd.append("category", category);
    await onSubmit(fd);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
          File
        </label>
        <input
          type="file"
          disabled={loading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            setFile(f ?? null);
            if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
          }}
          className="block w-full text-sm text-white/70 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white/10 file:text-white/90 hover:file:bg-white/15 cursor-pointer"
        />
      </div>
      <FloatingInput label="Title" value={title} onChange={setTitle} disabled={loading} />
      <FloatingInput label="Description (optional)" value={description} onChange={setDescription} disabled={loading} />
      <Select label="Course (optional)" value={courseId} onChange={(e) => setCourseId(e.target.value)} disabled={loading}>
        <option value="">No course</option>
        {courses?.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.code})
          </option>
        ))}
      </Select>
      <Select label="Category (optional)" value={category} onChange={(e) => setCategory(e.target.value)} disabled={loading}>
        {CATEGORIES.map((c) => (
          <option key={c.value || "none"} value={c.value}>
            {c.label}
          </option>
        ))}
      </Select>
      {err && <p className="text-xs text-red-400">{err}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" size="sm" loading={loading}>
          Upload
        </Button>
      </div>
    </form>
  );
}

function EditFileModal({
  file,
  courses,
  onClose,
  onSaved,
}: {
  file: StudentFile;
  courses?: { id: string; name: string; code: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const update = useUpdateStudentFile(file.id);
  const [title, setTitle] = useState(file.title);
  const [description, setDescription] = useState(file.description ?? "");
  const [courseId, setCourseId] = useState(file.courseId ?? "");
  const [category, setCategory] = useState(file.category ?? "");

  return (
    <Modal open={true} onClose={onClose} title="Edit file details">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await update.mutateAsync({
              title: title.trim(),
              description: description.trim() || null,
              courseId: courseId || null,
              category: category || null,
            });
            onSaved();
          } catch {
            toast.error("Could not save changes.");
          }
        }}
      >
        <FloatingInput label="Title" value={title} onChange={setTitle} disabled={update.isPending} />
        <FloatingInput
          label="Description"
          value={description}
          onChange={setDescription}
          disabled={update.isPending}
        />
        <Select label="Course" value={courseId} onChange={(e) => setCourseId(e.target.value)} disabled={update.isPending}>
          <option value="">No course</option>
          {courses?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </Select>
        <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} disabled={update.isPending}>
          {CATEGORIES.map((c) => (
            <option key={c.value || "none"} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
          File on disk: {file.originalName} ({formatSize(file.sizeBytes)})
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={update.isPending}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
