// ELEV8TIDE — transactional + lifecycle email sender (owned, via IONOS SMTP from hello@elev8tide.com)
// Called directly { type, to, data } OR by a Supabase DB webhook { type, record }.
// FUNNEL: Email 1 (welcome) = VSL. Email 2 (nurture_1) = goal-matched product + 15% off.
// Style = Fashion-Nova energy (bold, image-led, notification-grade subjects) in ELEV8TIDE's premium look.
// COMPLIANCE: research-use framing only. No efficacy / dosing / medical / human-use claims.
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const USER = "hello@elev8tide.com";
const RAWPASS = Deno.env.get("IONOS_SMTP_PASSWORD") ?? "";
const PASS = RAWPASS.trim();
const SITE = "https://www.elev8tide.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-email-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const C = { teal: "#0F6B73", ink: "#0B1E22", panel: "#16282c", gold: "#C8A06A", gold2: "#E4C98F", cream: "#F4EFE6", mut: "#8aa0a0" };
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "'Jost', 'Helvetica Neue', Arial, sans-serif";

// goal -> recommended research stack (matches the lab.html catalog)
const GOALMAP: Record<string, {focus:string; stack:string; blurb:string; p:number; reg:number; img:string}> = {
  weight:   { focus:"Weight & Metabolic",  stack:"Weight & Metabolic Stack",   blurb:"Tirzepatide · Tesamorelin · Bac Water",         p:269, reg:315, img:"img/v-weight.jpg" },
  energy:   { focus:"Energy & Performance",stack:"Energy & Performance Stack", blurb:"MOTS-C · NAD+ · Semax",                          p:275, reg:325, img:"img/v-energy.jpg" },
  beauty:   { focus:"Beauty & Anti-Aging", stack:"Beauty & Anti-Aging Stack",  blurb:"GHK-Cu · Glutathione · Bac Water",              p:289, reg:345, img:"img/v-beauty.jpg" },
  recovery: { focus:"Recovery & Healing",  stack:"Recovery & Healing Stack",   blurb:"BPC-157 · NAD+ · Bac Water",                    p:225, reg:265, img:"img/v-recovery.jpg" },
  wellness: { focus:"The Complete Stack",  stack:"The Complete Elev8 Stack",   blurb:"Tirz · NAD+ · GHK-Cu · Glutathione · Bac Water",p:549, reg:695, img:"img/v-complete.jpg" },
};
function pickGoal(raw: unknown) {
  const g = String(raw || "").toLowerCase();
  for (const k of ["weight","energy","beauty","recovery","wellness"]) if (g.includes(k)) return GOALMAP[k];
  return GOALMAP.wellness; // default: the flagship
}

