import { api } from "./api";
import type { LoginResponse, RegisterRequest } from "@student-dashboard/shared";

export async function loginApi(email: string, password: string) {
  const { data } = await api.post<{ data: LoginResponse }>("/auth/login", {
    email,
    password,
  });
  return data.data;
}

export async function registerApi(
  email: string,
  password: string,
  name: string
) {
  const { data } = await api.post<{ data: LoginResponse }>("/auth/register", {
    email,
    password,
    name,
  } satisfies RegisterRequest);
  return data.data;
}

export async function logoutApi(refreshToken: string) {
  await api.post("/auth/logout", { refreshToken });
}
