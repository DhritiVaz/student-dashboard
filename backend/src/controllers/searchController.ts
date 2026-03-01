import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authenticate";
import { searchAll } from "../services/searchService";
import { ok, fail } from "../lib/response";

export async function searchHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const q = String(req.query.q ?? "").trim();
    if (!q) return ok(res, { courses: [], assignments: [], notes: [], tasks: [] });

    const results = await searchAll(q, req.userId);
    return ok(res, results);
  } catch (err) {
    console.error("Search error", err);
    return fail(res, "Search failed", 500);
  }
}
