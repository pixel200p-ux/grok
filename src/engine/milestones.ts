import { replayPortfolio } from "@/engine/replay";
import type { CapitalBucket, LedgerSnapshot, PortfolioState } from "@/engine/types";
import { CAPITAL_BUCKETS } from "@/engine/types";

export const MILESTONE_STEP = 50_000_000;

export type PriceSnap = { assetId: string; asOf: string; price: number };
export type FxSnap = { asOf: string; usdVnd: number };

export type Milestone = {
  id: string;
  date: string;
  label: string;
  threshold: number;
  value: number;
};

function sliceLedger(ledger: LedgerSnapshot, d: string): LedgerSnapshot {
  return {
    ...ledger,
    capital: ledger.capital.filter((c) => !c.deletedAt && c.movementDate <= d),
    transactions: ledger.transactions.filter((t) => !t.deletedAt && t.txDate <= d),
    matches: ledger.matches.filter((m) => {
      const sell = ledger.transactions.find((t) => t.id === m.sellTxId);
      return Boolean(sell && !sell.deletedAt && sell.txDate <= d);
    }),
    banks: ledger.banks.filter((b) => !b.deletedAt && b.startDate <= d),
  };
}

function overlayPrices(
  ledger: LedgerSnapshot,
  priceByAsset: Record<string, number>,
  fx: number,
): LedgerSnapshot {
  return {
    ...ledger,
    usdVnd: fx > 0 ? fx : ledger.usdVnd,
    assets: ledger.assets.map((a) => ({
      ...a,
      currentPrice: priceByAsset[a.id] ?? a.currentPrice,
    })),
  };
}

const BUCKET_LABEL: Record<CapitalBucket, string> = {
  DCDS: "DCDS",
  ETF: "ETF",
  VPS: "VPS",
  SSI: "SSI",
  CRYPTO: "Crypto",
  BANK: "Bank",
};

type Series = { key: string; title: string; read: (s: PortfolioState) => number };

function seriesList(): Series[] {
  const out: Series[] = [
    { key: "nav", title: "NAV tổng", read: (s) => s.nav },
    { key: "orig", title: "Original tổng", read: (s) => s.originalCapital },
    { key: "pnl", title: "Lãi/lỗ tổng", read: (s) => s.nav - s.originalCapital },
    {
      key: "tplus",
      title: "Lãi T+",
      read: (s) => s.tplusByBucket.VPS + s.tplusByBucket.SSI + s.tplusByBucket.CRYPTO,
    },
  ];
  for (const b of CAPITAL_BUCKETS) {
    const name = BUCKET_LABEL[b];
    out.push({ key: `nav.${b}`, title: `NAV ${name}`, read: (s) => s.navByBucket[b] });
    out.push({ key: `orig.${b}`, title: `Original ${name}`, read: (s) => s.originalByBucket[b] });
    out.push({
      key: `pnl.${b}`,
      title: `Lãi/lỗ ${name}`,
      read: (s) => s.navByBucket[b] - s.originalByBucket[b],
    });
  }
  return out;
}

export function computeMilestones(
  ledger: LedgerSnapshot,
  prices: PriceSnap[],
  fxRows: FxSnap[],
): Milestone[] {
  const dates = [...new Set(prices.map((p) => p.asOf))].sort();
  if (dates.length === 0) return [];

  const series = seriesList();
  const reached: Record<string, number> = {};
  for (const s of series) reached[s.key] = 0;

  const out: Milestone[] = [];
  const runningPx: Record<string, number> = {};
  let runningFx = ledger.usdVnd;

  for (const d of dates) {
    for (const p of prices) {
      if (p.asOf === d) runningPx[p.assetId] = p.price;
    }
    const fxHit = fxRows.find((f) => f.asOf === d);
    if (fxHit) runningFx = fxHit.usdVnd;

    const state = replayPortfolio(overlayPrices(sliceLedger(ledger, d), runningPx, runningFx), d);

    for (const s of series) {
      const v = s.read(state);
      if (v < MILESTONE_STEP) continue;
      const maxLv = Math.floor(v / MILESTONE_STEP);
      while (reached[s.key] < maxLv) {
        reached[s.key] += 1;
        const threshold = reached[s.key] * MILESTONE_STEP;
        out.push({
          id: `${s.key}:${threshold}:${d}`,
          date: d,
          label: `${s.title} đạt ${threshold / 1_000_000}tr`,
          threshold,
          value: v,
        });
      }
    }
  }

  out.sort((a, b) => b.date.localeCompare(a.date) || b.threshold - a.threshold);
  return out;
}