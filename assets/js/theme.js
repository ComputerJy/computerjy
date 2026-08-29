/**
 * ComputerJy World - Theme JavaScript
 * Handles: Dark/Light Mode, Navigation Drawer, Search Modal, Reading Progress, Code Copy, Share Bar
 */

(function () {
  'use strict';

  // 1. Dark / Light Mode Switcher
  const THEME_KEY = 'computerjy_theme_pref';

  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', initialTheme);
    updateThemeIcon(initialTheme);
  }

  function toggleTheme() {
    const currentTheme =
      document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    updateThemeIcon(newTheme);
    showToast(`Switched to ${newTheme} mode`);
  }

  function updateThemeIcon(theme) {
    const themeBtn = document.querySelector('.theme-toggle-btn');
    if (!themeBtn) return;

    if (theme === 'dark') {
      themeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
      themeBtn.setAttribute('aria-label', 'Switch to Light Mode');
    } else {
      themeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
      themeBtn.setAttribute('aria-label', 'Switch to Dark Mode');
    }
  }

  // 2. Reading Progress Bar & Header Shadow on Scroll
  function initScrollListeners() {
    const progressBar = document.querySelector('.reading-progress-bar');
    const header = document.querySelector('.site-header');

    window.addEventListener(
      'scroll',
      function () {
        const scrollY = window.scrollY || window.pageYOffset;

        if (header) {
          if (scrollY > 20) {
            header.classList.add('scrolled');
          } else {
            header.classList.remove('scrolled');
          }
        }

        if (progressBar) {
          const totalHeight =
            document.documentElement.scrollHeight -
            document.documentElement.clientHeight;
          if (totalHeight > 0) {
            const progress = (scrollY / totalHeight) * 100;
            progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
          }
        }
      },
      { passive: true }
    );
  }

  // 3. Mobile Navigation Drawer
  function initMobileDrawer() {
    const openBtn = document.querySelector('.mobile-menu-btn');
    const drawerBackdrop = document.querySelector('.mobile-drawer-backdrop');
    const closeBtn = document.querySelector('.mobile-drawer-close-btn');

    if (!openBtn || !drawerBackdrop) return;

    function openDrawer() {
      drawerBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      drawerBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    }

    openBtn.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    drawerBackdrop.addEventListener('click', function (e) {
      if (e.target === drawerBackdrop) {
        closeDrawer();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawerBackdrop.classList.contains('active')) {
        closeDrawer();
      }
    });
  }

  // 4. Search Modal Overlay
  function initSearchModal() {
    const triggerBtns = document.querySelectorAll(
      '.search-trigger-btn, .search-toggle-link'
    );
    const modal = document.querySelector('.search-modal-backdrop');
    const closeBtn = document.querySelector('.search-close-btn');
    const searchInput = document.querySelector('.search-modal-input');

    if (!modal) return;

    function openSearch() {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 80);
      }
    }

    function closeSearch() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    triggerBtns.forEach((btn) =>
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openSearch();
      })
    );

    if (closeBtn) closeBtn.addEventListener('click', closeSearch);

    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        closeSearch();
      }
    });

    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (modal.classList.contains('active')) {
          closeSearch();
        } else {
          openSearch();
        }
      }
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeSearch();
      }
    });
  }

  // 5. Code Block Copy Buttons
  function initCodeCopyButtons() {
    const preBlocks = document.querySelectorAll('.article-content pre');
    preBlocks.forEach((pre) => {
      // Create copy button
      pre.style.position = 'relative';
      const copyBtn = document.createElement('button');
      copyBtn.className = 'code-copy-btn';
      copyBtn.textContent = 'Copy';
      copyBtn.setAttribute('aria-label', 'Copy code to clipboard');
      copyBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(255, 255, 255, 0.15);
        color: #fff;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        cursor: pointer;
        backdrop-filter: blur(4px);
        transition: all 0.2s;
      `;

      copyBtn.addEventListener('click', function () {
        const code = pre.querySelector('code')
          ? pre.querySelector('code').innerText
          : pre.innerText;
        navigator.clipboard
          .writeText(code)
          .then(() => {
            copyBtn.textContent = 'Copied! ✓';
            copyBtn.style.background = '#10B981';
            setTimeout(() => {
              copyBtn.textContent = 'Copy';
              copyBtn.style.background = 'rgba(255, 255, 255, 0.15)';
            }, 2000);
          })
          .catch(() => {
            copyBtn.textContent = 'Error';
          });
      });

      pre.appendChild(copyBtn);
    });
  }

  // 6. Share Buttons & Copy Link
  function initShareButtons() {
    const copyLinkBtn = document.querySelector('.share-btn-copy');
    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
          showToast('Article link copied to clipboard! 📋');
        });
      });
    }
  }

  // 7. Toast Notification Utility
  function showToast(message) {
    let toast = document.querySelector('.toast-notice');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast-notice';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // 8. Back to Top Button
  function initBackToTop() {
    const backToTopBtn = document.querySelector('.back-to-top-btn');
    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // Initialize all components on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initScrollListeners();
    initMobileDrawer();
    initSearchModal();
    initCodeCopyButtons();
    initShareButtons();
    initBackToTop();

    const themeToggle = document.querySelector('.theme-toggle-btn');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
  });

  // Watch system color scheme changes if user has no saved preference
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_KEY)) {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        updateThemeIcon(newTheme);
      }
    });
})();
