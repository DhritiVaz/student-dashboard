import { useCallback, useEffect, useRef, useState } from "react";
import {
  Brain, Type, Paperclip, Trash2, Download,
  ImageIcon, FileText, File, X, ChevronDown, ChevronUp,
} from "lucide-react";
import { useToast } from "../hooks/useToast";
import {
  useMindspaceEntries,
  useCreateTextEntry,
  useUploadMindspaceFile,
  useDeleteMindspaceEntry,
  fetchMindspaceBlob,
  type MindspaceEntry,
} from "../hooks/api/mindspace";

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs  = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });

  let relative: string;
  if (diffMins < 1)   relative = "just now";
  else if (diffMins < 60)  relative = `${diffMins}m ago`;
  else if (diffHrs < 24)   relative = `${diffHrs}h ago`;
  else if (diffDays === 1) relative = "yesterday";
  else if (diffDays < 7)   relative = `${diffDays}d ago`;
  else relative = date;

  return { relative, absolute: `${date} at ${time}` };
}

function isImage(mimeType: string | null) {
  return !!mimeType?.startsWith("image/");
}

function isPdf(mimeType: string | null) {
  return mimeType === "application/pdf";
}

function fileIcon(mimeType: string | null, _originalName: string | null) {
  if (isImage(mimeType)) return ImageIcon;
  if (isPdf(mimeType))   return FileText;
  return File;
}

// ─── Image preview with authenticated fetch ────────────────────────────────

function ImagePreview({ id }: { id: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let url: string | null = null;
    fetchMindspaceBlob(id, "view")
      .then(blob => {
        url = URL.createObjectURL(blob);
        setSrc(url);
      })
      .catch(() => setErr(true));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [id]);

  if (err) return (
    <div className="flex items-center justify-center h-36 rounded-lg text-xs"
      style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.3)" }}>
      Preview unavailable
    </div>
  );
  if (!src) return (
    <div className="h-36 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
  );
  return (
    <img
      src={src}
      alt="preview"
      className="w-full max-h-64 object-contain rounded-lg"
      style={{ background: "rgba(255,255,255,0.03)" }}
    />
  );
}

// ─── Entry card ─────────────────────────────────────────────────────────────

