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
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {}
    document.querySelectorAll('.theme-toggle-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', mode === 'light' ? 'true' : 'false');
    });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('.theme-toggle-btn');
    if (t) {
      applyTheme(currentTheme() === 'light' ? 'dark' : 'light');
    }
  });
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: light)');
    var onChange = function (ev) {
      var stored = null;
      try {
        stored = localStorage.getItem(STORAGE_KEY);
      } catch (e) {}
      if (!stored) {
        doc.setAttribute('data-theme', ev.matches ? 'light' : 'dark');
      }
    };
    if (mq.addEventListener) {
      mq.addEventListener('change', onChange);
    }
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
  var resultsList = modal ? modal.querySelector('.search-results-list') : null;
  var recentMarkup = resultsList ? resultsList.innerHTML : '';
  var searchIndex = null;
  var searchIndexPromise = null;

  /* /search-index.json (inc/search-index.php) gives instant results; Enter still submits ?s= */
  function loadSearchIndex() {
    if (!searchIndexPromise) {
      searchIndexPromise = fetch('/search-index.json', { credentials: 'omit' })
        .then(function (r) {
          return r.ok ? r.json() : [];
        })
        .then(function (data) {
          searchIndex = Array.isArray(data) ? data : [];
          return searchIndex;
        })
        .catch(function () {
          searchIndex = [];
          return searchIndex;
        });
    }
    return searchIndexPromise;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function renderResults(query) {
    if (!resultsList) return;
    var q = query.trim().toLowerCase();
    if (!q) {
      resultsList.innerHTML = recentMarkup;
      return;
    }
    var hits = (searchIndex || [])
      .filter(function (p) {
        return (
          (p.title + ' ' + p.excerpt + ' ' + p.category)
            .toLowerCase()
            .indexOf(q) !== -1
        );
      })
      .slice(0, 12);
    if (!hits.length) {
      resultsList.innerHTML =
        '<div class="search-hint">No matches &mdash; press Enter to search the whole site</div>';
      return;
    }
    resultsList.innerHTML =
      '<div class="search-hint">Results</div>' +
      hits
        .map(function (p) {
          var href = p.url || '/posts/' + encodeURIComponent(p.slug);
          return (
            '<a href="' +
            escapeHtml(href) +
            '" class="search-result-item">' +
            '<div class="search-result-title">' +
            escapeHtml(p.title) +
            '</div>' +
            '<div class="search-result-snippet">' +
            escapeHtml(p.date) +
            ' &middot; ' +
            escapeHtml(p.category) +
            '</div>' +
            '</a>'
          );
        })
        .join('');
  }
  function openModal() {
    if (!modal) return;
    modal.classList.add('is-open');
    loadSearchIndex();
    var i = modal.querySelector('.search-modal-input');
    if (i) {
      i.focus();
    }
  }
  function closeModal() {
    if (modal) {
      modal.classList.remove('is-open');
    }
  }
  if (modal) {
    var searchInput = modal.querySelector('.search-modal-input');
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        var value = e.target.value;
        loadSearchIndex().then(function () {
          renderResults(value);
        });
      });
    }
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('.search-trigger-btn')) {
      e.preventDefault();
      openModal();
    } else if (e.target.closest('.search-close-btn')) {
      closeModal();
      closeDrawer();
    } else if (modal && e.target === modal) {
      closeModal();
    }
  });
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openModal();
    }
    if (e.key === 'Escape') {
      closeModal();
      closeDrawer();
    }
  });

  /* ---- Mobile drawer ---- */
  var drawer = document.querySelector('.mobile-drawer-backdrop');
  function closeDrawer() {
    if (drawer) {
      drawer.classList.remove('is-open');
    }
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('.mobile-menu-btn')) {
      e.preventDefault();
      if (drawer) {
        drawer.classList.add('is-open');
      }
    } else if (drawer && e.target === drawer) {
      closeDrawer();
    }
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
      setTimeout(function () {
        btn.textContent = prev;
      }, 1600);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(done);
    } else {
      var ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        done();
      } catch (err) {}
      document.body.removeChild(ta);
    }
  });

  /* ---- Back to top ---- */
  var top = document.querySelector('.back-to-top');
  if (top) {
    window.addEventListener(
      'scroll',
      function () {
        top.classList.toggle('is-visible', window.scrollY > 600);
      },
      { passive: true }
    );
    top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---- Mark reserved slots that a plugin actually filled ---- */
  document.querySelectorAll('.reserved-unit').forEach(function (slot) {
    if (slot.children.length || (slot.textContent || '').trim().length > 40) {
      slot.classList.add('is-filled');
    }
  });

  /* ---- WebMCP: expose browser tools to AI agents (idle-loaded) ----
     Tool names and schemas match /.well-known/mcp/server-card.json and the
     search-articles agent skill; both read /search-index.json. */
  function searchIndex() {
    return fetch('/search-index.json', { credentials: 'omit' }).then(
      function (r) {
        if (!r.ok) {
          throw new Error('search-index.json ' + r.status);
        }
        return r.json();
      }
    );
  }
  function registerWebMcp() {
    var tools = [
      {
        name: 'search_articles',
        description:
          'Search across 413+ historical tech tutorials, guides, and humor articles on ComputerJy World',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search term or keywords' },
          },
          required: ['query'],
        },
        execute: function (params) {
          var q = String((params && params.query) || '').toLowerCase();
          return searchIndex()
            .then(function (data) {
              var results = data
                .filter(function (p) {
                  return (
                    (p.title && p.title.toLowerCase().indexOf(q) !== -1) ||
                    (p.excerpt && p.excerpt.toLowerCase().indexOf(q) !== -1)
                  );
                })
                .slice(0, 5);
              return { success: true, results: results };
            })
            .catch(function (e) {
              return { success: false, error: e.message };
            });
        },
      },
      {
        name: 'get_latest_articles',
        description:
          'Fetch the most recent tech and entertainment articles from ComputerJy World',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of articles to fetch (max 10)',
            },
          },
        },
        execute: function (params) {
          var limit = Math.min((params && params.limit) || 5, 10);
          return searchIndex()
            .then(function (data) {
              return { success: true, articles: data.slice(0, limit) };
            })
            .catch(function (e) {
              return { success: false, error: e.message };
            });
        },
      },
    ];
    [navigator.modelContext, window.modelContext].forEach(function (ctx) {
      if (!ctx) {
        return;
      }
      if (typeof ctx.registerTool === 'function') {
        tools.forEach(function (tool) {
          try {
            ctx.registerTool(tool);
          } catch (e) {}
        });
      } else if (typeof ctx.provideContext === 'function') {
        try {
          ctx.provideContext({ tools: tools });
        } catch (e) {}
      }
    });
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(registerWebMcp, { timeout: 2500 });
  } else {
    window.addEventListener('load', function () {
      setTimeout(registerWebMcp, 1000);
    });
  }
})();
