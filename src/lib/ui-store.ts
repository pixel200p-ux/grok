import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatViDate } from "@/engine/dates";
import { displayMoney } from "@/lib/display";
import { useMilestones, useProfile, useSaveProfile } from "@/lib/use-profile";
import { usePortfolio } from "@/lib/use-portfolio";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { FilterMenu } from "@/components/FilterMenu";
import { useUiStore } from "@/lib/ui-store";

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
  const coverBox = useRef<HTMLButtonElement>(null);
  const avaBox = useRef<HTMLButtonElement>(null);
  const origin = useRef<{ l: number; t: number } | null>(null);
  const decor = useUiStore((s) => s.profileDecor);
  const setDecor = useUiStore((s) => s.setProfileDecor);
  const [vp, setVp] = useState({ w: 1280, h: 800 });
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [kindFilter, setKindFilter] = useState("ALL");

  const p = Math.max(0, Math.min(1, Number(decor) || 0));

  useEffect(() => {
    function r() {
      setVp({ w: window.innerWidth, h: window.innerHeight });
    }
    r();
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  useEffect(() => {
    return () => setDecor(0);
  }, [setDecor]);

  useEffect(() => {
    document.body.style.overflow = p > 0.02 ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [p]);

  useEffect(() => {
    function atTop() {
      const main = document.querySelector("main");
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const my = main instanceof HTMLElement ? main.scrollTop : 0;
      return y <= 2 && my <= 2;
    }
    function capture() {
      if (origin.current || !avaBox.current) return;
      const r = avaBox.current.getBoundingClientRect();
      origin.current = { l: r.left, t: r.top };
    }
    function onWheel(e: WheelEvent) {
      const cur = Math.max(0, Math.min(1, Number(useUiStore.getState().profileDecor) || 0));
      const goingUp = e.deltaY < 0;
      if (cur <= 0 && (!atTop() || !goingUp)) return;
      if (cur <= 0 && goingUp) capture();
      e.preventDefault();
      const next = Math.max(0, Math.min(1, cur - e.deltaY / 900));
      if (next <= 0) origin.current = null;
      setDecor(next);
    }
    let startY = 0;
    function onTouchStart(e: TouchEvent) {
      startY = e.touches[0]?.clientY ?? 0;
    }
    function onTouchMove(e: TouchEvent) {
      const y = e.touches[0]?.clientY ?? 0;
      const dy = startY - y;
      startY = y;
      const cur = Math.max(0, Math.min(1, Number(useUiStore.getState().profileDecor) || 0));
      if (cur <= 0 && (!atTop() || dy <= 0)) return;
      if (cur <= 0 && dy > 0) capture();
      e.preventDefault();
      const next = Math.max(0, Math.min(1, cur + dy / 500));
      if (next <= 0) origin.current = null;
      setDecor(next);
    }
    const opts = { passive: false, capture: true } as const;
    window.addEventListener("wheel", onWheel, opts);
    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", onTouchMove, opts);
    return () => {
      window.removeEventListener("wheel", onWheel, opts);
      window.removeEventListener("touchstart", onTouchStart, true);
      window.removeEventListener("touchmove", onTouchMove, opts);
    };
  }, [setDecor]);

  const txStats = useMemo(() => {
    const empty = { open: 0, closed: 0, buys: 0, sells: 0, bankOpen: 0, bankClosed: 0 };
    if (!portfolio) return empty;
    const txs = portfolio.ledger.transactions.filter((t) => !t.deletedAt);
    const buys = txs.filter((t) => t.txType === "BUY");
    const sells = txs.filter((t) => t.txType === "SELL");
    const tplusLeft = new Map<string, number>();
    for (const h of portfolio.state.holdings) {
      for (const lot of h.openLots) {
        tplusLeft.set(lot.buyTxId, (tplusLeft.get(lot.buyTxId) ?? 0) + lot.qtyRemaining);
      }
    }
    const coreOpen = new Set(portfolio.state.holdings.filter((h) => h.coreQty > 0).map((h) => h.assetId));
    let open = 0;
    for (const b of buys) {
      if (b.tradeTplus) {
        if ((tplusLeft.get(b.id) ?? 0) > 0) open += 1;
      } else if (b.assetId && coreOpen.has(b.assetId)) {
        open += 1;
      }
    }
    const banks = portfolio.ledger.banks.filter((b) => !b.deletedAt);
    const bankOpen = portfolio.state.banks.filter((b) => b.status === "ACTIVE").length;
    return {
      open,
      closed: buys.length - open,
      buys: buys.length,
      sells: sells.length,
      bankOpen,
      bankClosed: Math.max(0, banks.length - bankOpen),
    };
  }, [portfolio]);

  const timeline = useMemo(() => {
    const list = (marks ?? []).filter((m) => {
      if (kindFilter === "ALL") return true;
      if (kindFilter === "nav" || kindFilter === "orig" || kindFilter === "pnl" || kindFilter === "tplus") {
        return m.kind === kindFilter;
      }
      return m.bucket === kindFilter;
    });
    const order: string[] = [];
    const map = new Map<string, typeof list>();
    for (const m of list) {
      if (!map.has(m.date)) {
        map.set(m.date, []);
        order.push(m.date);
      }
      map.get(m.date)!.push(m);
    }
    return order.map((date) => ({ date, items: map.get(date)! }));
  }, [marks, kindFilter]);

  if (isPending || !profile) return <Skeleton className="h-96" />;

  const name = nameDraft ?? profile.displayName;
  const startSize = 112;
  const endSize = vp.w / 8;
  const size = startSize + (endSize - startSize) * p;
  const barH = vp.h / 8;
  const endTop = vp.h - barH - size / 2;
  const endLeft = 20;
  const from = origin.current ?? { l: 20, t: endTop };
  const avLeft = from.l + (endLeft - from.l) * p;
  const avTop = from.t + (endTop - from.t) * p;
  const fontPx = 24 * (size / startSize);
  const coverH = vp.h * (0.33 + 0.545 * p);

  return (
    <div className="-mx-3 -mt-3 md:-mx-6 md:-mt-6">
      <button
        ref={coverBox}
        type="button"
        onDoubleClick={() => coverRef.current?.click()}
        className={cn(
          "overflow-hidden bg-[#4a5d4e]",
          p > 0 ? "fixed top-0 right-0 left-0 z-[60]" : "relative block h-[33dvh] min-h-45 w-full",
        )}
        style={p > 0 ? { height: coverH } : undefined}
        title="Nhấp đúp để đổi ảnh nền"
      >
        {profile.coverData ? (
          <img src={profile.coverData} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-sm text-white/80">Nhấp đúp để chọn ảnh nền</div>
        )}
      </button>
      {p > 0 && (
        <div
          className="pointer-events-none fixed bottom-0 left-0 right-0 z-[65]"
          style={{
            height: barH * p,
            background: "color-mix(in oklab, var(--app-bg) 92%, black)",
          }}
        />
      )}
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

      <div className="relative z-[70] px-3 md:px-6">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:gap-4">
          <button
            ref={avaBox}
            type="button"
            onDoubleClick={() => avaRef.current?.click()}
            className={cn(
              "shrink-0 overflow-hidden rounded-full border-4 border-background bg-muted shadow-md",
              p > 0 ? "fixed z-[80]" : "relative -mt-14 h-28 w-28",
            )}
            style={p > 0 ? { left: avLeft, top: avTop, width: size, height: size, pointerEvents: "auto" } : undefined}
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
          <div
            className="min-w-0 flex-1 pb-1"
            style={
              p > 0
                ? {
                    position: "fixed",
                    zIndex: 80,
                    left: avLeft + size + 16,
                    top: avTop + size / 2,
                    transform: "translateY(-50%)",
                    pointerEvents: "auto",
                  }
                : undefined
            }
          >
            {editingName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const next = name.trim() || "pixel200p";
                  save.mutate(
                    { data: { displayName: next } },
                    { onSuccess: () => { setNameDraft(null); setEditingName(false); } },
                  );
                }}
              >
                <Input
                  autoFocus
                  value={name}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={() => {
                    const next = name.trim() || "pixel200p";
                    if (next !== profile.displayName) {
                      save.mutate(
                        { data: { displayName: next } },
                        { onSuccess: () => { setNameDraft(null); setEditingName(false); } },
                      );
                    } else {
                      setNameDraft(null);
                      setEditingName(false);
                    }
                  }}
                  className="max-w-sm font-semibold tracking-tight"
                  style={{ fontSize: fontPx }}
                />
              </form>
            ) : (
              <h1
                className="cursor-text font-semibold tracking-tight"
                style={{ fontSize: fontPx }}
                title="Nhấp đúp để đổi tên"
                onDoubleClick={() => setEditingName(true)}
              >
                {profile.displayName}
              </h1>
            )}
            {p < 0.15 && (
              <p className="text-xs text-muted-foreground">Nhấp đúp ảnh nền / avatar / tên để sửa</p>
            )}
          </div>
        </div>

        <div
          className="mt-6 grid gap-4 lg:grid-cols-3"
          style={{
            opacity: 1 - p,
            transform: `translateY(${p * 28}px)`,
            pointerEvents: p > 0.2 ? "none" : "auto",
            visibility: p > 0.92 ? "hidden" : "visible",
          }}
        >
          <Card className="min-h-64">
            <CardTitle>Thống kê lệnh</CardTitle>
            <CardDesc className="mb-3">Không tính lệnh đã xóa</CardDesc>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-background/70 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Đang mở</p>
                <p className="font-mono text-2xl font-semibold tabular-nums">{txStats.open}</p>
              </div>
              <div className="rounded-lg bg-background/70 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Đã chốt</p>
                <p className="font-mono text-2xl font-semibold tabular-nums">{txStats.closed}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Mua {txStats.buys} · Bán {txStats.sells}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sổ Bank: đang gửi {txStats.bankOpen} · tất toán {txStats.bankClosed}
            </p>
          </Card>
          <Card className="min-h-64 border-dashed">
            <CardTitle className="text-muted-foreground">Trống</CardTitle>
            <CardDesc>Sẽ bổ sung sau</CardDesc>
          </Card>
          <Card className="flex min-h-64 flex-col">
            <div className="mb-2 flex items-center justify-between gap-2">
              <CardTitle>Performance history</CardTitle>
              <FilterMenu
                value={kindFilter}
                onChange={setKindFilter}
                options={[
                  { id: "ALL", label: "All" },
                  { id: "nav", label: "NAV" },
                  { id: "orig", label: "Original" },
                  { id: "pnl", label: "Lãi/lỗ" },
                  { id: "tplus", label: "T+" },
                  { id: "DCDS", label: "DCDS" },
                  { id: "ETF", label: "ETF" },
                  { id: "VPS", label: "VPS" },
                  { id: "SSI", label: "SSI" },
                  { id: "CRYPTO", label: "Crypto" },
                  { id: "BANK", label: "Bank" },
                ]}
              />
            </div>
            <CardDesc className="mb-3">Ngày đầu tiên cán mốc · mới nhất trên cùng</CardDesc>
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
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground">{formatViDate(g.date)}</p>
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