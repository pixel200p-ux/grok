import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { displayMoney } from "@/lib/display";
import { useUiStore } from "@/lib/ui-store";

const COLORS: Record<string, string> = {
  VPS: "var(--app-chart-stock)",
  SSI: "var(--app-chart-bank)",
};

export function BrokerPieChart({
  data,
  usdVnd,
  centerLabel,
}: {
  data: { key: string; label: string; value: number; pct: number }[];
  usdVnd: number;
  centerLabel: string;
}) {
  const currency = useUiStore((s) => s.currency);
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0);
  const slices = data.filter((d) => d.value > 0);

  if (total <= 0) {
    return (
      <div className="grid h-44 place-items-center text-sm text-muted-foreground">Chưa có dữ liệu</div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={slices.length > 1 ? 3 : 0}
              stroke="var(--app-surface)"
              strokeWidth={3}
            >
              {slices.map((r) => (
                <Cell key={r.key} fill={COLORS[r.key] ?? "var(--app-navy)"} />
              ))}
            </Pie>
            <Tooltip
              wrapperStyle={{ zIndex: 30 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as { label: string; value: number; pct: number };
                return (
                                    <div className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground shadow-lg">
                    <p className="font-semibold">{p.label}</p>
                    <p className="mt-1 font-mono text-sm font-medium tabular-nums">
                      {displayMoney(p.value, currency, usdVnd)}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-foreground">{p.pct.toFixed(1)}%</p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 z-0 grid place-items-center">
          <div className="max-w-[5.75rem] px-1 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{centerLabel}</p>
            <p className="text-[11px] font-semibold leading-tight text-foreground">
              {displayMoney(total, currency, usdVnd)}
            </p>
          </div>
        </div>
      </div>

            <ul className="w-fit min-w-0 space-y-3">
        {data.map((r) => (
          <li key={r.key} className="flex items-center gap-30">
            <span className="flex items-center gap-2 text-sm font-medium">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: COLORS[r.key] ?? "var(--app-navy)" }}
              />
              {r.label}
            </span>
            <span className="text-right">
              <span className="block font-mono text-xs tabular-nums text-foreground">
                {displayMoney(r.value, currency, usdVnd)}
              </span>
              <span className="text-xs text-muted-foreground">{r.pct.toFixed(1)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}