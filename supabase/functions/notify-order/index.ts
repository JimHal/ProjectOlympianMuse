// Emails the shop owner when a new order arrives.
//
// Triggered by a Supabase Database Webhook on INSERT into public.orders (see SETUP.md).
// Sends through Resend (https://resend.com). Secrets to set (Edge Functions → Secrets):
//   RESEND_API_KEY   your Resend API key
//   ADMIN_EMAIL      where new-order notices go (comma-separate several addresses)
//   FROM_EMAIL       sender, e.g. "Olympia Muse <orders@yourdomain.gr>"
//                    (until you verify a domain in Resend use "Olympia Muse <onboarding@resend.dev>";
//                     Resend then only delivers to the email address of your Resend account)
//   SITE_URL         optional, e.g. https://jimhal.github.io/ProjectOlympianMuse — adds a link to the admin page
//
// The function re-reads the order from the database and marks it as notified, so a forged
// or repeated call can never send a fake or duplicate email.

import { createClient } from "jsr:@supabase/supabase-js@2";

const env = (k: string) => Deno.env.get(k) ?? "";
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const eur = (n: unknown) => new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" }).format(Number(n) || 0);
const name = (v: any) => (v && typeof v === "object" ? v.el || v.en || "" : v ?? "");

const MEASURE_LABELS: Record<string, string> = {
  height: "Ύψος (cm)", weight: "Βάρος (kg)", bust: "Στήθος (cm)", waist: "Μέση (cm)",
  hips: "Περιφέρεια (cm)", inseam: "Εσωτ. μήκος ποδιού (cm)", usualSize: "Συνήθες μέγεθος", notes: "Σημειώσεις",
};

Deno.serve(async (req) => {
  const body = await req.json().catch(() => ({}));
  const id = body?.record?.id;
  if (body?.type && body.type !== "INSERT") return new Response("ignored");
  if (!id) return new Response("no order id", { status: 400 });

  const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

  // Claim the order: only the first call for an order gets a row back.
  const { data: order, error } = await db.from("orders")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", id).is("notified_at", null)
    .select().maybeSingle();
  if (error) return new Response(error.message, { status: 500 });
  if (!order) return new Response("already notified");

  const c = order.customer ?? {};
  const m = order.measurements ?? {};
  const rows = (order.items ?? []).map((i: any) =>
    `<tr><td>${i.qty} × ${esc(name(i.name))}</td><td>${esc([i.size, i.color].filter(Boolean).join(" / "))}</td><td style="text-align:right">${eur(i.price * i.qty)}</td></tr>`
  ).join("");
  const measures = Object.entries(m).filter(([, v]) => v !== "" && v != null)
    .map(([k, v]) => `<li>${esc(MEASURE_LABELS[k] ?? k)}: ${esc(v)}</li>`).join("");
  const site = env("SITE_URL").replace(/\/$/, "");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#3B2A22;max-width:560px">
      <h2 style="margin:0 0 4px">Νέα παραγγελία ${esc(order.order_number)}</h2>
      <p style="margin:0 0 16px">Σύνολο <b>${eur(order.total)}</b> · Πληρωμή: <b>${order.payment === "iris" ? "IRIS" : "Κατάθεση σε τράπεζα"}</b></p>
      <table style="width:100%;border-collapse:collapse" cellpadding="6">${rows}
        <tr><td colspan="2"><b>Σύνολο</b></td><td style="text-align:right"><b>${eur(order.total)}</b></td></tr></table>
      <h3>Πελάτης</h3>
      <p>${esc(c.name)}<br>${esc(c.phone)} · ${esc(order.email)}<br>${esc(c.street)}, ${esc(c.zip)} ${esc(c.city)}, ${esc(c.country)}
      ${c.notes ? `<br><i>${esc(c.notes)}</i>` : ""}</p>
      ${measures ? `<h3>Μετρήσεις</h3><ul>${measures}</ul>` : ""}
      <p style="margin-top:20px">Όταν δεις την πληρωμή στον λογαριασμό σου, επιβεβαίωσε την παραγγελία στη σελίδα διαχείρισης.
      ${site ? `<br><a href="${esc(site)}/admin.html">Άνοιγμα διαχείρισης →</a>` : ""}</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env("FROM_EMAIL") || "Olympia Muse <onboarding@resend.dev>",
      to: env("ADMIN_EMAIL").split(",").map((s) => s.trim()).filter(Boolean),
      reply_to: order.email || undefined,
      subject: `Νέα παραγγελία ${order.order_number} — ${eur(order.total)}`,
      html,
    }),
  });

  if (!res.ok) {
    // Undo the claim so the webhook retry (or a manual re-run) can send it.
    await db.from("orders").update({ notified_at: null }).eq("id", id);
    return new Response(`email failed: ${await res.text()}`, { status: 502 });
  }
  return new Response("sent");
});
