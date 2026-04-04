'use strict'

const fs = require('fs')
const path = require('path')

const AUDIO_DIR = 'source/audio/uploads'
const CONFIG_PATH = 'source/site-music.json'
const AUDIO_EXTS = new Set(['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac'])

hexo.extend.filter.register('before_generate', () => {
  const baseDir = hexo.base_dir
  const audioDir = path.join(baseDir, AUDIO_DIR)
  const configPath = path.join(baseDir, CONFIG_PATH)

  if (!fs.existsSync(audioDir) || !fs.existsSync(configPath)) {
    return
  }

  const files = fs.readdirSync(audioDir).filter(f => {
    const ext = path.extname(f).toLowerCase()
    return AUDIO_EXTS.has(ext) && !f.startsWith('.')
  }).sort()

  if (files.length === 0) {
    return
  }

  let config
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch (e) {
    hexo.log.warn('auto-music-tracks: failed to parse site-music.json:', e.message)
    return
  }

  const tracks = files.map(f => {
    const basename = f.replace(/\.[^.]+$/, '')
    const parts = basename.split(' - ')
    let artist = ''
    let name = basename

    if (parts.length >= 2) {
      artist = parts[0].trim()
      name = parts.slice(1).join(' - ').trim()
    }

    return {
      name,
      artist,
      url: '/audio/uploads/' + encodeURIComponent(f).replace(/%20/g, ' '),
    }
  })

  config.sourceMode = 'upload'
  config.tracks = tracks

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8')
  hexo.log.info('auto-music-tracks: synced %d track(s) from %s', tracks.length, AUDIO_DIR)
})
