import { useState } from "react";
import { api } from "../../lib/api";

export interface VtopAttendanceRecord {
  id: string;
  courseCode: string;
  courseName: string;
  courseType: string | null;
  conducted: number;
  attended: number;
  attendancePercent: number;
  syncedAt: string;
}

export interface VtopGradeRecord {
  id: string;
  courseCode: string;
  courseName: string;
  credits: number | null;
  grade: string | null;
  gradePoint: number | null;
  syncedAt: string;
}

export interface VtopAcademicEvent {
  id: string;
  date: string;
  eventType: string;
  label: string;
}

export function useFetchCaptcha() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchCaptcha() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/vtop/captcha");
      return res.data.data as { hasCaptcha: boolean; captchaImage?: string };
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to load VTOP login page";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }

  return { fetchCaptcha, loading, error };
}

export function useVtopSync() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sync(username: string, password: string, captchaStr?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/vtop/sync", { username, password, captchaStr });
      return res.data;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Sync failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }

  return { sync, loading, error };
}

export function useVtopAttendance() {
  const [data, setData] = useState<VtopAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetch() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/vtop/attendance");
      setData(res.data.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, error, fetch };
}

export function useVtopGrades() {
  const [data, setData] = useState<VtopGradeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetch() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/vtop/grades");
      setData(res.data.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load grades");
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, error, fetch };
}

export function useVtopAcademicEvents() {
  const [data, setData] = useState<VtopAcademicEvent[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetch() {
    setLoading(true);
    try {
      const res = await api.get("/vtop/academic-events");
      setData(res.data.data ?? []);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, fetch };
}