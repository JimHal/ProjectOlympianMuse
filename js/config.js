/* ============================================================
   SITE SETTINGS — the only file you need to edit to connect the shop.

   1. Supabase project (Project Settings → API in the Supabase dashboard):
        supabaseUrl      -> "Project URL", e.g. 'https://abcdxyz.supabase.co'
        supabaseAnonKey  -> the "anon public" key (safe to publish; the database rules protect the data)
      While these are empty the site still works with the products in products.js,
      but logins, favourites and real orders are switched off.

   2. Payment details shown to customers after they place an order.
   ============================================================ */
window.OM_CONFIG = {
  supabaseUrl: 'https://kmsrvpskmbavljhvcowg.supabase.co',
  supabaseAnonKey: 'sb_publishable_9Fs7GQm9xz7XNiPbOR_qSg_G0f-nn6J',

  payment: {
    iris: {
      recipient: 'ADD YOUR IRIS PHONE NUMBER'            // the mobile number (or VAT no.) your IRIS is linked to
    },
    bank: {
      beneficiary: 'ADD ACCOUNT HOLDER NAME',
      bankName:    'ADD BANK NAME',
      iban:        'GR00 0000 0000 0000 0000 0000 000'   // replace with your IBAN
    }
  }
};
