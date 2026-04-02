import { Request, Response } from "express";
import {
  syncLmsData,
  getLmsCourses,
  getLmsAssignments,
  getLmsUpcoming,
  getLmsModules,
  debugLmsSync,
  debugLmsCourse,
} from "../services/lmsService";

export async function syncLmsHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, error: "Username and password are required." });
    const result = await syncLmsData(userId, username, password);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function debugLmsHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, error: "Username and password are required." });
    const result = await debugLmsSync(userId, username, password);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function debugLmsCourseHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { username, password, courseId } = req.body;
    if (!username || !password || !courseId)
      return res.status(400).json({ success: false, error: "username, password, courseId required" });
    const result = await debugLmsCourse(userId, username, password, courseId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getLmsCoursesHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const data = await getLmsCourses(userId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getLmsAssignmentsHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const data = await getLmsAssignments(userId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getLmsModulesHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const courseId = req.query.courseId as string | undefined;
    const data = await getLmsModules(userId, courseId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getLmsUpcomingHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const data = await getLmsUpcoming(userId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
