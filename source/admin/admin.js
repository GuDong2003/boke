(function () {
  var THEME_STORAGE_KEY = 'admin-theme';
  var body = document.body;
  var iframe = null;
  var rafId = 0;
  var suppressParentHashChange = false;
  var frameLoaded = false;
  var frameOrigin = window.location.origin;
  var frameBasePath = '/admin/cms.html';
  var viewCopy = {
    dashboard: {
      label: '内容后台',
      title: '像写文章一样管理你的站点',
      description: '这里直接连接 GitHub 仓库。保存内容后会提交到源码，并触发 Cloudflare Pages 自动部署。',
    },
    collection: {
      label: '内容列表',
      title: '浏览文章、页面和站点资料',
      description: '从这里进入文章、About、首页文案和站点资料，继续保持主站那种统一的内容整理方式。',
    },
    entry: {
      label: '编辑模式',
      title: '把注意力留给内容，而不是后台界面',
      description: '现在是单篇内容编辑视图。这里保持更克制的外层信息，让你像在主站内容页里写作一样专注。',
    },
    media: {
      label: '媒体资源',
      title: '统一管理封面、插图和上传素材',
      description: '这里用来整理上传文件，方便给文章封面、页面头图和正文内容复用同一套资源。',
    },
  };

  function normalizeHash(hash) {
    if (!hash || hash === '#') {
      return '#/';
    }

    return hash;
  }

  function getAdminView(hash) {
    var currentHash = normalizeHash(hash);

    if (/^#\/collections\/[^/]+\/entries\/[^/]+/.test(currentHash)) {
      return 'entry';
    }

    if (/^#\/collections\/[^/]+/.test(currentHash)) {
      return 'collection';
    }

    if (/^#\/media/.test(currentHash)) {
      return 'media';
    }

    return 'dashboard';
  }

  function applyAdminState() {
    if (!body) {
      return;
    }

    var view = getAdminView(window.location.hash);
    var copy = viewCopy[view] || viewCopy.dashboard;
    var title = copy.title + ' · 咕咚的小站';

    body.dataset.adminView = view;
    document.title = title;
  }

  function setReadyState(isReady) {
    if (!body) {
      return;
    }

    body.dataset.adminReady = isReady ? 'true' : 'false';
  }

  function updateIframeSource(forceReload) {
    var desiredHash = normalizeHash(window.location.hash);
    var desiredSrc = frameBasePath + desiredHash;

    if (!iframe) {
      return;
    }

    if (!frameLoaded || forceReload) {
      if (iframe.getAttribute('src') !== desiredSrc) {
        iframe.setAttribute('src', desiredSrc);
      }

      setReadyState(false);
      return;
    }

    try {
      iframe.contentWindow.postMessage(
        {
          type: 'admin-shell-set-hash',
          hash: desiredHash,
        },
        frameOrigin
      );
    } catch (error) {
      iframe.setAttribute('src', desiredSrc);
      setReadyState(false);
    }
  }

  function scheduleApply() {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }

    rafId = window.requestAnimationFrame(function () {
      rafId = 0;
      applyAdminState();
      updateIframeSource(false);
    });
  }

  function syncParentHash(nextHash) {
    var normalizedHash = normalizeHash(nextHash);

    if (normalizeHash(window.location.hash) === normalizedHash) {
      return;
    }

    suppressParentHashChange = true;
    window.location.hash = normalizedHash;
    window.setTimeout(function () {
      suppressParentHashChange = false;
    }, 0);
  }

  function handleFrameMessage(event) {
    var data = event.data || {};

    if (event.origin !== frameOrigin || !data.type) {
      return;
    }

    if (data.type === 'admin-cms-ready') {
      frameLoaded = true;
      setReadyState(true);
      syncParentHash(data.hash);
      applyAdminState();
      return;
    }

    if (data.type === 'admin-cms-hash') {
      syncParentHash(data.hash);
      applyAdminState();
      return;
    }

    if (data.type === 'admin-cms-loading') {
      setReadyState(false);
    }
  }

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function getStoredTheme() {
    try {
      return window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    updateToggleIcon(theme);
    syncThemeToIframe(theme);
  }

  function updateToggleIcon(theme) {
    var btn = document.getElementById('admin-theme-toggle');
    if (btn) {
      btn.textContent = theme === 'dark' ? '\u2600' : '\u263E';
    }
  }

  function syncThemeToIframe(theme) {
    if (!iframe || !iframe.contentWindow) {
      return;
    }

    try {
      iframe.contentWindow.postMessage(
        { type: 'admin-shell-set-theme', theme: theme },
        frameOrigin
      );
    } catch (e) {}
  }

  function initTheme() {
    var stored = getStoredTheme();
    var theme = stored || getSystemTheme();
    applyTheme(theme);

    var btn = document.getElementById('admin-theme-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme') || 'light';
        var next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try {
          window.localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch (e) {}
      });
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (!getStoredTheme()) {
        applyTheme(getSystemTheme());
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    iframe = document.getElementById('admin-cms-frame');
    setReadyState(false);
    scheduleApply();
    initTheme();

    if (iframe) {
      iframe.addEventListener('load', function () {
        frameLoaded = true;
        var theme = document.documentElement.getAttribute('data-theme') || 'light';
        syncThemeToIframe(theme);
      });
      updateIframeSource(true);
    }
  });

  window.addEventListener('hashchange', function () {
    if (suppressParentHashChange) {
      return;
    }

    scheduleApply();
  });
  window.addEventListener('message', handleFrameMessage);
})();
