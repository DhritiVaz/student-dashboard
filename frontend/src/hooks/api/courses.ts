import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Semester } from "./semesters";

export interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
  professor?: string | null;
  instructor?: string | null; // API returns this; we use professor ?? instructor in UI
  description?: string | null;
  color?: string | null;
  semesterId: string;
  semester?: Pick<Semester, "id" | "name" | "year">;
  createdAt: string;
  updatedAt: string;
}

export interface GpaBreakdown {
  assignmentId: string;
  title: string;
  weight: number;
  percentage: number | null;
}

export interface CourseGpa {
  gpa: number | null;
  breakdown: GpaBreakdown[];
}

export interface CoursePayload {
  name: string;
  code: string;
  credits: number;
  professor?: string;
  instructor?: string; // backend field; CourseForm maps professor → instructor
  description?: string;
  color?: string;
  semesterId: string;
}

export const courseKeys = {
  all:        ()                    => ["courses"]              as const,
  bySemester: (sid: string)        => ["courses", "semester", sid] as const,
  detail:     (id: string)         => ["courses", id]          as const,
  gpa:        (id: string)         => ["courses", id, "gpa"]   as const,
};

export function useCourses(semesterId?: string) {
  return useQuery({
    queryKey: semesterId ? courseKeys.bySemester(semesterId) : courseKeys.all(),
    queryFn: async () => {
      const params = semesterId ? `?semesterId=${semesterId}` : "";
      const { data } = await api.get<{ data: Course[] }>(`/courses${params}`);
      return data?.data ?? [];
    },
  });
}

export function useCoursesByCode(code: string | undefined) {
  const c = code?.trim();
  return useQuery({
    queryKey: ["courses", "byCode", c ?? ""] as const,
    queryFn: async () => {
      const { data } = await api.get<{ data: Course[] }>(
        `/courses?code=${encodeURIComponent(c!)}`
      );
      return data?.data ?? [];
    },
    enabled: !!c,
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<{ data: Course }>(`/courses/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCourseGpa(id: string) {
  return useQuery({
    queryKey: courseKeys.gpa(id),
    queryFn: async () => {
      const { data } = await api.get<{ data: CourseGpa }>(`/courses/${id}/gpa`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CoursePayload) => {
      const { data } = await api.post<{ data: Course }>("/courses", payload);
      return data.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: courseKeys.all() });
      qc.invalidateQueries({ queryKey: courseKeys.bySemester(vars.semesterId) });
    },
  });
}

export function useUpdateCourse(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CoursePayload>) => {
      const { data } = await api.put<{ data: Course }>(`/courses/${id}`, payload);
      return data.data;
    },
    onSuccess: (course) => {
      qc.invalidateQueries({ queryKey: courseKeys.all() });
      qc.invalidateQueries({ queryKey: courseKeys.detail(id) });
      qc.invalidateQueries({ queryKey: courseKeys.bySemester(course.semesterId) });
    },
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, semesterId }: { id: string; semesterId: string }) => {
      await api.delete(`/courses/${id}`);
      return semesterId;
    },
    onSuccess: (semesterId) => {
      qc.invalidateQueries({ queryKey: courseKeys.all() });
      qc.invalidateQueries({ queryKey: courseKeys.bySemester(semesterId) });
    },
  });
}
