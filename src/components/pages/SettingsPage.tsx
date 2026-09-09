import { Button } from "@/components/ui/button";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveFees } from "@/lib/api/portfolio";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { signOut } from "@/lib/auth/client";
import { usePortfolio, usePortfolioMutation } from "@/lib/use-portfolio";
import { useUiStore } from "@/lib/ui-store";
import { LogOut, Moon, Pencil, Sun } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import type { FeeProfile } from "@/engine/types";

const PROFILES: { id: FeeProfile; label: string }[] = [
  { id: "STOCK_VPS", label: "VPS Stock" },
  { id: "STOCK_SSI", label: "SSI Stock" },
  { id: "CRYPTO", label: "Crypto" },
  { id: "DCDS", label: "DCDS" },
  { id: "ETF", label: "ETF" },
];

export function SettingsPage() {
  const user = useCurrentUser();
  const { data, isPending } = usePortfolio();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const feeMut = usePortfolioMutation((d: Parameters<typeof saveFees>[0]) => saveFees(d), "Đã lưu phí");
  const [draft, setDraft] = useState<Record<string, { buy: string; sell: string; tax: string }>>({});
  const [signingOut, setSigningOut] = useState(false);
  const [editFees, setEditFees] = useState(false);

  if (isPending || !data) return <Skeleton className="h-64" />;
  const email = user?.primaryEmail ?? user?.displayName ?? "Account";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-4xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Phí / thuế mặc định sửa tại đây. Tỷ giá đổi bằng nút Cập nhật giá.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardTitle>Hồ sơ</CardTitle>
          <div className="mt-3 flex items-center gap-2">
            <span className="min-w-0 truncate text-sm">{email}</span>
            <Tooltip content="Đăng xuất">
              <button
                type="button"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-md hover:bg-muted"
                disabled={signingOut}
                onClick={() => {
                  setSigningOut(true);
                  void signOut().catch(() => setSigningOut(false));
                }}
                aria-label="Đăng xuất"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Sổ cái dùng chung mọi tài khoản đã đăng nhập.</p>
        </Card>

        <Card>
          <CardTitle>Tỷ giá USD/VND</CardTitle>
          <CardDesc>Chỉ xem · cập nhật từ header</CardDesc>
          <p className="mt-3 font-mono text-2xl font-semibold tabular-nums tracking-tight">
            {data.state.usdVnd.toLocaleString("vi-VN")}
          </p>
        </Card>

        <Card>
          <CardTitle>Theme</CardTitle>
          <div className="mt-3 flex gap-2">
            <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")}>
              <Sun className="h-4 w-4" /> Sáng
            </Button>
            <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")}>
              <Moon className="h-4 w-4" /> Tối
            </Button>
          </div>
        </Card>
      </div>

            <Card>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>Phí &amp; thuế mặc định</CardTitle>
            <CardDesc>
              {editFees ? "Sửa từng card rồi Lưu" : "Chứng khoán trên · quỹ / crypto dưới"}
            </CardDesc>
          </div>
          <Button size="sm" variant={editFees ? "outline" : "default"} onClick={() => setEditFees((v) => !v)}>
            {editFees ? "Xong" : (<><Pencil className="h-3.5 w-3.5" /> Chỉnh sửa</>)}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {PROFILES.map((p) => {
            const row = data.ledger.fees.find((f) => f.profile === p.id);
            const d = draft[p.id] ?? {
              buy: String(row?.buyFeePct ?? 0),
              sell: String(row?.sellFeePct ?? 0),
              tax: String(row?.sellTaxPct ?? 0),
            };
            const span =
              p.id === "STOCK_VPS" || p.id === "STOCK_SSI" ? "lg:col-span-3" : "lg:col-span-2";
            return (
              <div key={p.id} className={`rounded-xl border border-border bg-background/50 p-3 ${span}`}>
                <p className="text-sm font-semibold">{p.label}</p>
                {editFees ? (
                  <form
                    className="mt-3 space-y-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      feeMut.mutate({
                        data: {
                          profile: p.id,
                          buyFeePct: Number(d.buy),
                          sellFeePct: Number(d.sell),
                          sellTaxPct: Number(d.tax),
                        },
                      });
                    }}
                  >
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[11px]">Mua %</Label>
                        <Input value={d.buy} onChange={(e) => setDraft((x) => ({ ...x, [p.id]: { ...d, buy: e.target.value } }))} />
                      </div>
                      <div>
                        <Label className="text-[11px]">Bán %</Label>
                        <Input value={d.sell} onChange={(e) => setDraft((x) => ({ ...x, [p.id]: { ...d, sell: e.target.value } }))} />
                      </div>
                      <div>
                        <Label className="text-[11px]">Thuế %</Label>
                        <Input value={d.tax} onChange={(e) => setDraft((x) => ({ ...x, [p.id]: { ...d, tax: e.target.value } }))} />
                      </div>
                    </div>
                    <Button type="submit" size="sm" className="w-full">Lưu</Button>
                  </form>
                ) : (
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <dt className="text-[11px] text-muted-foreground">Mua</dt>
                      <dd className="font-mono text-sm font-semibold tabular-nums">{row?.buyFeePct ?? 0}%</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-muted-foreground">Bán</dt>
                      <dd className="font-mono text-sm font-semibold tabular-nums">{row?.sellFeePct ?? 0}%</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-muted-foreground">Thuế</dt>
                      <dd className="font-mono text-sm font-semibold tabular-nums">{row?.sellTaxPct ?? 0}%</dd>
                    </div>
                  </dl>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}