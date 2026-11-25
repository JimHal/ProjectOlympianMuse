# Olympia Muse — accounts, admin & orders setup

The site stays plain HTML. Accounts, products, favourites, measurements and orders live in
**Supabase** (free plan is enough). New-order emails go out through **Resend** (free plan).

| Page | Who | What |
|---|---|---|
| `OlympiaMuse.html` | everyone | shop; cards, prices and photos come from the database |
| `item.html?p=<code>` | everyone | product page, ♡ favourite button |
| `account.html` | customers | log in / register, favourites, measurements, orders, saved address |
| `pay.html?order=OM-1001` | customers | opens in a new tab after ordering: IRIS / bank details |
| `admin.html` | admins | orders (confirm payment, shipped, cancel) and products (add, edit, photos, hide, delete) |

Until step 3 is done the shop shows the products from `products.js` and works as before (orders are not sent).

---

## 1. Create the Supabase project
1. Sign up at <https://supabase.com> → **New project** (region: *Central EU (Frankfurt)*). Keep the database password somewhere safe.

## 2. Create the database
1. Dashboard → **SQL Editor** → **New query**.
2. Paste the whole of [`supabase/schema.sql`](supabase/schema.sql) → **Run**.

## 3. Connect the site
1. Dashboard → **Project Settings → API**. Copy **Project URL** and the **anon public** key.
2. Paste them into [`js/config.js`](js/config.js) (`supabaseUrl`, `supabaseAnonKey`).
   The anon key is meant to be public; the database rules decide what each visitor may do.
3. In the same file fill in your **IRIS phone** and **IBAN / bank / account holder** when you have them.

## 4. Login emails & addresses
Dashboard → **Authentication → URL Configuration**:
- **Site URL**: the address where the site is published, e.g. `https://jimhal.github.io/ProjectOlympianMuse/OlympiaMuse.html`
- **Redirect URLs**: add `https://jimhal.github.io/ProjectOlympianMuse/account.html*`
  (and `http://127.0.0.1:5500/*` if you test locally with VS Code *Live Server*).

Supabase's built-in email sender only allows a few emails per hour. Before going live, set
**Authentication → Emails → SMTP Settings** to Resend's SMTP (host `smtp.resend.com`, port `465`,
user `resend`, password = your Resend API key) so sign-up and password emails always arrive.

## 5. Make yourself admin
1. Open `account.html` on the site → **Create account** → confirm the email.
2. SQL Editor → run (with your email):
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
3. Open `admin.html` → **Products** → **Import products from products.js**. From now on edit products there.

To remove an admin: `update public.profiles set role = 'client' where email = '...';`

## 6. New-order email to the admin (and so to the admin's phone)
1. Sign up at <https://resend.com> → **API Keys** → create one.
   (Until you verify your own domain in Resend, mail is sent from `onboarding@resend.dev` and can only go to the email you signed up to Resend with — use that as `ADMIN_EMAIL`.)
2. Supabase Dashboard → **Edge Functions** → **Deploy a new function** → *Via Editor* → name it `notify-order`,
   paste [`supabase/functions/notify-order/index.ts`](supabase/functions/notify-order/index.ts) → **Deploy**.
3. **Edge Functions → Secrets** → add:
   - `RESEND_API_KEY` = your Resend key
   - `ADMIN_EMAIL` = where orders should go (several: comma separated)
   - `FROM_EMAIL` = `Olympia Muse <onboarding@resend.dev>` (or your own domain once verified)
   - `SITE_URL` = e.g. `https://jimhal.github.io/ProjectOlympianMuse` (adds an "open admin" link)
4. **Database → Webhooks** → **Create a new hook**:
   name `new-order`, table `orders`, events **Insert**, type **Supabase Edge Functions**, function `notify-order`,
   method POST, and press **Add auth header with service key**. Save.
5. Install the Gmail (or your mail) app on the admin's phone with notifications on — every order then
   pops up on the phone too.

## 7. Publish
GitHub → the repository → **Settings → Pages** → *Deploy from a branch* → `master` / root.
The shop is then at `https://jimhal.github.io/ProjectOlympianMuse/OlympiaMuse.html`.

---

## How an order flows
1. The customer fills the basket. At checkout they must be logged in (the basket waits while they log in or register).
2. **Place order** → the server checks every product, size and colour, calculates the total from the database
   prices (the browser can't change them), and gives an order number like `OM-1001`.
3. A new tab opens with the IRIS or bank details, the amount and the order number to use as the payment reference.
4. The admin gets the email with items, address and the customer's saved measurements.
5. When the money shows in the bank, the admin opens **admin.html → Orders** → **✓ Payment received**.
   The customer sees *Confirmed* under **My account → Orders**. Later: **Shipped**.

## Security notes
- Customers can only read their own profile, favourites and orders, and can't change their role.
- Only admins can change products, upload photos, or see and update all orders.
- Orders can only be created through `place_order()`, which works out prices on the server.
