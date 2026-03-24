(function () {
  var parentOrigin = window.location.origin;

  function normalizeHash(hash) {
    if (!hash || hash === '#') {
      return '#/';
    }

    return hash;
  }

  function post(type) {
    if (!window.parent || window.parent === window) {
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

  document.addEventListener('DOMContentLoaded', function () {
    post('admin-cms-loading');
    post('admin-cms-ready');
  });

  window.addEventListener('hashchange', function () {
    post('admin-cms-hash');
  });

  window.addEventListener('message', function (event) {
    var data = event.data || {};

    if (event.origin !== parentOrigin || data.type !== 'admin-shell-set-hash') {
      return;
    }

    var nextHash = normalizeHash(data.hash);
    if (normalizeHash(window.location.hash) !== nextHash) {
      window.location.hash = nextHash;
    }
  });
})();
