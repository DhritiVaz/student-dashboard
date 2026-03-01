import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Pencil, Trash2, Tag, X } from "lucide-react";
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
import { useNotes, useCreateNote, useDeleteNote, type Note } from "../hooks/api/notes";

type SortKey = "updatedAt" | "createdAt" | "title";

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)    return "just now";
  if (mins < 60)   return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days < 7)    return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function contentPreview(content: string, maxLen = 100) {
  const stripped = content.replace(/[#*>`_~[\]()-]/g, "").replace(/\n+/g, " ").trim();
  return stripped.length > maxLen ? stripped.slice(0, maxLen) + "…" : stripped;
}

function NoteCard({
  note,
  onDelete,
}: {
  note: Note;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div
      className="group card-hover bg-white border border-[#e5e7eb] rounded-card p-5 cursor-pointer
                 hover:border-[#d1d5db] transition-all duration-150"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      onClick={() => navigate(`/notes/${note.id}`)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-semibold text-[#111] text-sm truncate flex-1">{note.title || "Untitled"}</p>
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => navigate(`/notes/${note.id}`)}
            aria-label="Edit note"
            className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#111] hover:bg-[#f5f5f5] transition-colors"
          >
            <Pencil size={13} aria-hidden />
          </button>
          <button
            onClick={onDelete}
            aria-label="Delete note"
            className="group/btn p-1.5 rounded-lg text-[#9ca3af] hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} aria-hidden className="text-inherit group-hover/btn:text-red-500" />
          </button>
        </div>
      </div>

      {note.content && (
        <p className="text-xs text-[#9ca3af] leading-relaxed mb-3 line-clamp-2">
          {contentPreview(note.content)}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {note.course && (
            <span className="text-[10px] font-semibold text-[#6b7280] bg-[#f5f5f5] border border-[#e5e7eb] rounded-md px-1.5 py-0.5 tracking-wide">
              {note.course.code}
            </span>
          )}
          {note.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] text-[#9ca3af] bg-[#f5f5f5] border border-[#e5e7eb] rounded-full px-2 py-0.5 flex items-center gap-1">
              <Tag size={9} /> {tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-[10px] text-[#9ca3af]">+{note.tags.length - 3}</span>
          )}
        </div>
        <span className="text-[10px] text-[#b0b7c3] flex-shrink-0">{relativeDate(note.updatedAt)}</span>
      </div>
    </div>
  );
}

interface NewNoteFormProps {
  courses?: ReturnType<typeof useCourses>["data"];
  onSubmit: (title: string, courseId: string, tags: string[]) => Promise<void>;
  onCancel: () => void;
}

function NewNoteForm({ courses, onSubmit, onCancel }: NewNoteFormProps) {
  const [title, setTitle]     = useState("");
  const [courseId, setCourse] = useState(courses?.[0]?.id ?? "");
  const [tagInput, setTag]    = useState("");
  const [tags, setTags]       = useState<string[]>([]);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  function addTag(val: string) {
    const t = val.trim().toLowerCase().replace(/,/g, "");
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTag("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) return setError("Title is required.");
    if (!courseId)     return setError("Please select a course.");
    setLoading(true);
    try {
      await onSubmit(title.trim(), courseId, tags);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4">
        <FloatingInput label="Note title" value={title} onChange={setTitle} disabled={loading} />

        <Select label="Course" value={courseId} onChange={e => setCourse(e.target.value)} disabled={loading}>
          {!courses?.length && <option value="">No courses yet</option>}
          {courses?.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
        </Select>

        {/* Tag input */}
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {tags.map(t => (
              <span key={t} className="inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5" style={{ background: "#1e1e1e", border: "1px solid #333", color: "#a1a1aa" }}>
                {t}
                <button type="button" onClick={() => setTags(p => p.filter(x => x !== t))} aria-label={`Remove tag ${t}`} className="hover:opacity-80 transition-opacity" style={{ color: "#71717a" }}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <FloatingInput
            label="Add tag (Enter or comma)"
            value={tagInput}
            onChange={setTag}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
            }}
            disabled={loading}
          />
        </div>

        {error && <p className="error-slide text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button type="submit" size="sm" loading={loading}>Create &amp; open</Button>
        </div>
      </div>
    </form>
  );
}

export default function NotesPage() {
  const navigate = useNavigate();
  const toast    = useToast();
  const { data: semesters }          = useSemesters();
  const { data: allCourses }         = useCourses();
  const { data: notes, isLoading }   = useNotes();
  const createNote                   = useCreateNote();
  const deleteNote                   = useDeleteNote();

  const [semesterFilter, setSemesterFilter] = useState("");
  const [courseFilter, setCourseFilter]     = useState("");
  const [tagFilter, setTagFilter]           = useState("");
  const [search, setSearch]                 = useState("");
  const [sortBy, setSortBy]                 = useState<SortKey>("updatedAt");
  const [showCreate, setShowCreate]         = useState(false);
  const [deletingNote, setDeletingNote]     = useState<Note | null>(null);

  const filteredCourses = useMemo(() => {
    if (!allCourses) return [];
    return semesterFilter ? allCourses.filter(c => c.semesterId === semesterFilter) : allCourses;
  }, [allCourses, semesterFilter]);

  // All unique tags across all notes
  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes?.forEach(n => n.tags.forEach(t => set.add(t)));
    return [...set].sort();
  }, [notes]);

  const filtered = useMemo(() => {
    let list = notes ?? [];
    if (courseFilter) list = list.filter(n => n.courseId === courseFilter);
    if (tagFilter)    list = list.filter(n => n.tags.includes(tagFilter));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      if (sortBy === "title")     return a.title.localeCompare(b.title);
      if (sortBy === "createdAt") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, courseFilter, tagFilter, search, sortBy]);

  const activeFilters = [courseFilter, tagFilter, search.trim()].filter(Boolean).length;

  return (
    <div className="p-6 sm:p-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#111] tracking-tight">Notes</h2>
          <p className="text-sm text-[#9ca3af] mt-0.5">
            {filtered.length} note{filtered.length !== 1 ? "s" : ""}
            {activeFilters > 0 && <span className="ml-1">· {activeFilters} filter{activeFilters > 1 ? "s" : ""} active</span>}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> New note
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or tag…" className="w-52" />

        <Select value={semesterFilter} onChange={e => { setSemesterFilter(e.target.value); setCourseFilter(""); }} className="w-40">
          <option value="">All semesters</option>
          {semesters?.map(s => <option key={s.id} value={s.id}>{s.name}{s.year != null ? ` (${s.year})` : ""}</option>)}
        </Select>

        <Select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} className="w-44">
          <option value="">All courses</option>
          {filteredCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>

        {allTags.length > 0 && (
          <Select value={tagFilter} onChange={e => setTagFilter(e.target.value)} className="w-36">
            <option value="">All tags</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        )}

        <Select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)} className="w-40">
          <option value="updatedAt">Sort: Last modified</option>
          <option value="createdAt">Sort: Created date</option>
          <option value="title">Sort: Title</option>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && <SkeletonList count={6} layout="grid" cardHeight={128} />}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={<FileText size={18} className="text-[#9ca3af]" strokeWidth={1.6} />}
          title={activeFilters > 0 ? "No notes match your filters" : "No notes yet"}
          description={
            activeFilters > 0
              ? "Try adjusting your search or filters."
              : "Start capturing your ideas and course notes."
          }
        />
      )}

      {/* Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(n => (
            <NoteCard
              key={n.id}
              note={n}
              onDelete={() => setDeletingNote(n)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New note">
        <NewNoteForm
          courses={allCourses}
          onSubmit={async (title, courseId, tags) => {
            const note = await createNote.mutateAsync({ title, courseId, tags, content: "" });
            setShowCreate(false);
            navigate(`/notes/${note.id}`);
          }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deletingNote} onClose={() => setDeletingNote(null)} title="Delete note" maxWidth={400}>
        <p className="text-sm text-[#6b7280] mb-5">
          Delete <strong>{deletingNote?.title || "Untitled"}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDeletingNote(null)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleteNote.isPending}
            onClick={async () => {
              if (!deletingNote) return;
              try {
                await deleteNote.mutateAsync({ id: deletingNote.id, courseId: deletingNote.courseId });
                setDeletingNote(null);
                toast.success("Note deleted.");
              } catch {
                toast.error("Failed to delete note.");
              }
            }}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
