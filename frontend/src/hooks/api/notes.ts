import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  courseId: string;
  course?: { id: string; name: string; code: string };
  createdAt: string;
  updatedAt: string;
}

export interface NotePayload {
  title: string;
  content?: string;
  tags?: string[];
  courseId?: string;
}

export interface NoteUpdatePayload {
  title?: string;
  content?: string;
  tags?: string[];
  courseId?: string;
}

export const noteKeys = {
  all:      ()             => ["notes"]                   as const,
  byCourse: (cid: string)  => ["notes", "course", cid]   as const,
  detail:   (id: string)   => ["notes", id]              as const,
};

export function useNotes(courseId?: string) {
  return useQuery({
    queryKey: courseId ? noteKeys.byCourse(courseId) : noteKeys.all(),
    queryFn: async () => {
      const params = courseId ? `?courseId=${courseId}` : "";
      const { data } = await api.get<{ data: Note[] }>(`/notes${params}`);
      return data?.data ?? [];
    },
  });
}

export function useNote(id: string) {
  return useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<{ data: Note }>(`/notes/${id}`);
      return data.data;
    },
    enabled: !!id,
    staleTime: Infinity,
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NotePayload) => {
      const { data } = await api.post<{ data: Note }>("/notes", payload);
      return data.data;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: noteKeys.all() });
      qc.invalidateQueries({ queryKey: noteKeys.byCourse(n.courseId) });
    },
  });
}

export function useUpdateNote(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NoteUpdatePayload) => {
      const { data } = await api.put<{ data: Note }>(`/notes/${id}`, payload);
      return data.data;
    },
    onSuccess: (n) => {
      qc.setQueryData(noteKeys.detail(id), n);
      qc.invalidateQueries({ queryKey: noteKeys.all() });
      qc.invalidateQueries({ queryKey: noteKeys.byCourse(n.courseId) });
    },
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; courseId: string }) => {
      await api.delete(`/notes/${id}`);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: noteKeys.all() });
      qc.invalidateQueries({ queryKey: noteKeys.byCourse(vars.courseId) });
    },
  });
}
