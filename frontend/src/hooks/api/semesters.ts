import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Course } from "./courses";

export interface Semester {
  id: string;
  name: string;
  year: number;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
  courses?: Course[];
  _count?: { courses: number };
}

export interface SemesterPayload {
  name: string;
  year: number;
  startDate?: string;
  endDate?: string;
}

export const semesterKeys = {
  all:    ()         => ["semesters"]        as const,
  detail: (id: string) => ["semesters", id]  as const,
};

export function useSemesters() {
  return useQuery({
    queryKey: semesterKeys.all(),
    queryFn: async () => {
      const { data } = await api.get<{ data: Semester[] }>("/semesters");
      return data?.data ?? [];
    },
  });
}

export function useSemester(id: string) {
  return useQuery({
    queryKey: semesterKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<{ data: Semester }>(`/semesters/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateSemester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SemesterPayload) => {
      const { data } = await api.post<{ data: Semester }>("/semesters", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: semesterKeys.all() }),
  });
}

export function useUpdateSemester(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<SemesterPayload>) => {
      const { data } = await api.put<{ data: Semester }>(`/semesters/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: semesterKeys.all() });
      qc.invalidateQueries({ queryKey: semesterKeys.detail(id) });
    },
  });
}

export function useDeleteSemester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/semesters/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: semesterKeys.all() }),
  });
}
