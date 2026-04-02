import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiBaseUrl } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";

export interface MindspaceEntry {
  id: string;
  type: "text" | "file";
  title: string | null;
  body: string | null;
  originalName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
  updatedAt: string;
}

export const mindspaceKeys = {
  all: () => ["mindspace"] as const,
};

export function useMindspaceEntries() {
  return useQuery({
    queryKey: mindspaceKeys.all(),
    queryFn: async () => {
      const { data } = await api.get<{ data: MindspaceEntry[] }>("/mindspace");
      return data?.data ?? [];
    },
  });
}

export function useCreateTextEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { body: string; title?: string | null }) => {
      const { data } = await api.post<{ data: MindspaceEntry }>("/mindspace/text", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: mindspaceKeys.all() }),
  });
}

export function useUploadMindspaceFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const token = useAuthStore.getState().accessToken;
      const res = await fetch(`${getApiBaseUrl()}/mindspace/file`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Upload failed");
      return json.data as MindspaceEntry;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: mindspaceKeys.all() }),
  });
}

export function useDeleteMindspaceEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/mindspace/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: mindspaceKeys.all() }),
  });
}

/** Returns the URL to display/download a mindspace file entry. */
export function mindspaceFileUrl(id: string, mode: "view" | "download" = "view"): string {
  return `${getApiBaseUrl()}/mindspace/${id}/${mode}`;
}

export async function fetchMindspaceBlob(id: string, mode: "view" | "download" = "view"): Promise<Blob> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${getApiBaseUrl()}/mindspace/${id}/${mode}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to fetch file");
  return res.blob();
}
