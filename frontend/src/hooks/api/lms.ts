import { useState } from "react";
import { api } from "../../lib/api";

export interface LmsCourse {
  id: string;
  lmsCourseId: string;
  fullName: string;
  shortName: string | null;
  category: string | null;
  syncedAt: string;
  assignments: LmsAssignment[];
}

export interface LmsAssignment {
  id: string;
  lmsCourseId: string;
  lmsAssignmentId: string;
  name: string;
  dueDate: string | null;
  cutOffDate: string | null;
  allowSubmissions: boolean;
  submitted: boolean;
  description: string | null;
  syncedAt: string;
  course?: { fullName: string; shortName: string | null };
}

export interface LmsModule {
  id: string;
  lmsCourseId: string;
  moduleId: string;
  modtype: string;
  name: string;
  href: string | null;
  accessible: boolean;
  syncedAt: string;
  course?: { fullName: string; shortName: string | null };
}

export interface LmsSyncResult {
  courses: number;
  assignments: number;
  modules: number;
  message: string;
}

export function useLmsSync() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sync(username: string, password: string): Promise<LmsSyncResult> {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/lms/sync", { username, password });
      return res.data.data as LmsSyncResult;
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ?? err?.response?.data?.message ?? "LMS sync failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }

  return { sync, loading, error };
}

export function useLmsCourses() {
  const [data, setData] = useState<LmsCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetch() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/lms/courses");
      setData(res.data.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed to load LMS courses");
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, error, fetch };
}

export function useLmsAssignments() {
  const [data, setData] = useState<LmsAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetch() {
    setLoading(true);
    try {
      const res = await api.get("/lms/assignments");
      setData(res.data.data ?? []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, fetch };
}

export function useLmsModules(courseId?: string) {
  const [data, setData] = useState<LmsModule[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetch() {
    setLoading(true);
    try {
      const url = courseId ? `/lms/modules?courseId=${courseId}` : "/lms/modules";
      const res = await api.get(url);
      setData(res.data.data ?? []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, fetch };
}

export function useLmsUpcoming() {
  const [data, setData] = useState<LmsAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetch() {
    setLoading(true);
    try {
      const res = await api.get("/lms/assignments/upcoming");
      setData(res.data.data ?? []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, fetch };
}
