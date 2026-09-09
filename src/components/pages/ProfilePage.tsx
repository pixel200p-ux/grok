import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatViDate } from "@/engine/dates";
import { displayMoney } from "@/lib/display";
import { useMilestones, useProfile, useSaveProfile } from "@/lib/use-profile";
import { usePortfolio } from "@/lib/use-portfolio";
import { UserRound } from "lucide-react";
import { useMemo, useRef, useState } from "react";

function readImage(file: File, maxEdge: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không đọc được ảnh"));
    };
    img.src = url;
  });
}

export function ProfilePage() {
  const { data: profile, isPending } = useProfile();
  const { data: marks, isPending: marksPending } = useMilestones();
  const { data: portfolio } = usePortfolio();
  const save = useSaveProfile();
  const usd = portfolio?.state.usdVnd ?? 25000;
  const coverRef = useRef<HTMLInputElement>(null);
  const avaRef = useRef<HTMLInputElement>(null);
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);

  if (isPending || !profile) return <Skeleton className="h-96" />;

  const name = nameDraft ?? profile.displayName;
  const timeline = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, NonNullable<typeof marks>>();
    for (const m of marks ?? []) {
      if (!map.has(m.date)) {
        map.set(m.date, []);
        order.push(m.date);
      }
      map.get(m.date)!.push(m);
    }
    return order.map((date) => ({ date, items: map.get(date)! }));
  }, [marks]);
  return (
    <div className="-mx-3 -mt-3 md:-mx-6 md:-mt-6">
      <button
        type="button"
        onDoubleClick={() => coverRef.current?.click()}
        className="relative block h-[33dvh] min-h-[180px] w-full overflow-hidden bg-[#4a5d4e]"
        title="Nhấp đúp để đổi ảnh nền"
      >
        {profile.coverData ? (
          <img src={profile.coverData} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-sm text-white/80">Nhấp đúp để chọn ảnh nền</div>
        )}
      </button>
      <input
        ref={coverRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          const coverData = await readImage(f, 1920);
          save.mutate({ data: { coverData } });
        }}
      />

      <div className="px-3 md:px-6">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:gap-4">
          <button
            type="button"
            onDoubleClick={() => avaRef.current?.click()}
            className="relative -mt-14 h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-background bg-muted shadow-md"
            title="Nhấp đúp để đổi avatar"
          >
            {profile.avatarData ? (
              <img src={profile.avatarData} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full place-items-center text-muted-foreground">
                <UserRound className="h-10 w-10" />
              </span>
            )}
          </button>
          <input
            ref={avaRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              const avatarData = await readImage(f, 512);
              save.mutate({ data: { avatarData } });
            }}
          />
                    <div className="min-w-0 flex-1 pb-1">
            {editingName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const next = name.trim() || "pixel200p";
                  save.mutate({ data: { displayName: next } }, { onSuccess: () => { setNameDraft(null); setEditingName(false); } });
                }}
              >
                <Input
                  autoFocus
                  value={name}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={() => {
                    const next = name.trim() || "pixel200p";
                    if (next !== profile.displayName) {
                      save.mutate({ data: { displayName: next } }, { onSuccess: () => { setNameDraft(null); setEditingName(false); } });
                    } else {
                      setNameDraft(null);
                      setEditingName(false);
                    }
                  }}
                  className="max-w-sm text-2xl font-semibold tracking-tight"
                />
              </form>
            ) : (
              <h1
                className="cursor-text text-2xl font-semibold tracking-tight"
                title="Nhấp đúp để đổi tên"
                onDoubleClick={() => setEditingName(true)}
              >
                {profile.displayName}
              </h1>
            )}
            <p className="text-xs text-muted-foreground">Nhấp đúp ảnh nền / avatar / tên để sửa</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="min-h-[16rem] border-dashed">
            <CardTitle className="text-muted-foreground">Trống</CardTitle>
            <CardDesc>Sẽ bổ sung sau</CardDesc>
          </Card>
          <Card className="min-h-[16rem] border-dashed">
            <CardTitle className="text-muted-foreground">Trống</CardTitle>
            <CardDesc>Sẽ bổ sung sau</CardDesc>
          </Card>
                    <Card className="flex min-h-[16rem] flex-col">
            <CardTitle>Performance history</CardTitle>
            <CardDesc className="mb-3">Cây thời gian · mốc 50tr · mới nhất trên cùng</CardDesc>
            <div className="min-h-0 max-h-[min(52vh,28rem)] flex-1 overflow-y-auto pr-1">
              {marksPending && <p className="text-sm text-muted-foreground">Đang tính mốc…</p>}
              {!marksPending && timeline.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Chưa có snapshot giá. Mở Dashboard hoặc bấm Cập nhật giá lần đầu trong ngày.
                </p>
              )}
              <ol className="relative ml-2 border-l-2 border-border">
                {timeline.map((g) => (
                  <li key={g.date} className="relative pb-5 pl-5 last:pb-1">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-card" />
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground">
                      {formatViDate(g.date)}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {g.items.map((m) => (
                        <li key={m.id} className="rounded-md bg-background/70 px-2.5 py-1.5">
                          <p className="text-sm font-medium leading-snug">{m.label}</p>
                          <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
                            {displayMoney(m.value, "VND", usd)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}