# Boke

一个基于 Hexo + Butterfly 的中文个人博客，目标是更接近传统中文博客风格：大头图、侧边栏、分类、标签、归档和封面文章流。

## 技术栈

- Hexo 8
- Butterfly 主题
- Giscus 评论
- 本地搜索、RSS、sitemap
- GitHub 管理源码
- Cloudflare Pages 自动部署

## 快速开始

1. 安装 Node.js 20.19.0 或更高版本（推荐 20.20.0）。
2. 运行 `npm install`。
3. 运行 `npm run dev`。
4. 打开终端里 Hexo 输出的本地地址。

## 常用命令

```bash
npm run dev
npm run build
npx hexo new post "文章标题"
```

## 主要配置文件

- Hexo 站点配置：`_config.yml`
- Butterfly 主题配置：`_config.butterfly.yml`
- 文章目录：`source/_posts/`
- 自定义样式：`source/css/custom.css`
- 静态资源：`source/img/`

## 当前地址

- 正式站点：`https://gudong226.linuxdo.space`
- GitHub 仓库：`https://github.com/GuDong2003/boke`

## Cloudflare Pages 配置

- 构建命令：`npm run build`
- 输出目录：`public`
- Node 版本：`20.20.0`

## 评论与统计

- 评论使用 `Giscus`，配置在 `_config.butterfly.yml`
- GitHub Discussions 仓库：`GuDong2003/boke`
- Cloudflare Web Analytics 已在后台启用，无需额外写代码

## 站点结构

```text
.
|- source/
|  |- _posts/
|  |- about/
|  |- archives/
|  |- categories/
|  |- tags/
|  |- css/
|  `- img/
|- _config.yml
|- _config.butterfly.yml
`- package.json
```
