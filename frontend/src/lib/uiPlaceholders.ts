/**
 * Short hardcoded samples for empty UI states (not from the API).
 */

export const DEMO_DASHBOARD_NOTES = [
  { title: "Week 4 — heap vs stack", code: "CSE2001" },
  { title: "Lab 3 checklist", code: "PHY1001" },
] as const;

export const DEMO_DASHBOARD_TASKS: { title: string; due: string; code?: string }[] = [
  { title: "Email TA about quiz", code: "STS1001", due: "Tomorrow" },
  { title: "Print cover sheet", due: "3d" },
];

export const DEMO_DASHBOARD_DEADLINES = [
  { title: "Problem set 5", code: "MAT1011", pill: "5d", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { title: "Project proposal", code: "CSE2001", pill: "Tomorrow", cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
] as const;

export const DEMO_NOTES_PAGE = [
  { title: "Midterm formula sheet", code: "MAT1011", preview: "Chain rule, L'Hôpital…", tag: "exam" },
  { title: "Reading notes — ch.7", code: "STS1001", preview: "Privacy & consent.", tag: "reading" },
] as const;

export const DEMO_TASKS_PAGE = [
  { title: "Review flashcards (10 min)", priority: "medium" as const, dueLabel: "Today" },
  { title: "Buy lab notebook", priority: "low" as const, dueLabel: undefined as string | undefined },
] as const;

export const DEMO_ASSIGNMENTS_PAGE = [
  { title: "Written report draft", code: "STS1001", dueLine: "Due in 4 days" },
  { title: "Quiz 2 (online)", code: "MAT1011", dueLine: "Due tomorrow" },
] as const;
