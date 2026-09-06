import { AllocChart } from "@/components/AllocChart";
import { HoldingsTable } from "@/components/HoldingsTable";
import { Kpi } from "@/components/Kpi";
import { TplusOpenCard } from "@/components/TplusOpenCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { formatViDate } from "@/engine/dates";
import { formatPct, signedClass } from "@/engine/money";
import { displayMoney } from "@/lib/display";
import { usePortfolio } from "@/lib/use-portfolio";
import { useUiStore } from "@/lib/ui-store";
import { confirmBankRate } from "@/lib/api/portfolio";
import { usePortfolioMutation } from "@/lib/use-portfolio";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

const CAT_ORDER = ["DCDS", "ETF", "STOCK", "CRYPTO", "BANK"] as const;
const CAT_LABEL: Record<string, string> = {
  DCDS: "DCDS",
  ETF: "ETF",
  STOCK: "Stock",
  CRYPTO: "Crypto",
  BANK: "Bank",
};

export function DashboardPage() {
  const { data, isPending } = usePortfolio();
  const currency = useUiStore((s) => s.currency);
  const stockFilter = useUiStore((s) => s.stockFilter);
  const setStockFilter = useUiStore((s) => s.setStockFilter);
  const openCapital = useUiStore((s) => s.openCapital);
  const openTx = useUiStore((s) => s.openTx);
  const rateMut = usePortfolioMutation((d: Parameters<typeof confirmBankRate>[0]) => confirmBankRate(d), "Đã cập nhật lãi suất");
  const [rateDraft, setRateDraft] = useState<Record<string, string>>({});

  if (isPending || !data) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const { state, ledger } = data;
  const usd = state.usdVnd;
  const holdings = state.holdings.filter((h) => {
    if (stockFilter === "ALL") return true;
    if (h.assetType !== "STOCK") return true;
    return h.accountId === stockFilter;
  });

  const due = state.banks.filter((b) => b.remainingDays <= 5);
  const alloc = CAT_ORDER.map((k) => ({
    key: k,
    label: CAT_LABEL[k],
    value: state.allocation[k]?.value ?? 0,
    pct: state.allocation[k]?.pct ?? 0,
  }));

  const recent = [...ledger.transactions].sort((a, b) => b.txDate.localeCompare(a.txDate) || b.createdAt.localeCompare(a.createdAt)).slice(0, 8);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Sổ cái thật · Asset-Only Ledger</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => openCapital("DEPOSIT")}>Nạp vốn gốc</Button>
          <Button variant="outline" onClick={() => openCapital("WITHDRAW")}>
            Rút vốn gốc
          </Button>
          <Button variant="outline" onClick={() => openTx()}>
            Giao dịch
          </Button>
        </div>
      </div>

      {due.map((b) => (
        <Card key={b.id} className="border-warn/40 bg-warn/5 p-4">
          {b.remainingDays <= 0 ? (
            <p className="text-sm font-medium">
              Hết hôm nay số tiền gửi ngân hàng {b.bankName} sẽ đáo hạn — {displayMoney(b.currentPrincipal, currency, usd)}.
            </p>
          ) : (
            <p className="text-sm font-medium">
              Sổ {b.bankName} còn {b.remainingDays} ngày đáo hạn. Nhập lãi suất kỳ tái tục nếu có thay đổi.
            </p>
          )}
          {b.rateUnconfirmed && (
            <p className="mt-1 text-xs text-warn">Vẫn chưa nhập lãi suất kỳ này — đang dùng tạm {b.currentRate}%.</p>
          )}
          <form
            className="mt-3 flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const r = Number(rateDraft[b.id] ?? b.currentRate);
              rateMut.mutate({ data: { depositId: b.id, periodNumber: b.rateUnconfirmed ? b.renewalCount : b.renewalCount + 1, interestRate: r } });
            }}
          >
            <Input
              className="w-28"
              value={rateDraft[b.id] ?? String(b.currentRate)}
              onChange={(e) => setRateDraft((d) => ({ ...d, [b.id]: e.target.value }))}
            />
            <span className="text-xs text-muted-foreground">%/năm</span>
            <Button size="sm" type="submit">
              Lưu lãi suất
            </Button>
          </form>
        </Card>
      ))}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-stretch">
        <Card className="flex flex-col p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            NAV / Original Capital
          </p>
          <div className="mt-3 flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted-foreground">NAV</p>
              <p className="truncate font-mono text-xl font-semibold tabular-nums tracking-tight">
                {displayMoney(state.nav, currency, usd)}
              </p>
            </div>
            <span className="mb-0.5 shrink-0 text-lg font-light text-muted-foreground/40">/</span>
            <div className="min-w-0 flex-1 text-right">
              <p className="text-[11px] text-muted-foreground">Original Capital</p>
              <p className="truncate font-mono text-sm font-medium tabular-nums text-muted-foreground">
                {displayMoney(state.originalCapital, currency, usd)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${state.nav >= state.originalCapital ? "bg-profit" : "bg-loss"}`}
                style={{
                  width: `${
                    state.originalCapital > 0
                      ? Math.min(100, (state.nav / Math.max(state.originalCapital, 1)) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
          <p className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
            <span>Tỷ lệ NAV trên vốn gốc</span>
            <span className="shrink-0 font-mono tabular-nums">
              {state.originalCapital > 0
                ? `${(state.nav / state.originalCapital).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}×`
                : "—"}
            </span>
          </p>
        </Card>

        <Card className="flex flex-col p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Lãi / lỗ</p>
          <p
            className={`mt-3 font-mono text-xl font-semibold tabular-nums ${
              state.totalPnl > 0 ? "text-profit" : state.totalPnl < 0 ? "text-loss" : ""
            }`}
          >
            {displayMoney(state.totalPnl, currency, usd)}
          </p>
          <p className="mt-1 font-mono text-sm tabular-nums text-muted-foreground">{formatPct(state.totalReturnPct)}</p>
          <p className="mt-auto border-t border-border pt-3 text-[11px] leading-snug text-muted-foreground">
            Đã chốt + chưa chốt + cổ tức tiền mặt + lãi Bank
          </p>
        </Card>

        <Card className="flex flex-col p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">T+ đã hạ vốn</p>
          <p className="mt-3 font-mono text-xl font-semibold tabular-nums">
            {displayMoney(state.tplusProfit, currency, usd)}
          </p>
          <p className="mt-1 text-sm text-transparent">.</p>
          <p className="mt-auto border-t border-border pt-3 text-[11px] leading-snug text-muted-foreground">
            Lợi nhuận T+ ròng đã COMPLETED
          </p>
        </Card>
      </div>

      {state.tplusCards.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">T+ đang mở</h2>
              <p className="text-xs text-muted-foreground">
                Qty T+ cộng vào Holdings. Lãi ròng chỉ hạ giá vốn khi Sell đã khớp COMPLETED.
              </p>
            </div>
            <Link to="/tplus" className="text-sm text-primary hover:underline">
              Trade T+
            </Link>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {state.tplusCards.map((c) => (
              <TplusOpenCard key={c.assetId} card={c} usdVnd={usd} />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardTitle>Phân bổ</CardTitle>
          <CardDesc className="mb-3">DCDS → ETF → Stock → Crypto → Bank</CardDesc>
          <AllocChart data={alloc} />
        </Card>
        <Card className="lg:col-span-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Holdings</CardTitle>
              <CardDesc>VPS / SSI độc lập · T+ OPEN cộng vào SL</CardDesc>
            </div>
            <div className="flex gap-1">
              {(["ALL", "vps", "ssi"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStockFilter(f)}
                  className={`min-h-10 rounded-md border px-3 text-xs ${stockFilter === f ? "border-primary bg-primary/10" : "border-border"}`}
                >
                  {f === "ALL" ? "All" : f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <HoldingsTable rows={holdings} usdVnd={usd} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Vốn gốc gần đây</CardTitle>
          <ul className="mt-3 space-y-2 text-sm">
            {ledger.capital.length === 0 && <li className="text-muted-foreground">Chưa nạp vốn. Bấm Nạp vốn gốc.</li>}
            {ledger.capital
              .slice()
              .reverse()
              .slice(0, 6)
              .map((c) => (
                <li key={c.id} className="flex justify-between gap-2">
                  <span>
                    {formatViDate(c.movementDate)} · {c.kind === "DEPOSIT" ? "Nạp" : "Rút"}
                  </span>
                  <span className={c.kind === "DEPOSIT" ? "text-profit" : "text-loss"}>
                    {c.kind === "DEPOSIT" ? "+" : "−"}
                    {displayMoney(c.amount, currency, usd)}
                  </span>
                </li>
              ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Giao dịch gần đây</CardTitle>
          <ul className="mt-3 space-y-2 text-sm">
            {recent.length === 0 && <li className="text-muted-foreground">Chưa có lệnh. Sổ cái đang trống.</li>}
            {recent.map((t) => {
              const asset = ledger.assets.find((a) => a.id === t.assetId);
              return (
                <li key={t.id} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate">
                    {formatViDate(t.txDate)} · {t.txType} {asset?.symbol ?? ""} {t.tradeTplus ? <Badge tone="navy">T+</Badge> : null}
                  </span>
                  <span className={`shrink-0 font-mono tabular-nums ${signedClass(t.txType === "SELL" ? 1 : -1)}`}>
                    {t.quantity ?? ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
