/**
 * ComputerJy 2.0 - front-end behaviour.
 * No dependencies. Progressive: every feature no-ops if its markup is absent.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'computerjy_theme_pref';
  var doc = document.documentElement;

  /* ---- Theme toggle (default follows system, choice persists) ---- */
  function currentTheme() {
    return doc.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }
  function applyTheme(mode) {
    doc.setAttribute('data-theme', mode);
    try { localStorage.setItem(STORAGE_KEY, mode); } catch (e) {}
    document.querySelectorAll('.theme-toggle-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', mode === 'light' ? 'true' : 'false');
    });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('.theme-toggle-btn');
    if (t) { applyTheme(currentTheme() === 'light' ? 'dark' : 'light'); }
  });
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: light)');
    var onChange = function (ev) {
      var stored = null;
      try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
      if (!stored) { doc.setAttribute('data-theme', ev.matches ? 'light' : 'dark'); }
    };
    if (mq.addEventListener) { mq.addEventListener('change', onChange); }
  }

  /* ---- Reading progress ---- */
  var bar = document.getElementById('readingProgressBar');
  if (bar) {
    var article = document.querySelector('.single-main') || document.body;
    var tick = function () {
      var rect = article.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var done = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      bar.style.width = (done * 100).toFixed(2) + '%';
    };
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    tick();
  }

  /* ---- Search modal (Cmd/Ctrl+K) ---- */
  var modal = document.querySelector('.search-modal-backdrop');
  function openModal() {
    if (!modal) return;
    modal.classList.add('is-open');
    var i = modal.querySelector('.search-modal-input');
    if (i) { i.focus(); }
  }
  function closeModal() { if (modal) { modal.classList.remove('is-open'); } }
  document.addEventListener('click', function (e) {
    if (e.target.closest('.search-trigger-btn')) { e.preventDefault(); openModal(); }
    else if (e.target.closest('.search-close-btn')) { closeModal(); closeDrawer(); }
    else if (modal && e.target === modal) { closeModal(); }
  });
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openModal(); }
    if (e.key === 'Escape') { closeModal(); closeDrawer(); }
  });

  /* ---- Mobile drawer ---- */
  var drawer = document.querySelector('.mobile-drawer-backdrop');
  function closeDrawer() { if (drawer) { drawer.classList.remove('is-open'); } }
  document.addEventListener('click', function (e) {
    if (e.target.closest('.mobile-menu-btn')) { e.preventDefault(); if (drawer) { drawer.classList.add('is-open'); } }
    else if (drawer && e.target === drawer) { closeDrawer(); }
  });

  /* ---- Copy link ---- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy-link]');
    if (!btn) return;
    e.preventDefault();
    var url = btn.getAttribute('data-copy-link') || window.location.href;
    var done = function () {
      var prev = btn.textContent;
      btn.textContent = 'COPIED';
      setTimeout(function () { btn.textContent = prev; }, 1600);
    };
    if (navigator.clipboard) { navigator.clipboard.writeText(url).then(done); }
    else {
      var ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (err) {}
      document.body.removeChild(ta);
    }
  });

  /* ---- Back to top ---- */
  var top = document.querySelector('.back-to-top');
  if (top) {
    window.addEventListener('scroll', function () {
      top.classList.toggle('is-visible', window.scrollY > 600);
    }, { passive: true });
    top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* ---- Mark reserved slots that a plugin actually filled ---- */
  document.querySelectorAll('.reserved-unit').forEach(function (slot) {
    if (slot.children.length || (slot.textContent || '').trim().length > 40) {
      slot.classList.add('is-filled');
    }
  });
})();
