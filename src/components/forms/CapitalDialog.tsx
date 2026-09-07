import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useUiStore } from "@/lib/ui-store";
import { usePortfolioMutation } from "@/lib/use-portfolio";
import { saveCapital } from "@/lib/api/portfolio";
import { parseVndAmount } from "@/engine/money";
import { todayYmd } from "@/engine/dates";
import type { CapitalBucket } from "@/engine/types";
import { useEffect, useState } from "react";

const BUCKETS: { value: CapitalBucket; label: string }[] = [
  { value: "DCDS", label: "DCDS" },
  { value: "ETF", label: "ETF" },
  { value: "VPS", label: "VPS" },
  { value: "SSI", label: "SSI" },
  { value: "CRYPTO", label: "Crypto" },
  { value: "BANK", label: "Bank" },
];

export function CapitalDialog() {
  const kind = useUiStore((s) => s.capitalOpen);
  const close = useUiStore((s) => s.closeCapital);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayYmd());
  const [notes, setNotes] = useState("");
  const [bucket, setBucket] = useState<CapitalBucket>("DCDS");
  const mut = usePortfolioMutation((d: Parameters<typeof saveCapital>[0]) => saveCapital(d), "Đã ghi vốn gốc");

  useEffect(() => {
    if (!kind) return;
    setAmount("");
    setNotes("");
    setDate(todayYmd());
    setBucket("DCDS");
  }, [kind]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!kind) return;
    const v = parseVndAmount(amount);
    if (v <= 0) return;
    mut.mutate(
      { data: { kind, amount: v, movementDate: date, notes: notes || undefined, bucket } },
      {
        onSuccess: () => {
          close();
        },
      },
    );
  }

  return (
    <Dialog open={!!kind} onOpenChange={(o) => !o && close()}>
      <DialogContent title={kind === "WITHDRAW" ? "Rút vốn gốc" : "Nạp vốn gốc"}>
        <form className="space-y-3" onSubmit={submit}>
          <p className="text-sm text-muted-foreground">
            Original Capital = tổng Original 6 ô. Mua, bán, sổ Bank, cổ tức không đụng vốn gốc.
          </p>
          <div className="space-y-1">
            <Label>Danh mục</Label>
            <Select value={bucket} onValueChange={(v) => setBucket(v as CapitalBucket)} options={BUCKETS} />
          </div>
          <div className="space-y-1">
            <Label>Số tiền (VND)</Label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50,000,000" required />
          </div>
          <div className="space-y-1">
            <Label>Ngày</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Ghi chú</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={mut.isPending}>
            {mut.isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}