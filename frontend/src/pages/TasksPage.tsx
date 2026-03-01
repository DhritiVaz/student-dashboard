import { useMemo, useRef, useState } from "react";
import { Plus, CheckSquare, ChevronDown, Trash2, Pencil, AlertCircle, Circle, CheckCircle2, Calendar, Clock } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { SearchInput } from "../components/ui/SearchInput";
import { SkeletonList } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { TaskForm } from "../components/tasks/TaskForm";
import { useToast } from "../hooks/useToast";
import { useCourses } from "../hooks/api/courses";
import {
  useTasks, useCreateTask, useUpdateTask, useToggleTask, useDeleteTask,
  type Task, type Priority,
} from "../hooks/api/tasks";

// ─── Types ────────────────────────────────────────────────────────────────────
type GroupBy   = "all" | "priority" | "course" | "completed";
type SortKey   = "dueDate" | "priority" | "createdAt";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
const PRIORITY_LABEL: Record<Priority, string> = { high: "High", medium: "Medium", low: "Low" };

function priorityDot(p: Priority) {
  if (p === "high")   return "bg-red-500";
  if (p === "medium") return "bg-orange-400";
  return "bg-blue-400";
}

function dueDateStyle(iso?: string | null, done?: boolean): { label: string; cls: string } | null {
  if (!iso) return null;
  const d     = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff  = Math.round((d.setHours(0,0,0,0) - today.getTime()) / 86400000);
  if (done) return { label: formatDate(iso), cls: "text-[#9ca3af] bg-[#f5f5f5] border-[#e5e7eb]" };
  if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`, cls: "text-red-500 bg-red-50 border-red-100" };
  if (diff === 0) return { label: "Today",                      cls: "text-orange-500 bg-orange-50 border-orange-100" };
  if (diff === 1) return { label: "Tomorrow",                   cls: "text-orange-400 bg-orange-50 border-orange-100" };
  if (diff <= 7)  return { label: `${diff}d`,                   cls: "text-[#10b981] bg-[#f0fdf4] border-[#bbf7d0]" };
  return           { label: formatDate(iso),                    cls: "text-[#9ca3af] bg-[#f5f5f5] border-[#e5e7eb]" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function sortTasks(list: Task[], sortBy: SortKey): Task[] {
  return [...list].sort((a, b) => {
    if (sortBy === "priority") return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (sortBy === "createdAt") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    // dueDate: nulls last
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────
function TaskCheckbox({
  done,
  onClick,
  title,
}: {
  done: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? `Mark "${title}" as incomplete` : `Mark "${title}" as complete`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onClick();
        }
      }}
      className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-0.5 group/cb"
    >
      {done ? (
        <CheckCircle2 size={18} className="text-[#10b981]" strokeWidth={2} aria-hidden />
      ) : (
        <Circle size={18} className="text-[#d1d5db] group-hover/cb:text-[#9ca3af] transition-colors" strokeWidth={1.8} aria-hidden />
      )}
    </button>
  );
}

// ─── Task Item ────────────────────────────────────────────────────────────────
function TaskItem({
  task,
  onEdit,
  onDelete,
  onToggle,
  deleting,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  deleting: boolean;
}) {
  const due = dueDateStyle(task.dueDate, task.isCompleted);

  return (
    <div className={`group flex items-start gap-3 px-4 py-3 rounded-card border transition-all duration-150 ${
      task.isCompleted
        ? "bg-[#fafafa] border-[#f0f0f0]"
        : "bg-white border-[#e5e7eb] hover:border-[#d1d5db]"
    }`}
      style={{ boxShadow: task.isCompleted ? "none" : "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      {/* Checkbox */}
      <TaskCheckbox done={task.isCompleted} onClick={onToggle} title={task.title} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium transition-all duration-200 ${
            task.isCompleted ? "line-through text-[#9ca3af]" : "text-[#111]"
          }`}>
            {task.title}
          </span>

          {/* Priority dot */}
          {!task.isCompleted && (
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot(task.priority)}`}
              title={PRIORITY_LABEL[task.priority]}
            />
          )}

          {/* Course badge */}
          {task.course && (
            <span className="text-[10px] font-semibold text-[#6b7280] bg-[#f5f5f5] border border-[#e5e7eb] rounded-md px-1.5 py-0.5 tracking-wide flex-shrink-0">
              {task.course.code}
            </span>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <p className={`text-xs mt-0.5 truncate max-w-lg ${
            task.isCompleted ? "text-[#b0b7c3]" : "text-[#9ca3af]"
          }`}>
            {task.description}
          </p>
        )}
      </div>

      {/* Right side: due chip + actions */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
        {due && (
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium border rounded-full px-2 py-0.5 ${due.cls}`} title={due.label}>
            {due.cls.includes("red") && <AlertCircle size={10} aria-hidden />}
            {(due.label === "Today" || due.label === "Tomorrow") && <Clock size={10} aria-hidden />}
            {due.cls.includes("green") && <Calendar size={10} aria-hidden />}
            {due.label}
          </span>
        )}

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            aria-label="Edit task"
            className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#111] hover:bg-[#f5f5f5] transition-colors"
          >
            <Pencil size={12} aria-hidden />
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            aria-label="Delete task"
            className="group/btn p-1.5 rounded-lg text-[#9ca3af] hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
          >
            <Trash2 size={12} aria-hidden className="text-inherit group-hover/btn:text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section accordion ────────────────────────────────────────────────────────
