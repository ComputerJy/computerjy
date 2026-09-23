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
          if (!r.ok) {
            throw new Error('HTTP ' + r.status);
          }
          return r.json();
        })
        .then(function (data) {
          searchIndex = Array.isArray(data) ? data : [];
          return searchIndex;
        })
        .catch(function (err) {
          /* Enter still submits ?s=; this only makes a broken endpoint visible */
          if (window.console && console.warn) {
            console.warn(
              'search-index.json unavailable, falling back to ?s=',
              err
            );
          }
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
  /* Focus management shared by the modal and the drawer: remember what was
     focused before opening, keep Tab inside the overlay, and give focus back
     on close (WCAG 2.4.3 / 2.1.2). */
  var FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
  var lastFocus = null;
  function rememberFocus() {
    lastFocus = document.activeElement;
  }
  function restoreFocus() {
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
    lastFocus = null;
  }
  function trapTab(container, e) {
    var items = container.querySelectorAll(FOCUSABLE);
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    } else if (!container.contains(document.activeElement)) {
      e.preventDefault();
      first.focus();
    }
  }

  function openModal() {
    if (!modal || modal.classList.contains('is-open')) return;
    rememberFocus();
    modal.classList.add('is-open');
    loadSearchIndex();
    var i = modal.querySelector('.search-modal-input');
    if (i) {
      i.focus();
    }
  }
  function closeModal() {
    if (modal && modal.classList.contains('is-open')) {
      modal.classList.remove('is-open');
      restoreFocus();
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
    if (e.key === 'Tab') {
      if (modal && modal.classList.contains('is-open')) {
        trapTab(modal, e);
      } else if (drawer && drawer.classList.contains('is-open')) {
        trapTab(drawer, e);
      }
    }
  });

  /* ---- Mobile drawer ---- */
  var drawer = document.querySelector('.mobile-drawer-backdrop');
  var menuBtn = document.querySelector('.mobile-menu-btn');
  function openDrawer() {
    if (!drawer || drawer.classList.contains('is-open')) return;
    rememberFocus();
    drawer.classList.add('is-open');
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', 'true');
    }
    var first =
      drawer.querySelector('.search-close-btn') ||
      drawer.querySelector(FOCUSABLE);
    if (first) {
      first.focus();
    }
  }
  function closeDrawer() {
    if (drawer && drawer.classList.contains('is-open')) {
      drawer.classList.remove('is-open');
      if (menuBtn) {
        menuBtn.setAttribute('aria-expanded', 'false');
      }
      restoreFocus();
    }
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('.mobile-menu-btn')) {
      e.preventDefault();
      openDrawer();
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

  /* ---- Image lightbox: click an article image to zoom and pan ----
     Unlinked content images and the single-post hero (through its scrim,
     which covers it). Zoom: + / − / FIT buttons and keys, ctrl+wheel or
     trackpad pinch, touch pinch, double-click or double-tap. Pan: drag,
     scrollbars, wheel. Esc and the native <dialog> handle close and focus. */
  var ZOOMABLE = '.entry-content img:not(a img):not(.emoji)';
  var box, stage, pic, cap, want;
  var zoom = 1;
  var fitW = 0;
  var pts = {};
  var pinch = 0;
  var drag = null;
  var lastTap = 0;

  document.querySelectorAll(ZOOMABLE).forEach(function (img) {
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute(
      'aria-label',
      (img.alt ? img.alt + ' — ' : '') + 'enlarge image'
    );
  });

  /* The largest srcset candidate, so zooming in stays sharp. */
  function fullSrc(img) {
    var best = img.currentSrc || img.src;
    var bestW = 0;
    (img.getAttribute('srcset') || '').split(',').forEach(function (c) {
      var p = c.trim().split(/\s+/);
      var w = parseInt(p[1], 10);
      if (w > bestW) {
        bestW = w;
        best = p[0];
      }
    });
    return best;
  }

  /* z is relative to the fitted size; (px, py) is the stage point that
     stays put, the stage centre by default. */
  function setZoom(z, px, py) {
    z = Math.min(8, Math.max(1, z));
    if (zoom === 1) {
      fitW = pic.getBoundingClientRect().width;
    }
    if (px == null) {
      px = stage.clientWidth / 2;
      py = stage.clientHeight / 2;
    }
    var r = z / zoom;
    var x = (stage.scrollLeft + px) * r - px;
    var y = (stage.scrollTop + py) * r - py;
    zoom = z;
    box.classList.toggle('is-zoomed', z > 1);
    pic.style.width = z > 1 ? fitW * z + 'px' : '';
    stage.scrollLeft = x;
    stage.scrollTop = y;
  }

  function stagePoint(x, y) {
    var rect = stage.getBoundingClientRect();
    return [x - rect.left, y - rect.top];
  }

  function toggleZoom(x, y) {
    var p = stagePoint(x, y);
    setZoom(zoom > 1 ? 1 : 2.5, p[0], p[1]);
  }

  function buildBox() {
    box = document.createElement('dialog');
    box.className = 'lightbox';
    box.setAttribute('aria-label', 'Image viewer');
    box.innerHTML =
      '<div class="lightbox-bar">' +
      '<button type="button" data-zoom="out" aria-label="Zoom out">&minus;</button>' +
      '<button type="button" data-zoom="fit" aria-label="Fit to screen">FIT</button>' +
      '<button type="button" data-zoom="in" aria-label="Zoom in">+</button>' +
      '<button type="button" data-zoom="close" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div class="lightbox-stage"><img alt="" draggable="false"></div>' +
      '<p class="lightbox-cap"></p>';
    document.body.appendChild(box);
    stage = box.querySelector('.lightbox-stage');
    pic = stage.querySelector('img');
    cap = box.querySelector('.lightbox-cap');

    function zoomBy(action) {
      if (action === 'in') setZoom(zoom * 1.5);
      else if (action === 'out') setZoom(zoom / 1.5);
      else if (action === 'fit') setZoom(1);
      else if (action === 'close') box.close();
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-zoom]');
      if (b) {
        zoomBy(b.getAttribute('data-zoom'));
      } else if ((e.target === box || e.target === stage) && zoom === 1) {
        box.close();
      }
    });
    box.addEventListener('keydown', function (e) {
      var map = { '+': 'in', '=': 'in', '-': 'out', 0: 'fit' };
      if (map[e.key]) {
        e.preventDefault();
        zoomBy(map[e.key]);
      }
    });
    stage.addEventListener(
      'wheel',
      function (e) {
        if (!e.ctrlKey) return; // plain wheel scrolls the zoomed image
        e.preventDefault();
        var p = stagePoint(e.clientX, e.clientY);
        setZoom(zoom * Math.exp(-e.deltaY * 0.01), p[0], p[1]);
      },
      { passive: false }
    );
    stage.addEventListener('dblclick', function (e) {
      if (e.timeStamp - lastTap < 500) return; // a double-tap, handled below
      toggleZoom(e.clientX, e.clientY);
    });

    /* touch-action: none on the stage, so pan and pinch are ours. */
    stage.addEventListener('pointerdown', function (e) {
      pts[e.pointerId] = e;
      // Only while zoomed: capture retargets the click, and at fit a click
      // on the stage closes the viewer.
      if (zoom > 1) stage.setPointerCapture(e.pointerId);
      drag = {
        x: e.clientX,
        y: e.clientY,
        l: stage.scrollLeft,
        t: stage.scrollTop,
      };
    });
    stage.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return;
      pts[e.pointerId] = e;
      var ids = Object.keys(pts);
      if (ids.length === 2) {
        var a = pts[ids[0]];
        var b = pts[ids[1]];
        var d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        if (pinch) {
          var p = stagePoint(
            (a.clientX + b.clientX) / 2,
            (a.clientY + b.clientY) / 2
          );
          setZoom((zoom * d) / pinch, p[0], p[1]);
        }
        pinch = d;
        drag = null;
      } else if (drag && zoom > 1) {
        stage.scrollLeft = drag.l - (e.clientX - drag.x);
        stage.scrollTop = drag.t - (e.clientY - drag.y);
      }
    });
    function lift(e) {
      delete pts[e.pointerId];
      pinch = 0;
      drag = null;
    }
    stage.addEventListener('pointerup', function (e) {
      if (e.pointerType === 'touch' && !pinch) {
        if (e.timeStamp - lastTap < 300) {
          toggleZoom(e.clientX, e.clientY);
        }
        lastTap = e.timeStamp;
      }
      lift(e);
    });
    stage.addEventListener('pointercancel', lift);
  }

  function openBox(img) {
    if (!box) buildBox();
    zoom = 1;
    box.classList.remove('is-zoomed');
    pic.style.width = '';
    pic.src = img.currentSrc || img.src; // already loaded: shows at once
    pic.alt = img.alt;
    want = fullSrc(img);
    if (want !== pic.src) {
      var hi = new Image();
      var url = want;
      hi.onload = function () {
        if (want === url) pic.src = url;
      };
      hi.src = url;
    }
    var fig = img.closest('figure');
    var fc = fig && fig.querySelector('figcaption');
    cap.textContent = fc ? fc.textContent.trim() : '';
    cap.hidden = !cap.textContent;
    box.showModal();
  }

  document.addEventListener('click', function (e) {
    var img = e.target.closest(ZOOMABLE);
    if (!img && e.target.closest('.single-hero .hero-scrim')) {
      img = document.querySelector('.single-hero .hero-img');
    }
    if (img) openBox(img);
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches(ZOOMABLE)) {
      e.preventDefault();
      openBox(e.target);
    }
  });

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
