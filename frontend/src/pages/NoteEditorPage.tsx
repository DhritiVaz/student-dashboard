import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import MDEditor from "@uiw/react-md-editor";
import { ArrowLeft, X, Check, AlertCircle, Columns2, Eye, FileEdit } from "lucide-react";
import { useNote, useUpdateNote } from "../hooks/api/notes";
import { useToast } from "../hooks/useToast";
import { useTheme } from "../ThemeContext";

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
  isDark,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  isDark: boolean;
}) {
  const [input, setInput] = useState("");

  const tagBg = isDark ? "#1e1e1e" : "#f3f4f6";
  const tagBorder = isDark ? "#333" : "#d1d5db";
  const tagText = isDark ? "#a1a1aa" : "#374151";
  const tagRemove = isDark ? "#52525b" : "#9ca3af";
  const tagRemoveHover = isDark ? "#f0f0f0" : "#111827";
  const inputBg = isDark ? "#1a1a1a" : "#ffffff";
  const inputBorder = isDark ? "#333" : "#d1d5db";
  const inputText = isDark ? "#f0f0f0" : "#111827";
  const inputBorderFocus = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)";
  const inputBgFocus = isDark ? "#1e1e1e" : "#f9fafb";
  const labelColor = isDark ? "#52525b" : "#9ca3af";

  function add(val: string) {
    const t = val.trim().toLowerCase().replace(/,/g, "");
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
  }

  return (
    <div>
      <p
        className="text-[10px] font-semibold uppercase tracking-widest mb-2"
        style={{ color: labelColor }}
      >
        Tags
      </p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5"
            style={{ background: tagBg, border: `1px solid ${tagBorder}`, color: tagText }}
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(tags.filter((x) => x !== t))}
              aria-label={`Remove tag ${t}`}
              style={{ color: tagRemove }}
              onMouseEnter={(e) => (e.currentTarget.style.color = tagRemoveHover)}
              onMouseLeave={(e) => (e.currentTarget.style.color = tagRemove)}
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
          background: inputBg,
          border: `1px solid ${inputBorder}`,
          color: inputText,
          colorScheme: isDark ? "dark" : "light",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = inputBorderFocus;
          e.currentTarget.style.background = inputBgFocus;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = inputBorder;
          e.currentTarget.style.background = inputBg;
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
  isDark,
}: {
  mode: EditorMode;
  onChange: (m: EditorMode) => void;
  isDark: boolean;
}) {
  const containerBg = isDark ? "#1a1a1a" : "#f3f4f6";
  const containerBorder = isDark ? "#2e2e2e" : "#e5e7eb";
  const activeBg = isDark ? "#2e2e2e" : "#ffffff";
  const activeColor = isDark ? "#f0f0f0" : "#111827";
  const activeBorder = isDark ? "#3a3a3a" : "#d1d5db";
  const inactiveColor = isDark ? "#52525b" : "#6b7280";
  const inactiveHover = isDark ? "#a1a1aa" : "#374151";

  const opts: { key: EditorMode; icon: React.ReactNode; label: string }[] = [
    { key: "write", icon: <FileEdit size={13} />, label: "Write" },
    { key: "split", icon: <Columns2 size={13} />, label: "Split" },
    { key: "preview", icon: <Eye size={13} />, label: "Preview" },
  ];
  return (
    <div
      className="inline-flex items-center rounded-lg p-0.5 gap-0.5"
      style={{ background: containerBg, border: `1px solid ${containerBorder}` }}
    >
      {opts.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-all duration-150"
          style={
            mode === o.key
              ? { background: activeBg, color: activeColor, fontWeight: 500, border: `1px solid ${activeBorder}` }
              : { color: inactiveColor, background: "transparent", border: "1px solid transparent" }
          }
          onMouseEnter={(e) => {
            if (mode !== o.key) e.currentTarget.style.color = inactiveHover;
          }}
          onMouseLeave={(e) => {
            if (mode !== o.key) e.currentTarget.style.color = inactiveColor;
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
  const { theme } = useTheme();
  const isDark = theme === "dark";

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

  // Theme colors
  const pageBg     = isDark ? "#111111" : "#ffffff";
  const headerBg   = isDark ? "#0f0f0f" : "#f4f4f5";
  const headerBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
  const sidebarBg  = isDark ? "#0a0a0a" : "#f4f4f5";
  const sidebarBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
  const backColor  = isDark ? "#52525b" : "#9ca3af";
  const backHover  = isDark ? "#a1a1aa" : "#374151";
  const separatorColor = isDark ? "#2e2e2e" : "#e5e7eb";
  const titleColor = isDark ? "#f0f0f0" : "#111827";
  const metaColor  = isDark ? "#3f3f46" : "#9ca3af";
  const metaBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

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
      pendingRef.current = { title: newTitle, content: newContent, tags: newTags };
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (pendingRef.current) doSave(pendingRef.current);
      }, AUTOSAVE_DELAY);
    },
    [doSave]
  );

  const handleTitleChange = useCallback(
    (val: string) => { setTitle(val); scheduleAutoSave(val, content, tags); },
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
    (newTags: string[]) => { setTags(newTags); scheduleAutoSave(title, content, newTags); },
    [title, content, scheduleAutoSave]
  );

  useEffect(() => { return () => clearTimeout(saveTimerRef.current); }, []);

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

  const skeletonBg = isDark ? "#222" : "#e5e7eb";
  const skeletonPulse = isDark ? "#1a1a1a" : "#f3f4f6";

  if (isLoading || !hydrated) {
    return (
      <div className="fixed inset-0 flex flex-col" style={{ background: pageBg }}>
        <div
          className="h-12 flex items-center px-5 gap-4"
          style={{ background: headerBg, borderBottom: `1px solid ${headerBorder}` }}
        >
          <div className="w-16 h-4 rounded animate-pulse" style={{ background: skeletonBg }} />
          <div className="w-48 h-4 rounded animate-pulse" style={{ background: skeletonBg }} />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div
            className="w-60 p-5 space-y-4"
            style={{ background: sidebarBg, borderRight: `1px solid ${sidebarBorder}` }}
          >
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 rounded animate-pulse" style={{ background: skeletonPulse }} />
            ))}
          </div>
          <div className="flex-1 p-8">
            <div className="h-full rounded animate-pulse" style={{ background: skeletonPulse }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col z-50 note-editor-page"
      style={{ background: pageBg }}
      data-color-mode={isDark ? "dark" : "light"}
    >
      <header
        className="h-12 flex-shrink-0 flex items-center justify-between gap-4 px-5"
        style={{ background: headerBg, borderBottom: `1px solid ${headerBorder}` }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={() => navigate("/notes")}
            className="flex items-center gap-1.5 text-xs transition-colors flex-shrink-0"
            style={{ color: backColor }}
            onMouseEnter={(e) => (e.currentTarget.style.color = backHover)}
            onMouseLeave={(e) => (e.currentTarget.style.color = backColor)}
          >
            <ArrowLeft size={13} /> Notes
          </button>
          <span className="select-none" style={{ color: separatorColor }}>/</span>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="flex-1 min-w-0 bg-transparent text-sm font-semibold outline-none truncate"
            style={{ color: titleColor }}
          />
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <SaveIndicator status={saveStatus} />
          <ModeToggle mode={mode} onChange={setMode} isDark={isDark} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden min-h-0">
        <aside
          className="w-60 flex-shrink-0 flex flex-col gap-6 px-5 py-6 overflow-y-auto"
          style={{ background: sidebarBg, borderRight: `1px solid ${sidebarBorder}` }}
        >
          <TagInput tags={tags} onChange={handleTagsChange} isDark={isDark} />

          {note && (
            <div
              className="mt-auto pt-4 space-y-2"
              style={{ borderTop: `1px solid ${metaBorder}` }}
            >
              <p className="text-[10px]" style={{ color: metaColor }}>
                Created{" "}
                {new Date(note.createdAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </p>
              <p className="text-[10px]" style={{ color: metaColor }}>
                Modified{" "}
                {new Date(note.updatedAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </p>
              <p className="text-[10px]" style={{ color: metaColor }}>
                {content.split(/\s+/).filter(Boolean).length} words
              </p>
            </div>
          )}
        </aside>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ background: pageBg }}>
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
