import { useEffect } from "react";

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/semesters": "Semesters",
  "/courses": "Courses",
  "/assignments": "Assignments",
  "/notes": "Notes",
  "/tasks": "Tasks",
  "/calendar": "Calendar",
  "/settings": "Settings",
  "/login": "Sign in",
  "/register": "Create account",
};

function getTitle(pathname: string): string {
  if (TITLES[pathname]) return `${TITLES[pathname]} | Student Dashboard`;
  if (pathname.startsWith("/semesters/")) return "Semester | Student Dashboard";
  if (pathname.startsWith("/courses/")) return "Course | Student Dashboard";
  if (pathname.startsWith("/assignments/")) return "Assignment | Student Dashboard";
  if (pathname.startsWith("/notes/")) return pathname === "/notes" ? "Notes | Student Dashboard" : "Note | Student Dashboard";
  return "Student Dashboard";
}

export function useDocumentTitle(pathname: string) {
  useEffect(() => {
    document.title = getTitle(pathname);
  }, [pathname]);
}
