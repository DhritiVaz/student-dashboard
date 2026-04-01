import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { User } from "@student-dashboard/shared";

export const userKeys = {
  me: () => ["users", "me"] as const,
};

export function useMe() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: async () => {
      const { data } = await api.get<{ data: User }>("/users/me");
      return data.data;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name?: string; email?: string }) => {
      const { data } = await api.patch<{ data: User }>("/users/me", payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.me() });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      await api.post("/users/me/password", payload);
    },
  });
}

export function useLogoutAllSessions() {
  return useMutation({
    mutationFn: async (refreshToken: string) => {
      await api.post("/users/me/logout-all", { refreshToken });
    },
  });
}
