import { Request, Response } from "express";
import {
  getVtopCaptcha,
  syncVtopData,
  getVtopAttendance,
  getVtopGrades,
  getVtopAcademicEvents,
  getVtopTimetable,
} from "../services/vtopService";

export async function getCaptchaHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const result = await getVtopCaptcha(userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function syncVtopHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { username, password, captchaStr } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: "Username and password are required" });
    const result = await syncVtopData(userId, username, password, captchaStr);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getAttendanceHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const data = await getVtopAttendance(userId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getGradesHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const data = await getVtopGrades(userId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAcademicEventsHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const data = await getVtopAcademicEvents(userId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getTimetableHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const data = await getVtopTimetable(userId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}