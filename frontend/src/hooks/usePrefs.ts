import { useEffect, useState } from "react";
import { readBool, readNum } from "../lib/prefs";

const EVENT = "dashboard-prefs-changed";

/** Reads a boolean pref and re-renders whenever any pref changes. */
export function usePrefBool(key: string, def: boolean): boolean {
  const [val, setVal] = useState(() => readBool(key, def));
  useEffect(() => {
    const sync = () => setVal(readBool(key, def));
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, [key, def]);
  return val;
}

/** Reads a numeric pref and re-renders whenever any pref changes. */
export function usePrefNum(key: string, def: number): number {
  const [val, setVal] = useState(() => readNum(key, def));
  useEffect(() => {
    const sync = () => setVal(readNum(key, def));
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, [key, def]);
  return val;
}
