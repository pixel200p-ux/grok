-- Gán mỗi lần Nạp/Rút vào một ô vốn gốc.
alter table capital_movements
  add column if not exists bucket text not null default 'DCDS';

alter table capital_movements
  drop constraint if exists capital_movements_bucket_check;

alter table capital_movements
  add constraint capital_movements_bucket_check
  check (bucket in ('DCDS','ETF','VPS','SSI','CRYPTO','BANK'));