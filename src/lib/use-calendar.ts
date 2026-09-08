import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCalendar } from "@/lib/api/calendar";
import type { CalendarEvent } from "@/engine/calendar";
import { toast } from "sonner";

export const CALENDAR_KEY = ["calendar"] as const;

export function useCalendar() {
  return useQuery({
    queryKey: CALENDAR_KEY,
    queryFn: () => fetchCalendar(),
    staleTime: 10_000,
  });
}

export function useCalendarMutation<TArgs>(
  fn: (args: TArgs) => Promise<CalendarEvent[]>,
  ok = "Đã lưu mốc",
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      qc.setQueryData(CALENDAR_KEY, data);
      toast.success(ok);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Không lưu được lịch");
    },
  });
}