/* ============================================================
   Language switch (Greek / English), shared by every page.

   Each page defines its texts before loading this file:
     window.I18N = { el: { key: 'Κείμενο' }, en: { key: 'Text' } };

   In the HTML:
     data-i18n="key"            -> sets the element's text
     data-i18n-html="key"       -> sets the element's HTML (for <br>, <span> etc.)
     data-i18n-attr="attr:key"  -> sets an attribute, e.g. "aria-label:menuLabel; placeholder:notesHint"
     <button data-set-lang="el">ΕΛ</button>  -> switches language

   Pages that build text in JavaScript use OM.t('key') and re-render on the 'langchange' event.
   Greek is the default; the visitor's choice is remembered across pages.
   Adding ?lang=en or ?lang=el to a link opens the page in that language.
   ============================================================ */
(function () {
  const KEY = 'om-lang';
  let lang = 'el';
  try { if (localStorage.getItem(KEY) === 'en') lang = 'en'; } catch (e) {}
  // A link can choose the language too, e.g. leggings.html?lang=en
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (fromUrl === 'el' || fromUrl === 'en') {
    lang = fromUrl;
    try { localStorage.setItem(KEY, lang); } catch (e) {}
  }

  function t(key) {
    const dict = window.I18N || {};
    const value = dict[lang] && dict[lang][key];
    if (value !== undefined) return value;
    return dict.el && dict.el[key] !== undefined ? dict.el[key] : key;
  }

  function apply() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      el.dataset.i18nAttr.split(';').forEach(pair => {
        const [attr, key] = pair.split(':').map(s => s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
    document.querySelectorAll('[data-set-lang]').forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.dataset.setLang === lang));
    });
    const title = t('pageTitle');
    if (title !== 'pageTitle') document.title = title;
  }

  function setLang(next) {
    if (next !== 'el' && next !== 'en') return;
    lang = next;
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    apply();
    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }

  // Pick the right name for a basket item / product: { el: '...', en: '...' } or a plain string
  function pick(value) {
    if (value && typeof value === 'object') return value[lang] || value.el || '';
    return value;
  }

  window.OM = { t, setLang, apply, pick, get lang() { return lang; } };

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-set-lang]');
    if (btn) setLang(btn.dataset.setLang);
  });

  apply();
})();
