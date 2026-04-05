import {
  useState,
  useEffect,
  useRef,
  useCallback,
  KeyboardEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  BookOpen,
  ClipboardList,
  FileText,
  CheckSquare,
  Clock,
} from "lucide-react";
import { api } from "../lib/api";
import { useTheme } from "../ThemeContext";

/* ─── Types ─────────────────────────────────────────────────── */
interface CoursResult {
  id: string;
  name: string;
  code: string;
  semester?: { id: string; name: string; year?: number | null } | null;
}
interface AssignResult {
  id: string;
  title: string;
  dueDate: string | null;
  isSubmitted: boolean;
  course: { id: string; name: string; code: string };
}
interface NoteResult {
  id: string;
  title: string;
  course: { id: string; name: string; code: string };
}
interface TaskResult {
  id: string;
  title: string;
  dueDate: string | null;
  priority: string;
  isCompleted: boolean;
}
interface SearchResults {
  courses: CoursResult[];
  assignments: AssignResult[];
  notes: NoteResult[];
  tasks: TaskResult[];
}

/* ─── flat union for keyboard navigation ────────────────────── */
type FlatItem =
  | { kind: "course";     data: CoursResult }
  | { kind: "assignment"; data: AssignResult }
  | { kind: "note";       data: NoteResult }
  | { kind: "task";       data: TaskResult };

function flatten(r: SearchResults | undefined): FlatItem[] {
  if (!r) return [];
  return [
    ...(r.courses ?? []).map((d) => ({ kind: "course" as const,     data: d })),
    ...(r.assignments ?? []).map((d) => ({ kind: "assignment" as const, data: d })),
    ...(r.notes ?? []).map((d) => ({ kind: "note" as const,       data: d })),
    ...(r.tasks ?? []).map((d) => ({ kind: "task" as const,        data: d })),
  ];
}

function itemPath(item: FlatItem): string {
  switch (item.kind) {
    case "course":     return `/courses/${item.data.id}`;
    case "assignment": return `/assignments/${item.data.id}`;
    case "note":       return `/notes/${item.data.id}`;
    case "task":       return `/tasks`;
  }
}

function fmtDate(d: string | null) {
  if (!d) return null;
  const date = new Date(d);
  const now = new Date();
  const diff = Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff <= 6) return `In ${diff} days`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ─── Section header ─────────────────────────────────────────── */
function SectionLabel({ icon, label, isDark }: { icon: React.ReactNode; label: string; isDark: boolean }) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 pt-3 pb-1"
      style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)" }}
    >
      {icon}
      <span className="text-[10px] font-semibold uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

