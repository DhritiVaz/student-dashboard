import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

export type EventType = "class" | "exam" | "deadline" | "personal";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  courseId?: string | null;
  eventType: EventType;
  isAllDay: boolean;
  color?: string | null;
  course?: { id: string; name: string; code: string };
  createdAt: string;
  updatedAt: string;
}

export interface EventPayload {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  courseId?: string;
  eventType: EventType;
  isAllDay: boolean;
  color?: string;
}

export const eventKeys = {
  all:     ()                            => ["events"]                         as const,
  byRange: (start: string, end: string)  => ["events", "range", start, end]   as const,
};

export function useEvents(startDate: string, endDate: string) {
  return useQuery({
    queryKey: eventKeys.byRange(startDate, endDate),
    queryFn: async () => {
      const { data } = await api.get<{ data: Record<string, unknown>[] }>(
        `/events?startDate=${startDate}&endDate=${endDate}`
      );
      return (data?.data ?? []).map((e) => fromApiEvent(e as { type: string }));
    },
    enabled: !!startDate && !!endDate,
  });
}

/** Map frontend eventType (lowercase) to API type (uppercase). */
function toApiPayload(payload: EventPayload) {
  const { eventType, ...rest } = payload;
  return { ...rest, type: eventType.toUpperCase() as Uppercase<EventType> };
}

/** Normalize API event (type) to frontend shape (eventType). */
function fromApiEvent(e: { type: string; [k: string]: unknown }): CalendarEvent {
  const { type, ...rest } = e;
  return { ...rest, eventType: type.toLowerCase() as EventType } as CalendarEvent;
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EventPayload) => {
      const { data } = await api.post<{ data: Record<string, unknown> }>("/events", toApiPayload(payload));
      return fromApiEvent(data.data as { type: string });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all() }),
  });
}

export function useUpdateEvent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<EventPayload>) => {
      const { eventType, ...rest } = payload;
      const apiPayload =
        eventType !== undefined ? { ...rest, type: eventType.toUpperCase() } : rest;
      const { data } = await api.put<{ data: Record<string, unknown> }>(
        `/events/${id}`,
        apiPayload
      );
      return fromApiEvent(data.data as { type: string });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all() }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/events/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all() }),
  });
}