function shell(preheader: string, bodyHtml: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Jost:wght@300;400;500&display=swap');</style></head>
  <body style="margin:0;background:${C.cream};font-family:${SANS};color:#1f2a2a">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>
  <div style="max-width:600px;margin:0 auto">
    <div style="background:${C.ink};padding:26px;text-align:center">
      <div style="font-family:${SERIF};font-size:27px;letter-spacing:7px;color:${C.cream}">ELEV8<span style="color:${C.gold}">TIDE</span></div>
      <div style="font-size:9px;letter-spacing:3px;color:${C.gold};text-transform:uppercase;margin-top:7px">Elevate Wellness · Restore Confidence</div>
    </div>
    ${bodyHtml}
    <div style="text-align:center;font-size:11px;color:${C.mut};line-height:1.7;padding:24px 30px">
      Elev8Tide Wellness LLC · <a href="mailto:hello@elev8tide.com" style="color:${C.gold}">hello@elev8tide.com</a><br>
      For laboratory &amp; research purposes only · Not for human or animal consumption · 21+ · Statements not evaluated by the FDA.<br>
      <a href="*|UNSUB|*" style="color:${C.mut}">Unsubscribe</a>
    </div>
  </div></body></html>`;
}
const btn = (label: string, href: string) =>
  `<a href="${href}" style="background:${C.teal};color:#fff;text-decoration:none;padding:15px 34px;border-radius:4px;font-size:14px;letter-spacing:1.5px;text-transform:uppercase;display:inline-block;font-weight:500">${label}</a>`;
const codeBox = () =>
  `<div style="background:${C.cream};border:1px dashed ${C.gold};border-radius:10px;padding:16px;margin:18px 0;text-align:center">
     <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.mut}">15% off your first order</div>
     <div style="font-size:24px;font-weight:bold;color:${C.teal};letter-spacing:3px;margin-top:5px">ELEV8TIDE15</div></div>`;

function build(type: string, d: Record<string, unknown>) {
  const name = (d.name as string) || "there";
  const order = (d.order_no as string) || "";
  const total = (d.total as number) ?? "";
  const tracking = (d.tracking as string) || "";

  // ── EMAIL 1 · WELCOME = the VSL ──
  if (type === "welcome") {
    return {
      subject: `🎬 ${name}, step inside the Lab (+ your 15% is in here)`,
      html: shell(`90 seconds inside ELEV8TIDE — plus 15% off your first order.`, `
        <div style="background:#fff;padding:32px 30px 10px;text-align:center">
          <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.gold}">Welcome, ${name}</div>
          <h1 style="font-family:${SERIF};font-weight:500;font-size:30px;color:${C.teal};margin:10px 0 4px">See what we built.</h1>
          <p style="font-size:15px;line-height:1.6;color:#3a4a4b;margin:0 0 20px">A private research supply built on one thing — <b>trust you can verify.</b> Take 90 seconds inside the Lab.</p>
        </div>
        <a href="${SITE}/watch.html" style="display:block;text-decoration:none">
          <div style="background:${C.ink};background-image:linear-gradient(135deg,#0B1E22,#16383c);padding:54px 20px;text-align:center;border-top:1px solid ${C.gold}">
            <div style="width:74px;height:74px;line-height:74px;margin:0 auto 14px;border-radius:50%;background:${C.gold};color:${C.ink};font-size:30px">&#9654;</div>
            <div style="font-family:${SERIF};font-size:22px;color:${C.cream};letter-spacing:1px">Watch: Inside the Lab</div>
            <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.gold2};margin-top:6px">▶ Play · 90 sec</div>
          </div>
        </a>
        <div style="background:#fff;padding:24px 30px 30px;text-align:center">
          ${codeBox()}
          <p style="margin:6px 0 20px">${btn("Enter the Lab →", SITE + "/lab.html")}</p>
          <p style="font-size:12px;color:${C.mut};margin:0">Tomorrow: your personalized research match, based on your goals.</p>
        </div>`),
    };
  }

  // ── EMAIL 2 · goal-matched product + 15% off (fires day 1) ──
  if (type === "nurture_1") {
    const g = pickGoal(d.goal);
    return {
      subject: `${name}, we found your match 👀 (15% still on)`,
      html: shell(`Your ${g.focus} pick is ready — and your 15% welcome gift is still active.`, `
        <div style="background:#fff;padding:30px 30px 6px;text-align:center">
          <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.gold}">Your focus · ${g.focus}</div>
          <h1 style="font-family:${SERIF};font-weight:500;font-size:28px;color:${C.teal};margin:10px 0 4px">Picked for your goals, ${name}.</h1>
          <p style="font-size:14px;line-height:1.6;color:#3a4a4b;margin:0 0 6px">Based on what you told us, here's where people with your focus tend to begin.</p>
        </div>
        <div style="padding:14px 24px 6px">
          <a href="${SITE}/lab.html" style="text-decoration:none;color:inherit;display:block">
            <img src="${SITE}/${g.img}" alt="${g.stack}" width="552" style="width:100%;max-width:552px;border-radius:14px;display:block;margin:0 auto"></a>
        </div>
        <div style="background:#fff;padding:6px 30px 28px;text-align:center">
          <div style="font-family:${SERIF};font-size:23px;color:#1b2a2b;margin-top:10px">${g.stack}</div>
          <div style="font-size:12px;color:${C.mut};margin:4px 0 10px">${g.blurb} · research-grade · lab tested</div>
          <div style="font-size:15px;margin-bottom:4px"><span style="color:${C.mut};text-decoration:line-through">$${g.reg}</span>
            <span style="color:${C.teal};font-weight:bold;font-size:20px;margin-left:6px">$${g.p}</span></div>
          <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${C.gold}">+ extra 15% with code ELEV8TIDE15</div>
          ${codeBox()}
          <p style="margin:4px 0 0">${btn("Shop your match →", SITE + "/lab.html")}</p>
          <p style="font-size:11px;color:${C.mut};margin:16px 0 0">For laboratory &amp; research purposes only. Nothing here is medical advice or a product recommendation for personal use.</p>
        </div>`),
    };
  }

  // ── nurture 2 / 3 (educational, soft) ──
  if (type === "nurture_2") {
    return { subject: `${name}, quality you can actually verify 🔬`,
      html: shell("Every batch third-party tested, with a COA you can see.", `
        <div style="background:#fff;padding:32px 30px"><h1 style="font-family:${SERIF};font-weight:500;font-size:26px;color:${C.teal};margin:0 0 14px">The ELEV8TIDE standard.</h1>
        <p style="font-size:15px;line-height:1.65;color:#3a4a4b">What sets us apart is simple: every research compound is third-party tested, with a Certificate of Analysis you can see. Purity and identity — documented, not promised.</p>
        <p style="text-align:center;margin:26px 0 4px">${btn("Step into the Lab →", SITE + "/lab.html")}</p></div>`) };
  }
  if (type === "nurture_3") {
    return { subject: `${name}, your 15% is still waiting ⏳`,
      html: shell("Last reminder — your welcome gift is still here.", `
        <div style="background:#fff;padding:32px 30px;text-align:center"><h1 style="font-family:${SERIF};font-weight:500;font-size:26px;color:${C.teal};margin:0 0 10px">Whenever you're ready, ${name}.</h1>
        <p style="font-size:15px;line-height:1.6;color:#3a4a4b;margin:0">No rush — just a reminder your welcome gift is still here.</p>
        ${codeBox()}
        <p style="margin:2px 0 0">${btn("Explore ELEV8TIDE →", SITE + "/lab.html")}</p></div>`) };
  }

  // ── payment recovery (pending P2P orders) ──
  if (type === "recovery_1") {
    return { subject: `Did your payment go through? Order ${order}`,
      html: shell(`We're still holding order ${order} for you.`, `
        <div style="background:#fff;padding:32px 30px"><h1 style="font-family:${SERIF};font-weight:500;font-size:25px;color:${C.teal};margin:0 0 14px">Still holding your order.</h1>
        <p style="font-size:15px;line-height:1.6;color:#3a4a4b">Hi ${name}, we haven't matched a payment to order <b>${order}</b> yet. If you've already sent it, make sure your <b>order number is in the payment note</b> so we can match it.</p>
        <p style="font-size:15px;line-height:1.6;color:#3a4a4b">Haven't sent it? It only takes a sec — Cash App, Venmo, Zelle, or Apple Pay, with ${order} in the note. Your 15% is still applied.</p>
        <p style="text-align:center;margin:24px 0 0">${btn("Complete your order →", SITE + "/lab.html")}</p></div>`) };
  }
  if (type === "recovery_2") {
    return { subject: `Last call on order ${order}`,
      html: shell(`We'll release order ${order} soon if we don't hear back.`, `
        <div style="background:#fff;padding:32px 30px"><h1 style="font-family:${SERIF};font-weight:500;font-size:25px;color:${C.teal};margin:0 0 14px">One more note.</h1>
        <p style="font-size:15px;line-height:1.6;color:#3a4a4b">Hi ${name}, we're still holding order <b>${order}</b> — but we'll release it soon if we don't hear back. Send your payment with <b>${order}</b> in the note and you're done.</p></div>`) };
  }

  // ── shipped ──
  if (type === "shipped") {
    return { subject: `📦 Your ELEV8TIDE order ${order} shipped`,
      html: shell(`Tracking inside — your order is on the way.`, `
        <div style="background:#fff;padding:32px 30px"><h1 style="font-family:${SERIF};font-weight:500;font-size:26px;color:${C.teal};margin:0 0 14px">It's on the way.</h1>
        <p style="font-size:15px;line-height:1.6;color:#3a4a4b">Hi ${name}, your order <b>${order}</b> just shipped — discreet and tracked.</p>
        <div style="background:${C.cream};border:1px solid ${C.gold};border-radius:10px;padding:16px 20px;margin:18px 0">
          <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${C.gold}">Tracking</div>
          <div style="font-size:18px;font-weight:bold;color:${C.teal};margin-top:4px">${tracking}</div></div>
        <p style="font-size:13px;color:${C.mut}">Thank you for choosing ELEV8TIDE.</p></div>`) };
  }

  // ── default: order confirmation ──
  return { subject: `Order ${order} received — thank you, ${name}`,
    html: shell(`We've got your order and we're verifying your payment.`, `
      <div style="background:#fff;padding:32px 30px"><h1 style="font-family:${SERIF};font-weight:500;font-size:26px;color:${C.teal};margin:0 0 14px">Order received.</h1>
      <p style="font-size:15px;line-height:1.6;color:#3a4a4b">Hi ${name}, we've got your order and we're verifying your payment. You'll get a shipping note with tracking once it's on the way.</p>
      <div style="background:${C.cream};border:1px solid ${C.gold};border-radius:10px;padding:16px 20px;margin:18px 0">
        <table style="width:100%;font-size:14px"><tr><td style="color:${C.mut}">Order</td><td style="text-align:right;font-weight:bold;color:${C.teal}">${order}</td></tr>
        <tr><td style="color:${C.mut};padding-top:6px">Total</td><td style="text-align:right;font-weight:bold;color:${C.teal};padding-top:6px">$${total}</td></tr></table></div>
      <p style="font-size:13px;color:${C.mut}">Keep your payment screenshot — it's your proof. Questions? Just reply to this email.</p></div>`) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json();
    const type: string = req.headers.get("x-email-type") || body.type || "order_confirmation";
    const rec = body.record ?? body.data ?? body;
    const to: string = body.to ?? rec.email;
    if (!to) throw new Error("no recipient email");
    if (type === "shipped") {
      const old = body.old_record;
      if (rec.fulfill_status !== "shipped" || (old && old.fulfill_status === "shipped")) {
        return new Response(JSON.stringify({ ok: true, skipped: "not a new shipment" }), { headers: { ...cors, "Content-Type": "application/json" } });
      }
    }
    const { subject, html } = build(type, rec);
    const client = new SMTPClient({ connection: { hostname: "smtp.ionos.com", port: 465, tls: true, auth: { username: USER, password: PASS } } });
    await client.send({ from: `Elev8Tide <${USER}>`, to, subject, html, content: subject });
    await client.close();
    return new Response(JSON.stringify({ ok: true, to, type, subject }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
