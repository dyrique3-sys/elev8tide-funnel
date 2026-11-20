# ELEV8TIDE — Order System (Supabase) Setup

The store (`lab.html`) and the portal (`portal.html`) are built and working in **demo mode** (orders saved to the browser). To make it **live + multi-device + real customer accounts**, we connect a Supabase project. Two phases.

---

## What I need from Dyrique to switch it live
1. An **ELEV8TIDE Supabase project** — either:
   - let me create one via the Supabase connector (quick auth), **or**
   - you create a free project at supabase.com and send me the **Project URL** + **anon public key** (Settings → API).
2. That's it — I paste them into `SB={url,anon}` in both `lab.html` and `portal.html`, run the SQL below, and it's live.

---

## PHASE 1 — Orders live (admin portal) 
Run in Supabase → SQL editor:

```sql
create table orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  order_no text unique,
  name text, email text, phone text, address text,
  items jsonb, subtotal int, shipping int, total int, ship_method text,
  pay_status text default 'pending',
  fulfill_status text default 'unshipped',
  tracking text default '',
  user_id uuid            -- set in Phase 2 (ties order to a customer account)
);
alter table orders enable row level security;

-- the store (anon key) may CREATE orders only:
create policy "store can insert" on orders for insert to anon with check (true);

-- the portal requires a logged-in staff user to READ / UPDATE (protects customer PII):
create policy "staff read"   on orders for select to authenticated using (true);
create policy "staff update" on orders for update to authenticated using (true);
```

Then create **Nashay's portal login**: Supabase → Authentication → Add user (her email + password).
> ⚠️ Security: with these policies the **anon key cannot read orders** — only a logged-in staff user can. I'll add the Supabase email/password login screen to `portal.html` when we wire the real project (the current passcode gate is demo-only).

---

## PHASE 2 — Customer accounts (the funnel → account → track-your-order)
Adds: customers sign up at the funnel, the store knows them (prefills address, ties order to their account), and they get a **"My Orders"** page.

```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text, email text, phone text,
  street text, apt text, city text, state text, zip text,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "own profile"  on profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- orders: customers see/create their OWN; staff (Phase 1 policies) still see all
create policy "own orders read"   on orders for select to authenticated using (user_id = auth.uid());
create policy "own orders insert" on orders for insert to authenticated with check (user_id = auth.uid());
```
Staff vs. customer is separated by an **admin allow-list** (a `staff` table or an email check) so Nashay sees all, customers see only theirs.

**Pages I build in Phase 2:**
- Funnel signup → creates the account (smooth: magic-link or email+password, with guest-checkout fallback so we don't wall off cold buyers).
- Store → "logged in as…" + address prefilled from `profiles`; order saved with `user_id`.
- `account.html` → customer's own orders + live status + tracking #.

---

## Status
- ✅ Store captures full orders (items, address, totals, shipping) — demo now, Supabase-ready
- ✅ Admin portal (`portal.html`) — pending → confirm payment → mark shipped + tracking, live stats
- ⏳ Flip to live: Supabase project + paste keys + run Phase 1 SQL + add staff login
- ⏳ Phase 2: customer accounts (funnel signup, prefill, My-Orders page)
