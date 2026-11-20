# ELEV8TIDE — Our Own Email System (no Mailchimp)

Mailchimp banned us (peptide AUP). So we **own it ourselves**: our list (Supabase), our sender (her domain), our trigger (Supabase function). No platform can evict us again.

---

## The sequence (all branded templates built)
| # | Email | Trigger | Timing | File | Status |
|---|---|---|---|---|---|
| 1 | **Welcome** — VSL → recommended journey → store link + 15% code | Funnel signup | instant | `email1_welcome.html` | ✅ built |
| 2 | **Journey → Store** — reinforce recommendation, store link | after #1 | +1 day | `email2_product_recommendation.html` | ✅ built |
| 3–5 | **Nurture** (hot/warm/cold branches) | behavior | daily-ish | `phase2_email_sms_sequence.md` (copy) | ✅ copy ready |
| T1 | **Order confirmation** | checkout | instant | `order_confirmation_email.html` | ✅ built |
| T2 | **Shipped + tracking** | portal "Mark shipped" | instant | `email_shipped.html` | ✅ built |

> **Transactional (T1/T2) = priority + low-risk.** Marketing (1–5) = keep educational/wellness-framed (we own the compliance).

---

## How we send it ourselves — 3 pieces

**1. The sender → pick one (I recommend Resend to start):**
- **Resend** (resend.com) — easiest: verify domain, get API key, one call. Free 3,000/mo. Modern, clean.
- **Amazon SES** — most tolerant + scalable, ~$0.10/1k. More setup. Best long-term if volume grows.
> Either sends **from `info@elev8tide.com`** (her domain) — the thing that fixes deliverability.

**2. Verify the domain (DNS on IONOS — I can do this via the open IONOS tab):**
- Add the provider's **SPF + DKIM** records to `elev8tide.com` (same job I did for dyriquemendoza.com).
- Add **DMARC** for trust. ~10 min, then the domain is a verified sender.

**3. The trigger → Supabase Edge Function (folds into the Supabase build):**
- `on new lead` → send Email 1 (then schedule 2–5).
- `on new order` → send T1 (order confirmation).
- `on fulfill_status = shipped` → send T2 (tracking).
- The list lives in Supabase (never locked to a vendor again).

---

## To activate (what I need)
1. **Pick the sender** (Resend recommended) → create the free account → API key.
2. Go-ahead to add the **DNS records on IONOS** (I'll drive it, you approve).
3. Supabase project (already the plan) → I wire the send function + schedule the sequence.

**Everything creative is done** — the emails are built and branded. This is now plumbing, and it's all owned by us.