function EntryCard({
  entry,
  onDelete,
}: {
  entry: MindspaceEntry;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ts = formatDateTime(entry.createdAt);

  const isText  = entry.type === "text";
  const isImg   = entry.type === "file" && isImage(entry.mimeType);
  const isPDF   = entry.type === "file" && isPdf(entry.mimeType);
  const isFile  = entry.type === "file";
  const Icon    = isText ? Type : fileIcon(entry.mimeType, entry.originalName);

  const bodyLines = (entry.body ?? "").split("\n");
  const longText = bodyLines.length > 6 || (entry.body ?? "").length > 400;
  const displayBody = !expanded && longText
    ? bodyLines.slice(0, 6).join("\n").slice(0, 400) + "…"
    : (entry.body ?? "");

  async function handleDownload() {
    try {
      const blob = await fetchMindspaceBlob(entry.id, "download");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = entry.originalName ?? "file";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* silently ignore */
    }
  }

  return (
    <div
      className="rounded-xl transition-all duration-150"
      style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-2.5 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="flex items-center justify-center rounded-md flex-shrink-0"
          style={{ width: 26, height: 26, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Icon size={13} style={{ color: "rgba(255,255,255,0.45)" }} />
        </div>

        <div className="flex-1 min-w-0">
          {entry.title && (
            <p className="text-xs font-semibold truncate" style={{ color: "rgba(255,255,255,0.75)" }}>
              {entry.title}
            </p>
          )}
          <p
            className="text-xs"
            style={{ color: "rgba(255,255,255,0.3)" }}
            title={ts.absolute}
          >
            {ts.absolute}
          </p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {isFile && (
            <button
              type="button"
              onClick={handleDownload}
              title="Download"
              className="flex items-center justify-center rounded-md transition-colors"
              style={{ width: 28, height: 28, color: "rgba(255,255,255,0.3)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
            >
              <Download size={13} />
            </button>
          )}

          {confirmDelete ? (
            <>
              <button
                type="button"
                onClick={onDelete}
                className="text-xs px-2 py-1 rounded-md font-medium transition-colors"
                style={{ background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.25)" }}
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex items-center justify-center rounded-md transition-colors"
                style={{ width: 28, height: 28, color: "rgba(255,255,255,0.3)" }}
              >
                <X size={13} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              title="Delete"
              className="flex items-center justify-center rounded-md transition-colors"
              style={{ width: 28, height: 28, color: "rgba(255,255,255,0.2)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {isImg && <ImagePreview id={entry.id} />}

        {isPDF && (
          <div
            className="flex items-center gap-3 rounded-lg px-3 py-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <FileText size={20} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate" style={{ color: "rgba(255,255,255,0.7)" }}>{entry.originalName}</p>
              {entry.sizeBytes != null && (
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{formatSize(entry.sizeBytes)}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="text-xs px-2 py-1 rounded-md transition-colors flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.09)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
            >
              Download
            </button>
          </div>
        )}

        {isFile && !isImg && !isPDF && (
          <div
            className="flex items-center gap-3 rounded-lg px-3 py-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <File size={20} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate" style={{ color: "rgba(255,255,255,0.7)" }}>{entry.originalName}</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                {entry.mimeType ?? "Unknown type"}{entry.sizeBytes != null ? ` · ${formatSize(entry.sizeBytes)}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="text-xs px-2 py-1 rounded-md transition-colors flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.09)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
            >
              Download
            </button>
          </div>
        )}

        {isText && (
          <div>
            <pre
              className="text-sm whitespace-pre-wrap break-words font-sans leading-relaxed"
              style={{ color: "rgba(255,255,255,0.72)" }}
            >
              {displayBody}
            </pre>
            {longText && (
              <button
                type="button"
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1 mt-2 text-xs transition-colors"
                style={{ color: "rgba(255,255,255,0.35)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
              >
                {expanded
                  ? <><ChevronUp size={12} /> Show less</>
                  : <><ChevronDown size={12} /> Show more</>
                }
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Composer ──────────────────────────────────────────────────────────────

type Mode = "text" | "file";

function Composer({ onSuccess }: { onSuccess: () => void }) {
  const toast = useToast();
  const createText  = useCreateTextEntry();
  const uploadFile  = useUploadMindspaceFile();

  const [mode, setMode]       = useState<Mode>("text");
  const [textBody, setTextBody] = useState("");
  const [dragging, setDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textRef      = useRef<HTMLTextAreaElement>(null);

  const busy = createText.isPending || uploadFile.isPending;

  async function submitText() {
    const body = textBody.trim();
    if (!body) return;
    try {
      await createText.mutateAsync({ body });
      setTextBody("");
      textRef.current?.focus();
      onSuccess();
    } catch {
      toast.error("Could not save entry.");
    }
  }

  async function uploadFiles(files: File[]) {
    if (!files.length) return;
    const results = await Promise.allSettled(
      files.map(f => {
        const fd = new FormData();
        fd.append("file", f);
        return uploadFile.mutateAsync(fd);
      })
    );
    const failed = results.filter(r => r.status === "rejected").length;
    if (failed > 0) toast.error(`${failed} file(s) failed to upload.`);
    if (failed < files.length) onSuccess();
    setPendingFiles([]);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) {
      setPendingFiles(files);
      uploadFiles(files);
    }
    e.target.value = "";
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) {
      setMode("file");
      setPendingFiles(files);
      uploadFiles(files);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submitText();
    }
  }

  return (
    <div
      className="rounded-xl transition-all duration-150"
      style={{
        background: "#111",
        border: "1.5px solid " + (dragging ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.09)"),
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Mode tabs */}
      <div
        className="flex items-center gap-0.5 px-3 pt-3 pb-0"
      >
        {([["text", "Text", Type], ["file", "Attach file", Paperclip]] as const).map(([m, label, Icon]) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{
              background: mode === m ? "rgba(255,255,255,0.08)" : "transparent",
              color: mode === m ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)",
            }}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {mode === "text" ? (
        <div className="p-3 pt-2">
          <textarea
            ref={textRef}
            value={textBody}
            onChange={e => setTextBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write something… (⌘Enter to save)"
            rows={4}
            className="w-full resize-none text-sm outline-none bg-transparent leading-relaxed placeholder:text-white/20"
            style={{ color: "rgba(255,255,255,0.8)" }}
          />
          <div className="flex justify-end mt-1">
            <button
              type="button"
              onClick={submitText}
              disabled={!textBody.trim() || busy}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "rgba(255,255,255,0.9)",
                color: "#111",
              }}
            >
              {createText.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 pt-2">
          {dragging ? (
            <div
              className="flex flex-col items-center justify-center rounded-xl py-10 text-center"
              style={{ border: "1.5px dashed rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.03)" }}
            >
              <Paperclip size={22} style={{ color: "rgba(255,255,255,0.4)", marginBottom: 8 }} />
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Drop to upload</p>
            </div>
          ) : uploadFile.isPending ? (
            <div className="flex items-center gap-3 py-6 justify-center">
              <div className="css-spinner" />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                Uploading {pendingFiles.length > 1 ? `${pendingFiles.length} files…` : "file…"}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center rounded-xl py-8 text-center transition-colors"
              style={{ border: "1.5px dashed rgba(255,255,255,0.1)", background: "transparent" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.22)";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.02)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              <Paperclip size={20} style={{ color: "rgba(255,255,255,0.25)", marginBottom: 8 }} />
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                Click to attach, or drag & drop anywhere
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>
                Images, PDFs, documents — anything up to 40 MB
              </p>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function MindspacePage() {
  const { data: entries = [], isLoading } = useMindspaceEntries();
  const deleteEntry = useDeleteMindspaceEntry();
  const toast = useToast();
  function handleSuccess() {
    // reserved for future scroll-to-top or flash animation
  }

  async function handleDelete(id: string) {
    try {
      await deleteEntry.mutateAsync(id);
      toast.success("Entry deleted.");
    } catch {
      toast.error("Could not delete entry.");
    }
  }

  return (
    <div className="p-6 sm:p-8 w-full min-w-0">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-2">
          <Brain size={19} style={{ color: "rgba(255,255,255,0.35)" }} />
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.95)" }}>
            Mindspace
          </h1>
        </div>
        <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.35)" }}>
          A scratchpad for anything — text, images, PDFs, files. Review later.
        </p>

        {/* Composer */}
        <div className="mb-8">
          <Composer onSuccess={handleSuccess} />
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: "#111" }} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-xl text-center"
            style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <Brain size={32} className="mb-3" style={{ color: "rgba(255,255,255,0.1)" }} />
            <p className="text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              Nothing captured yet
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
              Write a note or drop a file above to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onDelete={() => handleDelete(entry.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
