import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { courseKeys } from "./courses";

export type AssignmentStatus = "PENDING" | "SUBMITTED" | "GRADED";

export interface Assignment {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  weight: number;
  isSubmitted: boolean;
  status: AssignmentStatus;
  courseId: string;
  course?: { id: string; name: string; code: string; semesterId: string };
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentPayload {
  title: string;
  description?: string;
  dueDate?: string;
  weight?: number;
  isSubmitted?: boolean;
  status?: AssignmentStatus;
  courseId: string;
}

/** Derived UI status — computed from isSubmitted + dueDate */
export function deriveStatus(
  a: Pick<Assignment, "isSubmitted" | "dueDate" | "status">
): "submitted" | "overdue" | "pending" {
  if (a.isSubmitted || a.status === "SUBMITTED" || a.status === "GRADED") return "submitted";
  if (a.dueDate && new Date(a.dueDate) < new Date()) return "overdue";
  return "pending";
}

export const assignmentKeys = {
  all:      ()            => ["assignments"]              as const,
  byCourse: (cid: string) => ["assignments", "course", cid] as const,
  detail:   (id: string)   => ["assignments", id]         as const,
};

export function useAssignments(courseId?: string) {
  return useQuery({
    queryKey: courseId ? assignmentKeys.byCourse(courseId) : assignmentKeys.all(),
    queryFn: async () => {
      const params = courseId ? `?courseId=${courseId}` : "";
      const { data } = await api.get<{ data: Assignment[] | { items: Assignment[] } }>(`/assignments${params}`);
      const raw = data?.data;
      return Array.isArray(raw) ? raw : (raw?.items ?? []);
    },
  });
}

export function useAssignment(id: string) {
  return useQuery({
    queryKey: assignmentKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<{ data: Assignment }>(`/assignments/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AssignmentPayload) => {
      const { data } = await api.post<{ data: Assignment }>("/assignments", payload);
      return data.data;
    },
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: assignmentKeys.all() });
      qc.invalidateQueries({ queryKey: assignmentKeys.byCourse(a.courseId) });
    },
  });
}

export function useUpdateAssignment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<AssignmentPayload>) => {
      const { data } = await api.put<{ data: Assignment }>(`/assignments/${id}`, payload);
      return data.data;
    },
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: assignmentKeys.all() });
      qc.invalidateQueries({ queryKey: assignmentKeys.detail(id) });
      qc.invalidateQueries({ queryKey: assignmentKeys.byCourse(a.courseId) });
      qc.invalidateQueries({ queryKey: courseKeys.gpa(a.courseId) });
    },
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, courseId }: { id: string; courseId: string }) => {
      await api.delete(`/assignments/${id}`);
      return courseId;
    },
    onSuccess: (courseId) => {
      qc.invalidateQueries({ queryKey: assignmentKeys.all() });
      qc.invalidateQueries({ queryKey: assignmentKeys.byCourse(courseId) });
      qc.invalidateQueries({ queryKey: courseKeys.gpa(courseId) });
    },
  });
}
