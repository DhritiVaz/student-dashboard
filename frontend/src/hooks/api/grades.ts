import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { assignmentKeys } from "./assignments";
import { courseKeys } from "./courses";

export interface Grade {
  id: string;
  score: number;
  maxScore: number;
  feedback?: string | null;
  assignmentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GradePayload {
  score: number;
  maxScore: number;
  feedback?: string;
  assignmentId: string;
}

export const gradeKeys = {
  byAssignment: (aid: string) => ["grades", "assignment", aid] as const,
};

export function letterGrade(pct: number): string {
  if (pct >= 90) return "A";
  if (pct >= 80) return "B";
  if (pct >= 70) return "C";
  if (pct >= 60) return "D";
  return "F";
}

export function useGrades(assignmentId: string) {
  return useQuery({
    queryKey: gradeKeys.byAssignment(assignmentId),
    queryFn: async () => {
      const { data } = await api.get<{ data: Grade[] }>(`/grades?assignmentId=${assignmentId}`);
      return data.data;
    },
    enabled: !!assignmentId,
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>, grade: Grade, courseId?: string) {
  qc.invalidateQueries({ queryKey: gradeKeys.byAssignment(grade.assignmentId) });
  qc.invalidateQueries({ queryKey: assignmentKeys.detail(grade.assignmentId) });
  qc.invalidateQueries({ queryKey: assignmentKeys.all() });
  if (courseId) {
    qc.invalidateQueries({ queryKey: courseKeys.gpa(courseId) });
    qc.invalidateQueries({ queryKey: assignmentKeys.byCourse(courseId) });
  }
}

export function useCreateGrade(courseId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: GradePayload) => {
      const { data } = await api.post<{ data: Grade }>("/grades", payload);
      return data.data;
    },
    onSuccess: (g) => invalidateAll(qc, g, courseId),
  });
}

export function useUpdateGrade(courseId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Omit<GradePayload, "assignmentId">> }) => {
      const { data } = await api.put<{ data: Grade }>(`/grades/${id}`, payload);
      return data.data;
    },
    onSuccess: (g) => invalidateAll(qc, g, courseId),
  });
}

export function useDeleteGrade(courseId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ gradeId, assignmentId }: { gradeId: string; assignmentId: string }) => {
      await api.delete(`/grades/${gradeId}`);
      return assignmentId;
    },
    onSuccess: (assignmentId) => {
      qc.invalidateQueries({ queryKey: gradeKeys.byAssignment(assignmentId) });
      qc.invalidateQueries({ queryKey: assignmentKeys.detail(assignmentId) });
      qc.invalidateQueries({ queryKey: assignmentKeys.all() });
      if (courseId) qc.invalidateQueries({ queryKey: courseKeys.gpa(courseId) });
    },
  });
}
