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

type GroupBy = "all" | "priority" | "course" | "completed";
type SortKey = "dueDate" | "priority" | "createdAt";

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
  if (done) return { label: formatDate(iso), cls: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20" };
  if (diff < 0)   return { label: `${Math.abs(diff)}d overdue`, cls: "text-red-400 bg-red-500/10 border-red-500/20" };
  if (diff === 0) return { label: "Today",                      cls: "text-orange-400 bg-orange-500/10 border-orange-500/20" };
  if (diff === 1) return { label: "Tomorrow",                   cls: "text-orange-300 bg-orange-500/10 border-orange-500/20" };
  if (diff <= 7)  return { label: `${diff}d`,                   cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
  return           { label: formatDate(iso),                    cls: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function sortTasks(list: Task[], sortBy: SortKey): Task[] {
  return [...list].sort((a, b) => {
    if (sortBy === "priority")  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (sortBy === "createdAt") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

function TaskCheckbox({ done, onClick, title }: { done: boolean; onClick: () => void; title: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={done}
      aria-label={done ? `Mark "${title}" as incomplete` : `Mark "${title}" as complete`}
      onClick={onClick}
      onKeyDown={e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onClick(); } }}
      className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-0.5">
      {done
        ? <CheckCircle2 size={18} style={{ color: "#34d399" }} strokeWidth={2} />
        : <Circle size={18} strokeWidth={1.8} style={{ color: "rgba(255,255,255,0.2)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")} />
      }
    </button>
  );
}

function TaskItem({ task, onEdit, onDelete, onToggle, deleting }: {
  task: Task; onEdit: () => void; onDelete: () => void; onToggle: () => void; deleting: boolean;
}) {
  const due = dueDateStyle(task.dueDate, task.isCompleted);
  return (
    <div
      className="group flex items-start gap-3 px-4 py-3 transition-all duration-150"
      style={{
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.06)",
        background: task.isCompleted ? "rgba(255,255,255,0.02)" : "#111111",
      }}
      onMouseEnter={e => {
        if (!task.isCompleted)
          (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.11)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.06)";
      }}
    >
      <TaskCheckbox done={task.isCompleted} onClick={onToggle} title={task.title} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium transition-all duration-200 ${task.isCompleted ? "line-through" : ""}`}
            style={{ color: task.isCompleted ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.85)" }}>
            {task.title}
          </span>
          {!task.isCompleted && (
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot(task.priority)}`}
              title={PRIORITY_LABEL[task.priority]} />
          )}
          {task.course && (
            <span className="text-[10px] font-semibold rounded-md px-1.5 py-0.5 tracking-wide flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {task.course.code}
            </span>
          )}
        </div>
        {task.description && (
          <p className="text-xs mt-0.5 truncate max-w-lg"
            style={{ color: task.isCompleted ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.35)" }}>
            {task.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
        {due && (
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium border rounded-full px-2 py-0.5 ${due.cls}`}>
            {due.cls.includes("red") && <AlertCircle size={10} />}
            {(due.label === "Today" || due.label === "Tomorrow") && <Clock size={10} />}
            {due.cls.includes("emerald") && <Calendar size={10} />}
            {due.label}
          </span>
        )}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} aria-label="Edit task"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "rgba(255,255,255,0.3)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
            <Pencil size={12} />
          </button>
          <button onClick={onDelete} disabled={deleting} aria-label="Delete task"
            className="p-1.5 rounded-lg transition-colors disabled:opacity-40"
            style={{ color: "rgba(255,255,255,0.3)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, count, defaultOpen = true, children, accent }: {
  title: string; count: number; defaultOpen?: boolean; children: React.ReactNode; accent?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full flex items-center gap-2 py-2 mb-1 text-left">
        <span className={`flex-shrink-0 transition-transform duration-150 ${open ? "rotate-0" : "-rotate-90"}`}>
          <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
        </span>
        {accent && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${accent}`} />}
        <span className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "rgba(255,255,255,0.35)" }}>{title}</span>
        <span className="text-xs ml-1" style={{ color: "rgba(255,255,255,0.25)" }}>{count}</span>
      </button>
      {open && <div className="space-y-1.5">{children}</div>}
    </div>
  );
}


function QuickAdd({ onAdd }: { onAdd: (title: string) => Promise<void> }) {
  const [value, setValue]   = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit() {
    const t = value.trim();
    if (!t) return;
    setAdding(true);
    try { await onAdd(t); setValue(""); inputRef.current?.focus(); }
    finally { setAdding(false); }
  }

  return (
    <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-6 transition-all duration-150"
      style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
      onFocus={e => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.2)")}
      onBlur={e => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)")}>
      <Plus size={16} className="flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }} />
      <input ref={inputRef} value={value} onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") submit(); }}
        placeholder="Add a task… press Enter to save"
        disabled={adding}
        className="flex-1 bg-transparent text-sm outline-none disabled:opacity-50"
        style={{ color: "rgba(255,255,255,0.8)", colorScheme: "dark" }}
      />
      {adding && <span className="w-4 h-4 border border-zinc-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
    </div>
  );
}

export default function TasksPage() {
  const toast = useToast();
  const { data: tasks, isLoading } = useTasks();
  const { data: courses }          = useCourses();

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();

  const [groupBy,        setGroupBy]        = useState<GroupBy>("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "">("");
  const [courseFilter,   setCourseFilter]   = useState("");
  const [showCompleted,  setShowCompleted]  = useState(true);
  const [sortBy,         setSortBy]         = useState<SortKey>("dueDate");
  const [search,         setSearch]         = useState("");
  const [showCreate,     setShowCreate]     = useState(false);
  const [editingTask,    setEditingTask]     = useState<Task | null>(null);
  const [deletingId,     setDeletingId]     = useState<string | null>(null);

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

  function TaskRow({ task }: { task: Task }) {
    return (
      <TaskItem task={task}
        onToggle={() => toggleTask.mutate({ id: task.id, isCompleted: !task.isCompleted })}
        onEdit={() => setEditingTask(task)}
        onDelete={() => setDeletingId(task.id)}
        deleting={deleteTask.isPending && deletingId === task.id} />
    );
  }

  function renderByPriority(list: Task[]) {
    const groups: [Priority, string, string][] = [
      ["high", "High", "bg-red-500"],
      ["medium", "Medium", "bg-orange-400"],
      ["low", "Low", "bg-blue-400"],
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
      } else { noCourse.push(t); }
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

  const deletingTask  = tasks?.find(t => t.id === deletingId);
  const activeFilters = [priorityFilter, courseFilter, search.trim()].filter(Boolean).length;

  return (
    <div className="p-6 sm:p-8 w-full min-w-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>Tasks</h2>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {pending.length} pending
            {completed.length > 0 && <span className="ml-1">· {completed.length} done</span>}
            {activeFilters > 0 && <span className="ml-1">· {activeFilters} filter{activeFilters > 1 ? "s" : ""}</span>}
            {!isLoading && (tasks?.length ?? 0) === 0 && (
              <span className="ml-1" style={{ color: "rgba(255,255,255,0.22)" }}>· sample below</span>
            )}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> New task</Button>
      </div>

      <QuickAdd onAdd={async (title) => { await createTask.mutateAsync({ title, priority: "medium" }); toast.success("Task created."); }} />

      <div className="flex flex-wrap gap-2.5 mb-5">
        <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…" className="w-48" />
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
        {groupBy !== "completed" && (
          <button onClick={() => setShowCompleted(v => !v)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-150"
            style={showCompleted
              ? { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.15)" }
              : { background: "transparent", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <CheckSquare size={12} /> Show done
          </button>
        )}
      </div>

      {isLoading ? (
        <SkeletonList count={8} layout="list" cardHeight={56} />
      ) : (tasks?.length ?? 0) === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>No tasks yet</p>
        </div>
      ) : (
        renderList()
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New task">
        <TaskForm courses={courses}
          onSubmit={async (p) => { await createTask.mutateAsync(p); setShowCreate(false); toast.success("Task created."); }}
          onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal open={!!editingTask} onClose={() => setEditingTask(null)} title="Edit task">
        {editingTask && (
          <TaskForm initial={editingTask} courses={courses}
            onSubmit={async (p) => { await updateTask.mutateAsync({ id: editingTask.id, payload: p }); setEditingTask(null); toast.success("Task updated."); }}
            onCancel={() => setEditingTask(null)} />
        )}
      </Modal>

      <Modal open={!!deletingTask} onClose={() => setDeletingId(null)} title="Delete task" maxWidth={400}>
        <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>
          Delete <strong style={{ color: "rgba(255,255,255,0.85)" }}>{deletingTask?.title}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDeletingId(null)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleteTask.isPending}
            onClick={async () => {
              if (!deletingId) return;
              try { await deleteTask.mutateAsync(deletingId); setDeletingId(null); toast.success("Task deleted."); }
              catch { toast.error("Failed to delete task."); }
            }}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

function EmptyTaskState({ text }: { text?: string }) {
  return (
    <EmptyState
      icon={<AlertCircle size={16} strokeWidth={1.6} style={{ color: "rgba(255,255,255,0.3)" }} />}
      title={text ?? "You're all caught up. No tasks remaining."} />
  );
}