function Section({
  title,
  count,
  defaultOpen = true,
  children,
  accent,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  accent?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={`section-${title}`}
        className="w-full flex items-center gap-2 py-2 mb-1 text-left group"
      >
        <span className={`flex-shrink-0 transition-transform duration-150 ${open ? "rotate-0" : "-rotate-90"}`}>
          <ChevronDown size={14} className="text-[#9ca3af]" />
        </span>
        {accent && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${accent}`} />}
        <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">{title}</span>
        <span className="text-xs text-[#9ca3af] ml-1">{count}</span>
      </button>
      {open && <div id={`section-${title}`} className="space-y-1.5" role="region" aria-label={title}>{children}</div>}
    </div>
  );
}

// ─── Quick-add input ──────────────────────────────────────────────────────────
function QuickAdd({ onAdd }: { onAdd: (title: string) => Promise<void> }) {
  const [value, setValue] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit() {
    const t = value.trim();
    if (!t) return;
    setAdding(true);
    try {
      await onAdd(t);
      setValue("");
      inputRef.current?.focus();
    } finally {
      setAdding(false);
    }
  }

  return (
    <div
      className="flex items-center gap-2 rounded-card px-4 py-3 mb-6 transition-all duration-150"
      style={{
        background: "#1e1e1e",
        border: "1px solid #333",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }}
      onFocusIn={e => {
        const el = e.currentTarget;
        if (el.contains(document.activeElement)) {
          el.style.borderColor = "rgba(255,255,255,0.5)";
          el.style.boxShadow = "0 0 0 3px rgba(255,255,255,0.06)";
        }
      }}
      onFocusOut={e => {
        const el = e.currentTarget;
        if (!el.contains(document.activeElement)) {
          el.style.borderColor = "#333";
          el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.2)";
        }
      }}
    >
      <Plus size={16} className="flex-shrink-0" style={{ color: "#52525b" }} />
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") submit(); }}
        placeholder="Add a task… press Enter to save"
        disabled={adding}
        className="flex-1 bg-transparent text-sm outline-none disabled:opacity-50 placeholder:text-[#71717a]"
        style={{ color: "#f0f0f0", colorScheme: "dark" }}
      />
      {adding && <span className="w-4 h-4 border border-[#9ca3af] border-t-transparent rounded-full animate-spin flex-shrink-0" />}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const toast = useToast();
  const { data: tasks, isLoading } = useTasks();
  const { data: courses } = useCourses();

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();

  const [groupBy,       setGroupBy]       = useState<GroupBy>("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "">("");
  const [courseFilter,   setCourseFilter]   = useState("");
  const [showCompleted,  setShowCompleted]  = useState(true);
  const [sortBy,         setSortBy]         = useState<SortKey>("dueDate");
  const [search,         setSearch]         = useState("");

  const [showCreate, setShowCreate]       = useState(false);
  const [editingTask, setEditingTask]     = useState<Task | null>(null);
  const [deletingId,  setDeletingId]      = useState<string | null>(null);

  // ── Filtered + sorted task list ─────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = tasks ?? [];
    if (priorityFilter) list = list.filter(t => t.priority === priorityFilter);
    if (courseFilter)   list = list.filter(t => t.courseId === courseFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }
    return sortTasks(list, sortBy);
  }, [tasks, priorityFilter, courseFilter, search, sortBy]);

  const pending   = filtered.filter(t => !t.isCompleted);
  const completed = filtered.filter(t => t.isCompleted);

  // ── Grouped views ────────────────────────────────────────────────────────
  function renderByPriority(list: Task[]) {
    const groups: [Priority, string, string][] = [
      ["high",   "High",   "bg-red-500"],
      ["medium", "Medium", "bg-orange-400"],
      ["low",    "Low",    "bg-blue-400"],
    ];
    return groups.map(([p, label, accent]) => {
      const items = list.filter(t => t.priority === p);
      if (!items.length) return null;
      return (
        <Section key={p} title={label} count={items.length} accent={accent}>
          {items.map(t => <TaskRow key={t.id} task={t} />)}
        </Section>
      );
    });
  }

  function renderByCourse(list: Task[]) {
    const courseMap = new Map<string, { name: string; tasks: Task[] }>();
    const noCourse: Task[] = [];
    list.forEach(t => {
      if (t.course) {
        if (!courseMap.has(t.courseId!)) courseMap.set(t.courseId!, { name: t.course.name, tasks: [] });
        courseMap.get(t.courseId!)!.tasks.push(t);
      } else {
        noCourse.push(t);
      }
    });
    return (
      <>
        {[...courseMap.entries()].map(([cid, { name, tasks: ct }]) => (
          <Section key={cid} title={name} count={ct.length}>
            {ct.map(t => <TaskRow key={t.id} task={t} />)}
          </Section>
        ))}
        {noCourse.length > 0 && (
          <Section title="No course" count={noCourse.length}>
            {noCourse.map(t => <TaskRow key={t.id} task={t} />)}
          </Section>
        )}
      </>
    );
  }

  function TaskRow({ task }: { task: Task }) {
    return (
      <TaskItem
        task={task}
        onToggle={() => toggleTask.mutate({ id: task.id, isCompleted: !task.isCompleted })}
        onEdit={() => setEditingTask(task)}
        onDelete={() => setDeletingId(task.id)}
        deleting={deleteTask.isPending && deletingId === task.id}
      />
    );
  }

  function renderList() {
    if (groupBy === "completed") {
      if (!completed.length) return <EmptyTaskState text="No completed tasks." />;
      return <div className="space-y-1.5">{completed.map(t => <TaskRow key={t.id} task={t} />)}</div>;
    }

    if (groupBy === "priority") {
      if (!pending.length) return <EmptyTaskState text="No tasks match your filters." />;
      return (
        <div className="space-y-4">
          {renderByPriority(pending)}
          {showCompleted && completed.length > 0 && (
            <Section title="Completed" count={completed.length} defaultOpen={false}>
              {completed.map(t => <TaskRow key={t.id} task={t} />)}
            </Section>
          )}
        </div>
      );
    }

    if (groupBy === "course") {
      if (!pending.length) return <EmptyTaskState text="No tasks match your filters." />;
      return (
        <div className="space-y-4">
          {renderByCourse(pending)}
          {showCompleted && completed.length > 0 && (
            <Section title="Completed" count={completed.length} defaultOpen={false}>
              {completed.map(t => <TaskRow key={t.id} task={t} />)}
            </Section>
          )}
        </div>
      );
    }

    // "all"
    return (
      <div className="space-y-4">
        {pending.length > 0
          ? <div className="space-y-1.5">{pending.map(t => <TaskRow key={t.id} task={t} />)}</div>
          : !completed.length && <EmptyTaskState />
        }
        {showCompleted && completed.length > 0 && (
          <Section title="Completed" count={completed.length} defaultOpen={false}>
            {completed.map(t => <TaskRow key={t.id} task={t} />)}
          </Section>
        )}
      </div>
    );
  }

  const deletingTask = tasks?.find(t => t.id === deletingId);
  const activeFilters = [priorityFilter, courseFilter, search.trim()].filter(Boolean).length;

  return (
    <div className="p-6 sm:p-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#111] tracking-tight">Tasks</h2>
          <p className="text-sm text-[#9ca3af] mt-0.5">
            {pending.length} pending
            {completed.length > 0 && <span className="ml-1">· {completed.length} done</span>}
            {activeFilters > 0 && <span className="ml-1">· {activeFilters} filter{activeFilters > 1 ? "s" : ""}</span>}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> New task
        </Button>
      </div>

      {/* Quick-add */}
      <QuickAdd
        onAdd={async (title) => {
          await createTask.mutateAsync({ title, priority: "medium" });
          toast.success("Task created.");
        }}
      />

      {/* Controls bar */}
      <div className="flex flex-wrap gap-2.5 mb-5">
        <SearchInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tasks…"
          className="w-48"
        />

        <Select value={groupBy} onChange={e => setGroupBy(e.target.value as GroupBy)} className="w-36">
          <option value="all">Group: All</option>
          <option value="priority">By priority</option>
          <option value="course">By course</option>
          <option value="completed">Completed</option>
        </Select>

        <Select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as Priority | "")} className="w-36">
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>

        <Select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} className="w-44">
          <option value="">All courses</option>
          {courses?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>

        <Select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)} className="w-36">
          <option value="dueDate">Sort: Due date</option>
          <option value="priority">Sort: Priority</option>
          <option value="createdAt">Sort: Created</option>
        </Select>

        {/* Completed toggle */}
        {groupBy !== "completed" && (
          <button
            onClick={() => setShowCompleted(v => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all duration-150 ${
              showCompleted
                ? "bg-[#111] text-white border-[#111]"
                : "bg-white text-[#6b7280] border-[#e5e7eb] hover:border-[#d1d5db]"
            }`}
          >
            <CheckSquare size={12} />
            Show done
          </button>
        )}
      </div>

      {/* Task list */}
      {isLoading
        ? <SkeletonList count={8} layout="list" cardHeight={56} />
        : renderList()
      }

      {/* Modals */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New task">
        <TaskForm
          courses={courses}
          onSubmit={async (p) => {
            await createTask.mutateAsync(p);
            setShowCreate(false);
            toast.success("Task created.");
          }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      <Modal open={!!editingTask} onClose={() => setEditingTask(null)} title="Edit task">
        {editingTask && (
          <TaskForm
            initial={editingTask}
            courses={courses}
            onSubmit={async (p) => {
              await updateTask.mutateAsync({ id: editingTask.id, payload: p });
              setEditingTask(null);
              toast.success("Task updated.");
            }}
            onCancel={() => setEditingTask(null)}
          />
        )}
      </Modal>

      <Modal open={!!deletingTask} onClose={() => setDeletingId(null)} title="Delete task" maxWidth={400}>
        <p className="text-sm text-[#6b7280] mb-5">
          Delete <strong>{deletingTask?.title}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDeletingId(null)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleteTask.isPending}
            onClick={async () => {
              if (!deletingId) return;
              try {
                await deleteTask.mutateAsync(deletingId);
                setDeletingId(null);
                toast.success("Task deleted.");
              } catch {
                toast.error("Failed to delete task.");
              }
            }}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

function EmptyTaskState({ text }: { text?: string }) {
  return (
    <EmptyState
      icon={<AlertCircle size={16} className="text-[#9ca3af]" strokeWidth={1.6} />}
      title={text ?? "You're all caught up. No tasks remaining."}
    />
  );
}