/* ─── Individual result row ──────────────────────────────────── */
function ResultRow({
  primary,
  secondary,
  active,
  onMouseEnter,
  onClick,
  isDark,
}: {
  primary: string;
  secondary: string;
  active: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
  isDark: boolean;
}) {
  return (
    <button
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2 gap-3 text-left transition-colors"
      style={{
        background: active ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)") : "transparent",
        borderRadius: 6,
      }}
    >
      <span
        className="text-[13px] font-medium truncate"
        style={{ color: active ? (isDark ? "#fff" : "#111") : (isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.75)") }}
      >
        {primary}
      </span>
      <span
        className="text-[11px] shrink-0"
        style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}
      >
        {secondary}
      </span>
    </button>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export function GlobalSearch() {
  const navigate  = useNavigate();
  const inputRef  = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLDivElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.9)";
  const inputBgOpen = isDark ? "rgba(255,255,255,0.08)" : "#ffffff";
  const inputBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)";
  const inputBorderOpen = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.2)";
  const inputText = isDark ? "rgba(255,255,255,0.8)" : "#111";
  const inputCaret = isDark ? "#fff" : "#111";
  const searchIcon = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)";
  const kbdBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const kbdBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)";
  const kbdText = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
  const spinnerBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const spinnerTop = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";

  const [query,    setQuery]    = useState("");
  const [debounced, setDebounced] = useState("");
  const [open,     setOpen]     = useState(false);
  const [active,   setActive]   = useState(-1);

  /* ── 300ms debounce ──────────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  /* ── Reset active when results change ─────────────────────── */
  useEffect(() => { setActive(-1); }, [debounced]);

  /* ── Cmd/Ctrl+K global shortcut ──────────────────────────── */
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ── Click-outside to close ─────────────────────────────── */
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  /* ── TanStack Query ─────────────────────────────────────── */
  const { data, isFetching } = useQuery<SearchResults>({
    queryKey: ["search", debounced],
    queryFn: async () => {
      const res = await api.get(`/search?q=${encodeURIComponent(debounced)}`);
      return res.data.data as SearchResults;
    },
    enabled: debounced.trim().length >= 2,
    staleTime: 10_000,
  });

  const items = flatten(data);
  const hasResults =
    !!data &&
    (data.courses.length > 0 ||
      data.assignments.length > 0 ||
      data.notes.length > 0 ||
      data.tasks.length > 0);

  /* ── Navigate to selected item ──────────────────────────── */
  const goTo = useCallback(
    (item: FlatItem) => {
      navigate(itemPath(item));
      setOpen(false);
      setQuery("");
      setDebounced("");
      inputRef.current?.blur();
    },
    [navigate]
  );

  /* ── Keyboard navigation ────────────────────────────────── */
  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open) return;

    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && active >= 0 && items[active]) {
      e.preventDefault();
      goTo(items[active]);
    }
  }

  /* ── Auto-scroll active item into view ──────────────────── */
  useEffect(() => {
    if (active < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-idx="${active}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  /* ── Compute flat index offset for each group ──────────── */
  const courseOffset = 0;
  const assignOffset = data ? data.courses.length : 0;
  const noteOffset   = assignOffset + (data ? data.assignments.length : 0);
  const taskOffset   = noteOffset   + (data ? data.notes.length : 0);

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={wrapRef} className="relative" style={{ width: 280 }}>
      {/* ── Search input ──────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-3 h-8 rounded-lg transition-all"
        style={{
          background: open ? inputBgOpen : inputBg,
          border: open ? `1px solid ${inputBorderOpen}` : `1px solid ${inputBorder}`,
          boxShadow: open ? (isDark ? "0 0 0 3px rgba(255,255,255,0.04)" : "0 0 0 3px rgba(0,0,0,0.06)") : "none",
        }}
      >
        <Search size={13} style={{ color: searchIcon, flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="search-results"
          aria-activedescendant={active >= 0 ? `search-result-${active}` : undefined}
          aria-label="Search courses, assignments, notes, and tasks"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search…"
          className="flex-1 bg-transparent outline-none text-[13px]"
          style={{ color: inputText, caretColor: inputCaret }}
          spellCheck={false}
          autoComplete="off"
        />

        {!open && !query && (
          <kbd
            className="hidden sm:flex items-center text-[10px] px-1 rounded gap-0.5"
            style={{
              background: kbdBg,
              color: kbdText,
              border: `1px solid ${kbdBorder}`,
              fontFamily: "inherit",
              lineHeight: "16px",
            }}
          >
            ⌘K
          </kbd>
        )}

        {isFetching && (
          <div
            className="w-3 h-3 rounded-full animate-spin flex-shrink-0"
            style={{
              border: `1.5px solid ${spinnerBorder}`,
              borderTopColor: spinnerTop,
            }}
          />
        )}
      </div>

      {/* ── Dropdown ─────────────────────────────────────── */}
      {showDropdown && (
        <div
          id="search-results"
          ref={listRef}
          role="listbox"
          className="absolute right-0 overflow-y-auto"
          style={{
            top: "calc(100% + 6px)",
            width: 380,
            maxHeight: 420,
            background: isDark ? "#141414" : "#ffffff",
            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.12)",
            borderRadius: 10,
            boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
            zIndex: 9999,
            padding: "4px 4px 8px",
          }}
        >
          {/* Loading placeholder */}
          {isFetching && !data && (
            <div
              className="flex items-center gap-2 px-3 py-4 text-[13px]"
              style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}
            >
              <Clock size={13} /> Searching…
            </div>
          )}

          {/* No results */}
          {!isFetching && debounced && !hasResults && (
            <div
              className="px-3 py-4 text-[13px]"
              style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}
            >
              No results for{" "}
              <span style={{ color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)" }}>"{debounced}"</span>
            </div>
          )}

          {/* Courses */}
          {data && data.courses.length > 0 && (
            <div>
              <SectionLabel
                icon={<BookOpen size={10} />}
                label="Courses"
                isDark={isDark}
              />
              {data.courses.map((c, i) => {
                const idx = courseOffset + i;
                return (
                  <div key={c.id} data-idx={idx} id={`search-result-${idx}`} role="option" aria-selected={active === idx}>
                    <ResultRow
                      primary={`${c.code} — ${c.name}`}
                      secondary={[c.semester?.name, c.semester?.year].filter(Boolean).join(" ") || "—"}
                      active={active === idx}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => goTo({ kind: "course", data: c })}
                      isDark={isDark}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Assignments */}
          {data && data.assignments.length > 0 && (
            <div>
              <SectionLabel
                icon={<ClipboardList size={10} />}
                label="Assignments"
                isDark={isDark}
              />
              {data.assignments.map((a, i) => {
                const idx = assignOffset + i;
                return (
                  <div key={a.id} data-idx={idx} id={`search-result-${idx}`} role="option" aria-selected={active === idx}>
                    <ResultRow
                      primary={a.title}
                      secondary={a.course.code}
                      active={active === idx}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => goTo({ kind: "assignment", data: a })}
                      isDark={isDark}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Notes */}
          {data && data.notes.length > 0 && (
            <div>
              <SectionLabel
                icon={<FileText size={10} />}
                label="Notes"
                isDark={isDark}
              />
              {data.notes.map((n, i) => {
                const idx = noteOffset + i;
                return (
                  <div key={n.id} data-idx={idx} id={`search-result-${idx}`} role="option" aria-selected={active === idx}>
                    <ResultRow
                      primary={n.title}
                      secondary={n.course.code}
                      active={active === idx}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => goTo({ kind: "note", data: n })}
                      isDark={isDark}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Tasks */}
          {data && data.tasks.length > 0 && (
            <div>
              <SectionLabel
                icon={<CheckSquare size={10} />}
                label="Tasks"
                isDark={isDark}
              />
              {data.tasks.map((t, i) => {
                const idx = taskOffset + i;
                const due = fmtDate(t.dueDate);
                return (
                  <div key={t.id} data-idx={idx} id={`search-result-${idx}`} role="option" aria-selected={active === idx}>
                    <ResultRow
                      primary={t.title}
                      secondary={due ?? t.priority}
                      active={active === idx}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => goTo({ kind: "task", data: t })}
                      isDark={isDark}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer hint */}
          {hasResults && (
            <div
              className="flex items-center gap-3 px-3 pt-3 mt-1"
              style={{
                borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
              }}
            >
              <span className="text-[10px]">↑↓ navigate</span>
              <span className="text-[10px]">↵ open</span>
              <span className="text-[10px]">esc close</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
