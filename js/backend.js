/* ============================================================
   Connection to Supabase (accounts, products, favourites, orders), shared by every page.

   Load order on a page:
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/dist/umd/supabase.min.js"></script>
     <script src="js/config.js"></script>
     <script src="products.js"></script>      (fallback products while the database is empty / not set up)
     page texts (window.I18N) + i18n.js
     <script src="js/backend.js"></script>
     page script (uses window.OMDB)

   Header link: <a data-account-link href="account.html"><span data-account-label></span></a>
   shows "Log in" or "My account" automatically.
   ============================================================ */
(function () {
  const cfg = window.OM_CONFIG || {};
  const enabled = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  const sb = enabled ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  /* ---- texts used by this file (pages can override any of them) ---- */
  const TEXTS = {
    el: {
      accLogin: 'Σύνδεση',
      accMine: 'Ο λογαριασμός μου',
      favAdd: 'Προσθήκη στα αγαπημένα',
      favRemove: 'Αφαίρεση από τα αγαπημένα',
      errLoginRequired: 'Συνδέσου για να συνεχίσεις.',
      errUnavailable: 'Κάποιο προϊόν του καλαθιού δεν είναι πλέον διαθέσιμο. Αφαίρεσέ το και δοκίμασε ξανά.',
      errBadSize: 'Το μέγεθος ή το χρώμα κάποιου προϊόντος δεν είναι πλέον διαθέσιμο.',
      errEmpty: 'Το καλάθι σου είναι άδειο.',
      errGeneric: 'Κάτι πήγε στραβά. Δοκίμασε ξανά σε λίγο.',
      errNotConnected: 'Το κατάστημα δεν έχει συνδεθεί ακόμη με τη βάση δεδομένων (js/config.js).'
    },
    en: {
      accLogin: 'Log in',
      accMine: 'My account',
      favAdd: 'Add to favourites',
      favRemove: 'Remove from favourites',
      errLoginRequired: 'Please log in to continue.',
      errUnavailable: 'An item in your basket is no longer available. Remove it and try again.',
      errBadSize: 'The size or colour of an item is no longer available.',
      errEmpty: 'Your basket is empty.',
      errGeneric: 'Something went wrong. Please try again shortly.',
      errNotConnected: 'The shop is not connected to its database yet (js/config.js).'
    }
  };
  window.I18N = window.I18N || { el: {}, en: {} };
  ['el', 'en'].forEach(l => { window.I18N[l] = Object.assign({}, TEXTS[l], window.I18N[l] || {}); });

  const t = key => (window.OM ? OM.t(key) : key);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => new Intl.NumberFormat(window.OM && OM.lang === 'en' ? 'en-IE' : 'el-GR', { style: 'currency', currency: 'EUR' }).format(Number(n) || 0);

  /* ---- account ---- */
  async function user() {
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session ? data.session.user : null;
  }

  let profilePromise = null;
  function profile(force) {
    if (!sb) return Promise.resolve(null);
    if (!profilePromise || force) {
      profilePromise = (async () => {
        const u = await user();
        if (!u) return null;
        const { data, error } = await sb.from('profiles').select('*').eq('id', u.id).maybeSingle();
        if (error) throw error;
        return data;
      })();
      profilePromise.catch(() => { profilePromise = null; });
    }
    return profilePromise;
  }

  async function updateHeader() {
    const links = document.querySelectorAll('[data-account-link]');
    if (!links.length) return;
    let key = 'accLogin';
    try { if (await user()) key = 'accMine'; } catch (e) {}
    links.forEach(a => {
      a.hidden = !enabled;
      const label = a.querySelector('[data-account-label]') || a;
      label.dataset.i18n = key;
      label.textContent = t(key);
      a.setAttribute('aria-label', t(key));
    });
  }

  if (sb) {
    sb.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        profilePromise = null;
        // Supabase recommends not calling it again inside this callback, so wait a tick.
        setTimeout(updateHeader, 0);
      }
    });
  }

  // Link to the login page that comes back to the current page afterwards
  function loginUrl(next) {
    const here = next || (location.pathname.split('/').pop() || 'OlympiaMuse.html') + location.search + location.hash;
    return 'account.html?next=' + encodeURIComponent(here);
  }

  /* ---- products ---- */
  function normalise(id, p) {
    return Object.assign(
      { name: { el: id, en: id }, sizes: [], colors: [], panels: [] },
      p,
      { id, price: p.price == null || p.price === '' ? null : Number(p.price) }
    );
  }
  function localProducts() {
    const out = {};
    Object.entries(window.PRODUCTS || {}).forEach(([id, p], i) => { out[id] = normalise(id, Object.assign({ active: true, sort: i * 10 }, p)); });
    return out;
  }

  let productsPromise = null;
  // Resolves to { id: product }. Uses the database; falls back to products.js while the database is empty or not set up.
  function products(force) {
    if (!productsPromise || force) {
      productsPromise = (async () => {
        if (!sb) return localProducts();
        try {
          const { data, error } = await sb.from('products').select('*').order('sort').order('id');
          if (error) throw error;
          if (!data.length) return localProducts();
          const out = {};
          data.forEach(r => { out[r.id] = normalise(r.id, Object.assign({}, r.data, { price: r.price, active: r.active, sort: r.sort })); });
          return out;
        } catch (e) {
          console.warn('Could not load products from the database, using products.js instead.', e);
          return localProducts();
        }
      })();
    }
    return productsPromise;
  }

  /* ---- favourites ---- */
  async function favorites() {
    const u = await user();
    if (!u) return [];
    const { data, error } = await sb.from('favorites').select('product_id').eq('user_id', u.id);
    if (error) throw error;
    return data.map(r => r.product_id);
  }
  async function setFavorite(productId, on) {
    const u = await user();
    if (!u) throw new Error('login_required');
    const { error } = on
      ? await sb.from('favorites').upsert({ user_id: u.id, product_id: productId })
      : await sb.from('favorites').delete().eq('user_id', u.id).eq('product_id', productId);
    if (error) throw error;
  }

  /* ---- orders ---- */
  // items: [{ id, size, color, qty }]. The server works out prices and the total itself.
  async function placeOrder(items, customer, payment) {
    if (!sb) throw new Error('not_connected');
    const { data, error } = await sb.rpc('place_order', { p_items: items, p_customer: customer, p_payment: payment });
    if (error) throw error;
    return data; // { order_number, total }
  }

  function errorText(err) {
    const msg = String((err && (err.message || err.error_description)) || err || '');
    if (/login_required|JWT/i.test(msg)) return t('errLoginRequired');
    if (/unavailable/.test(msg)) return t('errUnavailable');
    if (/bad_size|bad_color/.test(msg)) return t('errBadSize');
    if (/empty_basket/.test(msg)) return t('errEmpty');
    if (/not_connected/.test(msg)) return t('errNotConnected');
    return t('errGeneric');
  }

  /* ---- product photos (admin) ---- */
  // Shrinks big phone photos before upload (longest side 1800px) to keep pages fast.
  function shrink(file, max = 1800) {
    return new Promise(resolve => {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return resolve(file);
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        if (scale === 1 && file.size < 1.5e6) return resolve(file);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(b => resolve(b || file), 'image/jpeg', 0.86);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }
  async function uploadImage(file, productId) {
    const blob = await shrink(file);
    const ext = blob.type === 'image/jpeg' ? 'jpg' : (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `products/${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await sb.storage.from('product-images').upload(path, blob, { cacheControl: '31536000', contentType: blob.type || file.type });
    if (error) throw error;
    return sb.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  }

  window.OMDB = {
    enabled, sb, user, profile, products, favorites, setFavorite, placeOrder,
    errorText, loginUrl, uploadImage, updateHeader, money, esc
  };

  if (window.OM) OM.apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', updateHeader);
  else updateHeader();
})();
