import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import MDEditor from "@uiw/react-md-editor";
import { ArrowLeft, X, Check, AlertCircle, Columns2, Eye, FileEdit } from "lucide-react";
import { useNote, useUpdateNote } from "../hooks/api/notes";
import { useToast } from "../hooks/useToast";

import "@uiw/react-md-editor/markdown-editor.css";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";
type EditorMode = "write" | "preview" | "split";

// ─────────────────────────────────────────────────────────────────────────────
// Save indicator
// ─────────────────────────────────────────────────────────────────────────────
function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  return (
    <span
      className={`flex items-center gap-1.5 text-xs transition-all duration-200 ${
        status === "saving"
          ? "text-[#9ca3af]"
          : status === "saved"
            ? "text-[#10b981]"
            : status === "error"
              ? "text-red-500"
              : "text-[#9ca3af]"
      }`}
    >
      {status === "saving" && (
        <span className="w-3 h-3 border border-[#9ca3af] border-t-transparent rounded-full animate-spin" />
      )}
      {status === "saved" && <Check size={13} strokeWidth={2.5} />}
      {status === "error" && <AlertCircle size={13} />}
      {status === "saving"
        ? "Saving…"
        : status === "saved"
          ? "Saved"
          : status === "error"
            ? "Save failed"
            : "Unsaved changes"}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tag chip input
// ─────────────────────────────────────────────────────────────────────────────
function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function add(val: string) {
    const t = val.trim().toLowerCase().replace(/,/g, "");
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
  }

  return (
    <div>
      <p
        className="text-[10px] font-semibold uppercase tracking-widest mb-2"
        style={{ color: "#52525b" }}
      >
        Tags
      </p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5"
            style={{
              background: "#1e1e1e",
              border: "1px solid #333",
              color: "#a1a1aa",
            }}
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(tags.filter((x) => x !== t))}
              aria-label={`Remove tag ${t}`}
              style={{ color: "#52525b" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f0f0f0")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}
            >
              <X size={9} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(input);
          }
          if (e.key === "Backspace" && !input && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        placeholder="Add tag…"
        className="w-full text-xs rounded-lg px-3 py-2 outline-none transition-all duration-150"
        style={{
          background: "#1a1a1a",
          border: "1px solid #333",
          color: "#f0f0f0",
          colorScheme: "dark",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.45)";
          e.currentTarget.style.background = "#1e1e1e";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#333";
          e.currentTarget.style.background = "#1a1a1a";
          if (input.trim()) add(input);
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Editor mode toggle
// ─────────────────────────────────────────────────────────────────────────────
function ModeToggle({
  mode,
  onChange,
}: {
  mode: EditorMode;
  onChange: (m: EditorMode) => void;
}) {
  const opts: { key: EditorMode; icon: React.ReactNode; label: string }[] = [
    { key: "write", icon: <FileEdit size={13} />, label: "Write" },
    { key: "split", icon: <Columns2 size={13} />, label: "Split" },
    { key: "preview", icon: <Eye size={13} />, label: "Preview" },
  ];
  return (
    <div
      className="inline-flex items-center rounded-lg p-0.5 gap-0.5"
      style={{ background: "#1a1a1a", border: "1px solid #2e2e2e" }}
    >
      {opts.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-all duration-150"
          style={
            mode === o.key
              ? {
                  background: "#2e2e2e",
                  color: "#f0f0f0",
                  fontWeight: 500,
                  border: "1px solid #3a3a3a",
                }
              : {
                  color: "#52525b",
                  background: "transparent",
                  border: "1px solid transparent",
                }
          }
          onMouseEnter={(e) => {
            if (mode !== o.key) e.currentTarget.style.color = "#a1a1aa";
          }}
          onMouseLeave={(e) => {
            if (mode !== o.key) e.currentTarget.style.color = "#52525b";
          }}
        >
          {o.icon} {o.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
const AUTOSAVE_DELAY = 3000;

const PREVIEW_MODE: Record<EditorMode, "edit" | "preview" | "live"> = {
  write: "edit",
  preview: "preview",
  split: "live",
};

export default function NoteEditorPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  useDocumentTitle(location.pathname);
  const toast = useToast();

  const { data: note, isLoading } = useNote(id!);
  const updateNote = useUpdateNote(id!);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const [mode, setMode] = useState<EditorMode>("write");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [hydrated, setHydrated] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const pendingRef = useRef<{
    title: string;
    content: string;
    tags: string[];
  } | null>(null);

  // ── Seed local state from server ────────────────────────────────────────
  useEffect(() => {
    if (note && !hydrated) {
      setTitle(note.title);
      setContent(note.content ?? "");
      setTags(note.tags ?? []);
      setHydrated(true);
    }
  }, [note, hydrated]);

  // ── Core save function ───────────────────────────────────────────────────
  const doSave = useCallback(
    async (payload: { title: string; content: string; tags: string[] }) => {
      setSaveStatus("saving");
      try {
        await updateNote.mutateAsync({
          title: payload.title || "Untitled",
          content: payload.content,
          tags: payload.tags,
        });
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
        toast.error("Failed to save note.");
      }
    },
    [updateNote, toast]
  );

  // ── Schedule debounced auto-save ─────────────────────────────────────────
  const scheduleAutoSave = useCallback(
    (newTitle: string, newContent: string, newTags: string[]) => {
      setSaveStatus("unsaved");
      pendingRef.current = {
        title: newTitle,
        content: newContent,
        tags: newTags,
      };
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (pendingRef.current) doSave(pendingRef.current);
      }, AUTOSAVE_DELAY);
    },
    [doSave]
  );

  const handleTitleChange = useCallback(
    (val: string) => {
      setTitle(val);
      scheduleAutoSave(val, content, tags);
    },
    [content, tags, scheduleAutoSave]
  );

  const handleContentChange = useCallback(
    (val: string | undefined) => {
      const v = val ?? "";
      setContent(v);
      scheduleAutoSave(title, v, tags);
    },
    [title, tags, scheduleAutoSave]
  );

  const handleTagsChange = useCallback(
    (newTags: string[]) => {
      setTags(newTags);
      scheduleAutoSave(title, content, newTags);
    },
    [title, content, scheduleAutoSave]
  );

  useEffect(() => {
    return () => clearTimeout(saveTimerRef.current);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        clearTimeout(saveTimerRef.current);
        doSave({ title, content, tags });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [title, content, tags, doSave]);

  if (isLoading || !hydrated) {
    return (
      <div
        className="fixed inset-0 flex flex-col"
        style={{ background: "#111111" }}
      >
        <div
          className="h-12 flex items-center px-5 gap-4"
          style={{
            background: "#0f0f0f",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            className="w-16 h-4 rounded animate-pulse"
            style={{ background: "#222" }}
          />
          <div
            className="w-48 h-4 rounded animate-pulse"
            style={{ background: "#222" }}
          />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div
            className="w-60 p-5 space-y-4"
            style={{
              background: "#0a0a0a",
              borderRight: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 rounded animate-pulse"
                style={{ background: "#1a1a1a" }}
              />
            ))}
          </div>
          <div className="flex-1 p-8">
            <div
              className="h-full rounded animate-pulse"
              style={{ background: "#1a1a1a" }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col z-50 note-editor-page"
      style={{ background: "#111111" }}
      data-color-mode="dark"
    >
      <header
        className="h-12 flex-shrink-0 flex items-center justify-between gap-4 px-5"
        style={{
          background: "#0f0f0f",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={() => navigate("/notes")}
            className="flex items-center gap-1.5 text-xs transition-colors flex-shrink-0"
            style={{ color: "#52525b" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}
          >
            <ArrowLeft size={13} /> Notes
          </button>
          <span className="select-none" style={{ color: "#2e2e2e" }}>
            /
          </span>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="flex-1 min-w-0 bg-transparent text-sm font-semibold outline-none truncate"
            style={{ color: "#f0f0f0" }}
          />
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <SaveIndicator status={saveStatus} />
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden min-h-0">
        <aside
          className="w-60 flex-shrink-0 flex flex-col gap-6 px-5 py-6 overflow-y-auto"
          style={{
            background: "#0a0a0a",
            borderRight: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <TagInput tags={tags} onChange={handleTagsChange} />

          {note && (
            <div
              className="mt-auto pt-4 space-y-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-[10px]" style={{ color: "#3f3f46" }}>
                Created{" "}
                {new Date(note.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-[10px]" style={{ color: "#3f3f46" }}>
                Modified{" "}
                {new Date(note.updatedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-[10px]" style={{ color: "#3f3f46" }}>
                {content.split(/\s+/).filter(Boolean).length} words
              </p>
            </div>
          )}
        </aside>

        <div
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
          style={{ background: "#111111" }}
        >
          <div className="flex-1 min-h-0 overflow-hidden px-6 py-5 note-editor-main">
            <MDEditor
              value={content}
              onChange={handleContentChange}
              preview={PREVIEW_MODE[mode]}
              hideToolbar={false}
              visibleDragbar={false}
              minHeight={700}
              enableScroll={true}
              className="note-editor"
              textareaProps={{
                placeholder:
                  "# Note title\n\nStart writing in Markdown…\n\nUse **bold**, *italic*, `code`, and > blockquotes.\n\n- Lists work too",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
