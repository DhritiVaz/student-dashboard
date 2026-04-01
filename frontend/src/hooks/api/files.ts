import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiBaseUrl } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";

export interface StudentFile {
  id: string;
  title: string;
  description: string | null;
  originalName: string;
  mimeType: string | null;
  sizeBytes: number;
  courseId: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  course?: { id: string; name: string; code: string } | null;
}

export interface StudentFileUpdatePayload {
  title?: string;
  description?: string | null;
  courseId?: string | null;
  category?: string | null;
}

export const fileKeys = {
  all: () => ["student-files"] as const,
  filtered: (courseId?: string) => ["student-files", courseId ?? "all"] as const,
};

function apiBase(): string {
  return getApiBaseUrl();
}

export function useStudentFiles(courseId?: string) {
  return useQuery({
    queryKey: fileKeys.filtered(courseId),
    queryFn: async () => {
      const q = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
      const { data } = await api.get<{ data: StudentFile[] }>(`/files${q}`);
      return data?.data ?? [];
    },
  });
}

export function useUploadStudentFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const token = useAuthStore.getState().accessToken;
      const res = await fetch(`${apiBase()}/files`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = json?.error;
        throw new Error(typeof err === "string" ? err : "Upload failed");
      }
      return json.data as StudentFile;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fileKeys.all() });
    },
  });
}

export function useUpdateStudentFile(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: StudentFileUpdatePayload) => {
      const { data } = await api.patch<{ data: StudentFile }>(`/files/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fileKeys.all() });
    },
  });
}

export function useDeleteStudentFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/files/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fileKeys.all() });
    },
  });
}

export async function downloadStudentFile(id: string, originalName: string) {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${apiBase()}/files/${id}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = originalName;
  a.click();
  URL.revokeObjectURL(url);
}
