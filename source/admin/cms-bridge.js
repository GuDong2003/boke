(function () {
  var THEME_STORAGE_KEY = 'admin-theme';
  var parentOrigin = window.location.origin;
  var isEmbedded = window.parent && window.parent !== window;

  function normalizeHash(hash) {
    if (!hash || hash === '#') {
      return '#/';
    }

    return hash;
  }

  function post(type) {
    if (!isEmbedded) {
      return;
    }

    window.parent.postMessage(
      {
        type: type,
        hash: normalizeHash(window.location.hash),
      },
      parentOrigin
    );
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function initStandaloneTheme() {
    if (isEmbedded) {
      return;
    }

    var stored = null;
    try {
      stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch (e) {}

    var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(theme);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      try {
        if (!window.localStorage.getItem(THEME_STORAGE_KEY)) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      } catch (err) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    post('admin-cms-loading');
    post('admin-cms-ready');
    initStandaloneTheme();
  });

  window.addEventListener('hashchange', function () {
    post('admin-cms-hash');
  });

  window.addEventListener('message', function (event) {
    var data = event.data || {};

    if (event.origin !== parentOrigin) {
      return;
    }

    if (data.type === 'admin-shell-set-hash') {
      var nextHash = normalizeHash(data.hash);
      if (normalizeHash(window.location.hash) !== nextHash) {
        window.location.hash = nextHash;
      }
      return;
    }

    if (data.type === 'admin-shell-set-theme') {
      applyTheme(data.theme);
    }
  });
})();
