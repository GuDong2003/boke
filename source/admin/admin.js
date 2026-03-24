(function () {
  var body = document.body;
  var observer = null;
  var rafId = 0;
  var viewCopy = {
    dashboard: {
      label: '内容后台',
      title: '像写文章一样管理你的站点',
      description: '这里直接连接 GitHub 仓库。保存内容后会提交到源码，并触发 Cloudflare Pages 自动部署。',
      note: '登录 GitHub，编辑内容，保存后自动进入仓库与部署流程。',
    },
    collection: {
      label: '内容列表',
      title: '浏览文章、页面和站点资料',
      description: '从这里进入文章、About、首页文案和站点资料，继续保持主站那种统一的内容整理方式。',
      note: '列表页适合集中浏览、筛选和进入编辑，不需要切来切去。',
    },
    entry: {
      label: '编辑模式',
      title: '把注意力留给内容，而不是后台界面',
      description: '现在是单篇内容编辑视图。这里保持更克制的外层信息，让你像在主站内容页里写作一样专注。',
      note: '保存后会直接写入 GitHub 仓库，并继续由 Cloudflare Pages 自动发布。',
    },
    media: {
      label: '媒体资源',
      title: '统一管理封面、插图和上传素材',
      description: '这里用来整理上传文件，方便给文章封面、页面头图和正文内容复用同一套资源。',
      note: '媒体资源同样会进入仓库，因此改动也会跟随部署一起生效。',
    },
  };

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

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) {
      node.textContent = value;
    }
  }

  function applyAdminState() {
    if (!body) {
      return;
    }

    var view = getAdminView(window.location.hash || '#/');
    var copy = viewCopy[view] || viewCopy.dashboard;
    var title = copy.title + ' · 咕咚的小站';

    body.dataset.adminView = view;
    setText('admin-view-label', copy.label);
    setText('admin-view-title', copy.title);
    setText('admin-view-description', copy.description);
    setText('admin-view-note', copy.note);
    document.title = title;
  }

  function syncReadyState() {
    var ncRoot = document.getElementById('nc-root');
    body.dataset.adminReady = ncRoot && ncRoot.childElementCount > 0 ? 'true' : 'false';
  }

  function scheduleApply() {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }

    rafId = window.requestAnimationFrame(function () {
      rafId = 0;
      applyAdminState();
      syncReadyState();
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
