import { Card } from "@/components/ui/card";
import { formatPct } from "@/engine/money";
import { displayMoney } from "@/lib/display";
import { useUiStore } from "@/lib/ui-store";

export function NavOriginalCard({
  title,
  originalLabel,
  nav,
  original,
  usdVnd,
}: {
  title: string;
  originalLabel: string;
  nav: number;
  original: number;
  usdVnd: number;
}) {
  const currency = useUiStore((s) => s.currency);
  const barPct =
    original > 0 ? Math.min(100, (nav / original) * 100) : nav > 0 ? 100 : 0;

  return (
    <Card className="flex flex-col p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted-foreground">NAV</p>
          <p className="truncate font-mono text-xl font-semibold tabular-nums tracking-tight">
            {displayMoney(nav, currency, usdVnd)}
          </p>
        </div>
        <span className="mb-0.5 shrink-0 text-lg font-light text-muted-foreground/40">/</span>
        <div className="min-w-0 flex-1 text-right">
          <p className="text-[11px] text-muted-foreground">{originalLabel}</p>
          <p className="truncate font-mono text-sm font-medium tabular-nums text-muted-foreground">
            {displayMoney(original, currency, usdVnd)}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${nav >= original ? "bg-profit" : "bg-loss"}`}
            style={{ width: `${barPct}%` }}
          />
        </div>
      </div>
      <p className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span>Tỷ lệ NAV trên vốn gốc</span>
        <span className="shrink-0 font-mono tabular-nums">
          {original > 0
            ? `${(nav / original).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}×`
            : "—"}
        </span>
      </p>
    </Card>
  );
}

export function PnlCard({
  pnl,
  original,
  subtitle,
  usdVnd,
}: {
  pnl: number;
  original: number;
  subtitle: string;
  usdVnd: number;
}) {
  const currency = useUiStore((s) => s.currency);
  const pct = original > 0 ? (pnl / original) * 100 : 0;

  return (
    <Card className="flex flex-col p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Lãi / lỗ
      </p>
      <p
        className={`mt-3 font-mono text-xl font-semibold tabular-nums ${
          pnl > 0 ? "text-profit" : pnl < 0 ? "text-loss" : ""
        }`}
      >
        {displayMoney(pnl, currency, usdVnd)}
      </p>
      {original > 0 ? (
        <p className="mt-1 font-mono text-sm tabular-nums text-muted-foreground">{formatPct(pct)}</p>
      ) : (
        <p className="mt-1 text-sm text-transparent">.</p>
      )}
      <p className="mt-auto border-t border-border pt-3 text-[11px] leading-snug text-muted-foreground">
        {subtitle}
      </p>
    </Card>
  );
}

export function TplusLoweredCard({
  title = "T+ đã hạ vốn",
  amount,
  hint,
  usdVnd,
}: {
  title?: string;
  amount: number;
  hint: string;
  usdVnd: number;
}) {
  const currency = useUiStore((s) => s.currency);
  return (
    <Card className="flex flex-col p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <p className="mt-3 font-mono text-xl font-semibold tabular-nums">
        {displayMoney(amount, currency, usdVnd)}
      </p>
      <p className="mt-1 text-sm text-transparent">.</p>
      <p className="mt-auto border-t border-border pt-3 text-[11px] leading-snug text-muted-foreground">
        {hint}
      </p>
    </Card>
  );
}