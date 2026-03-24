(function () {
  var root = document.documentElement;
  var body = document.body;
  var observer = null;
  var rafId = 0;

  function getAdminView(hash) {
    if (/^#\/collections\/[^/]+\/entries\/[^/]+/.test(hash)) {
      return 'entry';
    }

    if (/^#\/collections\/[^/]+/.test(hash)) {
      return 'collection';
    }

    if (/^#\/media/.test(hash)) {
      return 'media';
    }

    return 'dashboard';
  }

  function markElements(container, selector, className) {
    container.querySelectorAll(selector).forEach(function (node) {
      node.classList.add(className);
    });
  }

  function applyAdminState() {
    if (!body) {
      return;
    }

    body.dataset.adminView = getAdminView(window.location.hash || '#/');

    var topbar = document.querySelector('.admin-topbar');
    var topbarOffset = topbar ? Math.ceil(topbar.getBoundingClientRect().height + 34) : 120;
    root.style.setProperty('--admin-shell-offset', topbarOffset + 'px');

    var ncRoot = document.getElementById('nc-root');
    if (!ncRoot) {
      return;
    }

    var main = ncRoot.querySelector("[role='main']");
    if (main) {
      main.classList.add('admin-cms-main');
    }

    markElements(ncRoot, 'nav', 'admin-cms-toolbar');
    markElements(ncRoot, 'aside', 'admin-cms-sidebar');
    markElements(ncRoot, 'form', 'admin-cms-form');
    markElements(ncRoot, 'fieldset', 'admin-cms-fieldset');
    markElements(ncRoot, "[role='dialog']", 'admin-cms-dialog');
    markElements(ncRoot, "[role='toolbar']", 'admin-cms-inline-toolbar');
  }

  function scheduleApply() {
    initObserver();

    if (rafId) {
      cancelAnimationFrame(rafId);
    }

    rafId = window.requestAnimationFrame(function () {
      rafId = 0;
      applyAdminState();
    });
  }

  function initObserver() {
    var ncRoot = document.getElementById('nc-root');
    if (!ncRoot || observer) {
      return;
    }

    observer = new MutationObserver(scheduleApply);
    observer.observe(ncRoot, {
      childList: true,
      subtree: true,
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    scheduleApply();
    initObserver();
  });

  window.addEventListener('hashchange', scheduleApply);
  window.addEventListener('resize', scheduleApply, { passive: true });
})();
