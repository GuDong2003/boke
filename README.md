# Boke

一个基于 Astro 的个人博客起步项目，目标是先把写作和发布跑通，再按需扩展搜索、评论和边缘能力。

## 技术栈

- Astro
- Markdown content collections
- 原生 CSS
- RSS 和 sitemap
- GitHub 管理源码与文章
- Cloudflare Pages 负责部署

## 快速开始

1. 安装 Node.js 20 或更高版本。
2. 运行 `npm install`。
3. 运行 `npm run dev`。
4. 打开终端里 Astro 输出的本地地址。

## 先改哪些地方

- 在 `src/site-config.mjs` 里改站点标题、描述、作者、域名。
- 把 `src/content/blog/` 里的示例文章替换成你的内容。
- 按需要修改导航和社交链接。
- 如果要启用评论，在 `src/site-config.mjs` 里填好 giscus 配置。

## 项目结构

```text
.
|- public/
|- src/
|  |- components/
|  |- content/blog/
|  |- data/
|  |- layouts/
|  |- pages/
|  |- styles/
|  `- utils/
|- astro.config.mjs
`- package.json
```

## Deploy to Cloudflare Pages

1. 先把当前目录推到 GitHub 仓库。
2. 在 Cloudflare Pages 里从这个仓库创建项目。
3. 构建命令填 `npm run build`。
4. 输出目录填 `dist`。
5. 如果先用 Cloudflare 默认域名，部署后确认 `*.pages.dev` 地址，再同步更新 `src/site-config.mjs` 里的 `url`。

## 现在已经带了什么

- 首页、归档、文章详情、关于页、404 页
- RSS 输出
- 轻量站内搜索 `src/pages/search.astro`
- 预留的 giscus 评论组件 `src/components/Comments.astro`
- Cloudflare Pages 可识别的安全响应头 `public/_headers`

## 后续可以继续加

- 打开 `giscus` 评论
- 等文章更多后把搜索升级成 `Pagefind`
- 真有需求时再加 Cloudflare Workers 做表单、重定向或自动化
