import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  nextOccurrence,
  occursOn,
  prevOccurrence,
  type CalendarEvent,
} from "@/engine/calendar";
import { formatViDate, remainingDays, todayYmd, ymd } from "@/engine/dates";
import { deleteCalendarEvent, saveCalendarEvent } from "@/lib/api/calendar";
import { useCalendar, useCalendarMutation } from "@/lib/use-calendar";
import { cn } from "@/lib/utils";
import { addDays, addMonths, format, getDay, startOfMonth, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";

const WEEK = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

type Draft = {
  id?: string;
  title: string;
  eventDate: string;
  yearly: boolean;
  notes: string;
};

export function CalendarPage() {
  const { data, isPending } = useCalendar();
  const today = todayYmd();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(today);
  const [draft, setDraft] = useState<Draft | null>(null);
  const saveMut = useCalendarMutation((d: Parameters<typeof saveCalendarEvent>[0]) => saveCalendarEvent(d));
  const delMut = useCalendarMutation((d: Parameters<typeof deleteCalendarEvent>[0]) => deleteCalendarEvent(d), "Đã xóa mốc");

  const events = data ?? [];

  const cells = useMemo(() => {
    const start = startOfMonth(cursor);
    const pad = (getDay(start) + 6) % 7;
    const begin = addDays(start, -pad);
    return Array.from({ length: 42 }, (_, i) => ymd(addDays(begin, i)));
  }, [cursor]);

  const upcoming = useMemo(() => {
    return events
      .map((ev) => {
        const occur = nextOccurrence(ev, today);
        return occur ? { ev, occur, days: remainingDays(today, occur) } : null;
      })
      .filter((x): x is { ev: CalendarEvent; occur: string; days: number } => Boolean(x))
      .sort((a, b) => a.occur.localeCompare(b.occur) || a.ev.title.localeCompare(b.ev.title));
  }, [events, today]);

  const past = useMemo(() => {
    return events
      .map((ev) => {
        const occur = prevOccurrence(ev, today);
        return occur ? { ev, occur } : null;
      })
      .filter((x): x is { ev: CalendarEvent; occur: string } => Boolean(x))
      .sort((a, b) => b.occur.localeCompare(a.occur))
      .slice(0, 12);
  }, [events, today]);

  const onSelected = events.filter((ev) => occursOn(ev, selected));
  const monthLabel = format(cursor, "MM/yyyy");

  function openNew(date = selected) {
    setDraft({ title: "", eventDate: date, yearly: false, notes: "" });
  }

  function openEdit(ev: CalendarEvent) {
    setDraft({
      id: ev.id,
      title: ev.title,
      eventDate: ev.eventDate,
      yearly: ev.yearly,
      notes: ev.notes ?? "",
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const title = draft.title.trim();
    if (!title) return;
    saveMut.mutate(
      {
        data: {
          id: draft.id,
          title,
          eventDate: draft.eventDate,
          yearly: draft.yearly,
          notes: draft.notes.trim() || undefined,
        },
      },
      { onSuccess: () => setDraft(null) },
    );
  }

  if (isPending) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Lịch kinh tế</h1>
          <p className="text-sm text-muted-foreground">
            Nhập mốc · banner hiện từ 3 ngày trước đến đúng ngày, trên mọi trang
          </p>
        </div>
        <Button onClick={() => openNew()} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Thêm mốc
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-md hover:bg-muted"
              onClick={() => setCursor((d) => startOfMonth(subMonths(d, 1)))}
              aria-label="Tháng trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold tabular-nums">Tháng {monthLabel}</p>
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-md hover:bg-muted"
              onClick={() => setCursor((d) => startOfMonth(addMonths(d, 1)))}
              aria-label="Tháng sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {WEEK.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((iso) => {
              const inMonth = iso.slice(0, 7) === ymd(cursor).slice(0, 7);
              const marks = events.filter((ev) => occursOn(ev, iso));
              const isToday = iso === today;
              const isSel = iso === selected;
              const hot = marks.some((ev) => {
                const n = nextOccurrence(ev, today);
                return n === iso && remainingDays(today, n) <= 3;
              });
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelected(iso)}
                  onDoubleClick={() => openNew(iso)}
                  className={cn(
                    "flex min-h-12 flex-col items-center rounded-lg border px-1 py-1 text-sm transition-colors",
                    inMonth ? "border-transparent" : "border-transparent text-muted-foreground/40",
                    isSel && "border-primary bg-primary/10",
                    !isSel && isToday && "border-warn/40 bg-warn/10",
                    !isSel && !isToday && "hover:bg-muted",
                  )}
                >
                  <span className={cn("font-medium tabular-nums", isToday && "text-warn")}>
                    {Number(iso.slice(8))}
                  </span>
                  {marks.length > 0 && (
                    <span className="mt-0.5 flex gap-0.5">
                      {marks.slice(0, 3).map((ev) => (
                        <span
                          key={ev.id}
                          className={cn("h-1.5 w-1.5 rounded-full", hot ? "bg-warn" : "bg-primary")}
                        />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Chọn ngày · nhấn đúp để thêm mốc · chấm vàng = trong 3 ngày tới
          </p>

          <div className="mt-4 border-t border-border pt-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {formatViDate(selected)}
            </p>
            {onSelected.length === 0 ? (
              <button
                type="button"
                onClick={() => openNew(selected)}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Thêm mốc ngày này
              </button>
            ) : (
              <ul className="mt-2 space-y-2">
                {onSelected.map((ev) => (
                  <li key={ev.id} className="flex items-start justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">{ev.title}</p>
                      {ev.yearly && (
                        <Badge tone="navy" className="mt-1">
                          Lặp hàng năm
                        </Badge>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="outline" onClick={() => openEdit(ev)}>
                        Sửa
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => delMut.mutate({ data: { id: ev.id } })}>
                        Xóa
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle>Sắp tới</CardTitle>
            <CardDesc className="mb-3">Kể cả mốc lặp năm sau</CardDesc>
            <ul className="space-y-2 text-sm">
              {upcoming.length === 0 && <li className="text-muted-foreground">Chưa có mốc phía trước.</li>}
              {upcoming.map(({ ev, occur, days }) => (
                <li key={ev.id} className="flex items-start justify-between gap-2 border-b border-border/70 pb-2 last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatViDate(occur)}
                      {ev.yearly ? " · hàng năm" : ""}
                    </p>
                  </div>
                  <Badge tone={days === 0 ? "warn" : days <= 3 ? "navy" : "muted"}>
                    {days === 0 ? "Hôm nay" : `Còn ${days} ngày`}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardTitle>Đã qua</CardTitle>
            <CardDesc className="mb-3">12 mốc gần nhất</CardDesc>
            <ul className="space-y-2 text-sm">
              {past.length === 0 && <li className="text-muted-foreground">Chưa có mốc đã qua.</li>}
              {past.map(({ ev, occur }) => (
                <li key={`${ev.id}:${occur}`} className="flex justify-between gap-2 text-muted-foreground">
                  <span className="min-w-0 truncate">{ev.title}</span>
                  <span className="shrink-0 tabular-nums">{formatViDate(occur)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent title={draft?.id ? "Sửa mốc" : "Thêm mốc"}>
          {draft && (
            <form className="space-y-3" onSubmit={submit}>
              <p className="text-sm text-muted-foreground">
                Tiêu đề sẽ vào câu thông báo: «Hôm nay là …» / «Còn 3 ngày nữa đến …»
              </p>
              <div className="space-y-1">
                <Label>Tiêu đề</Label>
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="ngày họp FED"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Ngày</Label>
                <Input
                  type="date"
                  value={draft.eventDate}
                  onChange={(e) => setDraft({ ...draft, eventDate: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Lặp hàng năm</p>
                  <p className="text-xs text-muted-foreground">Cùng ngày mỗi năm (vd. đáo hạn phái sinh)</p>
                </div>
                <Switch checked={draft.yearly} onCheckedChange={(v) => setDraft({ ...draft, yearly: v })} />
              </div>
              <div className="space-y-1">
                <Label>Ghi chú (tùy chọn)</Label>
                <Input
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={saveMut.isPending}>
                {saveMut.isPending ? "Đang lưu..." : "Lưu mốc"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}