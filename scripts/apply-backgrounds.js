'use strict'

const fs = require('fs')
const path = require('path')

const CONFIG_PATH = 'source/site-backgrounds.json'

hexo.extend.filter.register('before_generate', () => {
  const configPath = path.join(hexo.base_dir, CONFIG_PATH)

  if (!fs.existsSync(configPath)) {
    return
  }

  let config
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch (e) {
    hexo.log.warn('apply-backgrounds: failed to parse site-backgrounds.json:', e.message)
    return
  }

  const theme = hexo.theme.config

  if (config.site_bg) {
    theme.background = config.site_bg
  }
  if (config.home_top_img) {
    theme.index_img = config.home_top_img
  }
  if (config.default_top_img) {
    theme.default_top_img = config.default_top_img
  }
  if (config.archive_img) {
    theme.archive_img = config.archive_img
  }
  if (config.tag_img) {
    theme.tag_img = config.tag_img
  }
  if (config.category_img) {
    theme.category_img = config.category_img
  }
  if (config.error_bg && theme.error_404) {
    theme.error_404.background = config.error_bg
  }
  if (Array.isArray(config.default_covers) && config.default_covers.length > 0) {
    if (!theme.cover) {
      theme.cover = {}
    }
    theme.cover.default_cover = config.default_covers
  }

  hexo.log.info('apply-backgrounds: applied background settings from site-backgrounds.json')
})
