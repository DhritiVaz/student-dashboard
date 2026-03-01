import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  isCompleted: boolean;
  priority: Priority;
  dueDate?: string | null;
  courseId?: string | null;
  assignmentId?: string | null;
  course?: { id: string; name: string; code: string };
  createdAt: string;
  updatedAt: string;
}

export interface TaskPayload {
  title: string;
  description?: string;
  isCompleted?: boolean;
  priority?: Priority;
  dueDate?: string;
  courseId?: string;
  assignmentId?: string;
}

export const taskKeys = {
  all: () => ["tasks"] as const,
};

function normalizeTask(t: Task & { priority?: string }): Task {
  const p = t.priority?.toLowerCase();
  return { ...t, priority: (p === "low" || p === "medium" || p === "high" ? p : "medium") as Priority };
}

export function useTasks() {
  return useQuery({
    queryKey: taskKeys.all(),
    queryFn: async () => {
      const { data } = await api.get<{ data: Task[] | { items: Task[] } }>("/tasks");
      const raw = data?.data;
      const list = Array.isArray(raw) ? raw : (raw?.items ?? []);
      return list.map(normalizeTask);
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TaskPayload) => {
      const p = { ...payload, priority: payload.priority?.toUpperCase() as TaskPayload["priority"] };
      const { data } = await api.post<{ data: Task }>("/tasks", p);
      return normalizeTask(data.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all() }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<TaskPayload> }) => {
      const p = { ...payload, ...(payload.priority && { priority: payload.priority.toUpperCase() }) };
      const { data } = await api.put<{ data: Task }>(`/tasks/${id}`, p);
      return normalizeTask(data.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all() }),
  });
}

/** Optimistic checkbox toggle — updates UI instantly, rolls back on error */
export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const { data } = await api.put<{ data: Task }>(`/tasks/${id}`, { isCompleted });
      return normalizeTask(data.data);
    },
    onMutate: async ({ id, isCompleted }) => {
      await qc.cancelQueries({ queryKey: taskKeys.all() });
      const snapshot = qc.getQueryData<Task[]>(taskKeys.all());
      qc.setQueryData<Task[]>(taskKeys.all(), old =>
        old?.map(t => t.id === id ? { ...t, isCompleted, updatedAt: new Date().toISOString() } : t) ?? []
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(taskKeys.all(), ctx.snapshot);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: taskKeys.all() }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: taskKeys.all() });
      const snapshot = qc.getQueryData<Task[]>(taskKeys.all());
      qc.setQueryData<Task[]>(taskKeys.all(), old => old?.filter(t => t.id !== id) ?? []);
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(taskKeys.all(), ctx.snapshot);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: taskKeys.all() }),
  });
}
