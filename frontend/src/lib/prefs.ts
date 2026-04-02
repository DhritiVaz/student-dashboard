/**
 * Shared preference keys and helpers for user-configurable settings.
 * All prefs live in localStorage and broadcast "dashboard-prefs-changed" when written.
 */

export const PREF_SIDEBAR_START    = "settings-sidebar-start-collapsed";
export const PREF_REDUCED_MOTION   = "settings-force-reduced-motion";   // kept in sync with useReducedMotion
export const PREF_SHOW_GREETING    = "settings-show-greeting";           // bool, default true
export const PREF_DEADLINE_DAYS    = "settings-deadline-days";           // number, default 14
export const PREF_ATTENDANCE_SAFE  = "settings-attendance-safe";         // number, default 75
export const PREF_ATTENDANCE_WARN  = "settings-attendance-warn";         // number, default 65
export const PREF_ATTENDANCE_TARGET = "settings-attendance-target";      // number, default 75

const EVENT = "dashboard-prefs-changed";

// ─── Readers ───────────────────────────────────────────────────────────────

export function readBool(key: string, def: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === "true")  return true;
    if (v === "false") return false;
  } catch { /* ignore */ }
  return def;
}

export function readNum(key: string, def: number): number {
  try {
    const v = localStorage.getItem(key);
    if (v !== null) { const n = Number(v); if (Number.isFinite(n)) return n; }
  } catch { /* ignore */ }
  return def;
}

// ─── Writers ───────────────────────────────────────────────────────────────

export function writeBool(key: string, value: boolean) {
  try { localStorage.setItem(key, String(value)); } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVENT));
}

export function writeNum(key: string, value: number) {
  try { localStorage.setItem(key, String(value)); } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVENT));
}

export function writeStr(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVENT));
}
