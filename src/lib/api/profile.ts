import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { computeMilestones, type Milestone } from "@/engine/milestones";
import { mapAccount, mapAsset, mapBank, mapBankRate, mapCapital, mapFee, mapMatch, mapTx, n } from "@/lib/api/map";
import type { LedgerSnapshot } from "@/engine/types";

export type ProfilePayload = {
  displayName: string;
  coverData: string | null;
  avatarData: string | null;
};

function mapProfile(r: Record<string, unknown>): ProfilePayload {
  return {
    displayName: String(r.display_name ?? "pixel200p"),
    coverData: r.cover_data ? String(r.cover_data) : null,
    avatarData: r.avatar_data ? String(r.avatar_data) : null,
  };
}

export const fetchProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<ProfilePayload> => {
    try {
      const sql = await getSql();
      const rows = await sql`select display_name, cover_data, avatar_data from app_profile where id = 'default'`;
      if (!rows[0]) {
        await sql`insert into app_profile (id, display_name) values ('default', 'pixel200p') on conflict (id) do nothing`;
        return { displayName: "pixel200p", coverData: null, avatarData: null };
      }
      return mapProfile(rows[0] as Record<string, unknown>);
    } catch (err) {
      console.error("[profile]", err);
      return { displayName: "pixel200p", coverData: null, avatarData: null };
    }
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      displayName: z.string().min(1).max(80).optional(),
      coverData: z.string().nullable().optional(),
      avatarData: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }): Promise<ProfilePayload> => {
    const sql = await getSql();
    await sql`insert into app_profile (id, display_name) values ('default', 'pixel200p') on conflict (id) do nothing`;
    if (data.displayName != null) {
      const name = data.displayName.trim() || "pixel200p";
      await sql`update app_profile set display_name = ${name}, updated_at = now() where id = 'default'`;
    }
    if (data.coverData !== undefined) {
      await sql`update app_profile set cover_data = ${data.coverData}, updated_at = now() where id = 'default'`;
    }
    if (data.avatarData !== undefined) {
      await sql`update app_profile set avatar_data = ${data.avatarData}, updated_at = now() where id = 'default'`;
    }
    const rows = await sql`select display_name, cover_data, avatar_data from app_profile where id = 'default'`;
    return mapProfile(rows[0] as Record<string, unknown>);
  });

export const fetchMilestones = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<Milestone[]> => {
    try {
      const sql = await getSql();
      const [accounts, assets, capital, transactions, matches, banks, bankRates, fees, meta, snaps, fx] =
        await Promise.all([
          sql`select * from accounts order by id`,
          sql`select * from assets order by symbol`,
          sql`select * from capital_movements where deleted_at is null order by movement_date, created_at`,
          sql`select * from transactions where deleted_at is null order by tx_date, created_at`,
          sql`select * from tplus_matches`,
          sql`select * from bank_deposits where deleted_at is null order by start_date`,
          sql`select * from bank_rate_updates`,
          sql`select * from fee_settings`,
          sql`select value from app_meta where key = 'usd_vnd'`,
          sql`select asset_id, as_of::text as as_of, price from price_snapshots order by as_of, asset_id`,
          sql`select as_of::text as as_of, usd_vnd from fx_snapshots order by as_of`,
        ]);
      const ledger: LedgerSnapshot = {
        accounts: accounts.map(mapAccount),
        assets: assets.map(mapAsset),
        capital: capital.map(mapCapital),
        transactions: transactions.map(mapTx),
        matches: matches.map(mapMatch),
        banks: banks.map(mapBank),
        bankRates: bankRates.map(mapBankRate),
        fees: fees.map(mapFee),
        usdVnd: meta[0] ? n((meta[0] as { value: string }).value) || 25000 : 25000,
      };
      return computeMilestones(
        ledger,
        snaps.map((r) => ({
          assetId: String((r as { asset_id: string }).asset_id),
          asOf: String((r as { as_of: string }).as_of).slice(0, 10),
          price: n((r as { price: unknown }).price),
        })),
        fx.map((r) => ({
          asOf: String((r as { as_of: string }).as_of).slice(0, 10),
          usdVnd: n((r as { usd_vnd: unknown }).usd_vnd),
        })),
      );
    } catch (err) {
      console.error("[milestones]", err);
      return [];
    }
  });