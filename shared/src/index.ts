// ─── Enums ────────────────────────────────────────────────────────────────────

export type AssignmentStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "GRADED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type CalendarEventType = "CLASS" | "EXAM" | "DEADLINE" | "PERSONAL";

// ─── Core Types ───────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Semester {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  semesterId: string;
  name: string;
  code?: string | null;
  instructor?: string | null;
  color?: string | null;
  credits?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  weight: number;
  isSubmitted: boolean;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: string;
  assignmentId: string;
  score: number;
  maxScore: number;
  feedback?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GpaBreakdownItem {
  assignmentId: string;
  title: string;
  weight: number;
  score: number;
  maxScore: number;
  percentage: number;
  weightedContribution: number;
}

export interface GpaResult {
  courseId: string;
  gpa: number | null;
  totalWeight: number;
  gradedWeight: number;
  breakdown: GpaBreakdownItem[];
}

export interface Note {
  id: string;
  courseId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  courseId?: string | null;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  color?: string | null;
  type: CalendarEventType;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  courseId?: string | null;
  assignmentId?: string | null;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  isCompleted: boolean;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
}

// ─── API Wrappers ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}
