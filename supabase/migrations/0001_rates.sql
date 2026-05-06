create table if not exists public.exchange_rates (
  code text primary key,
  base_currency text not null check (base_currency in ('USD', 'EUR')),
  quote_currency text not null default 'VES' check (quote_currency = 'VES'),
  value numeric(14, 4) not null check (value > 0),
  source text not null default 'dolarapi',
  source_name text not null,
  source_updated_at timestamptz not null,
  fetched_at timestamptz not null default now()
);

create table if not exists public.exchange_rate_history (
  id bigint generated always as identity primary key,
  code text not null,
  base_currency text not null check (base_currency in ('USD', 'EUR')),
  quote_currency text not null default 'VES' check (quote_currency = 'VES'),
  value numeric(14, 4) not null check (value > 0),
  source text not null default 'dolarapi',
  source_name text not null,
  source_updated_at timestamptz not null,
  fetched_at timestamptz not null default now()
);

create index if not exists exchange_rate_history_code_fetched_at_idx
on public.exchange_rate_history (code, fetched_at desc);

alter table public.exchange_rates enable row level security;
alter table public.exchange_rate_history enable row level security;

grant select on public.exchange_rates to anon, authenticated;
grant select on public.exchange_rate_history to anon, authenticated;

drop policy if exists "exchange_rates_public_read" on public.exchange_rates;
create policy "exchange_rates_public_read"
on public.exchange_rates
for select
to anon, authenticated
using (true);

drop policy if exists "exchange_rate_history_public_read" on public.exchange_rate_history;
create policy "exchange_rate_history_public_read"
on public.exchange_rate_history
for select
to anon, authenticated
using (true);
