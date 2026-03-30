(() => {
  const CONFIG_PATH = '/site-music.json'
  const STORAGE_KEY = 'boke-global-bgm-state'
  const RESUME_WINDOW_MS = 1000 * 60 * 60 * 6
  const PLAYER_WAIT_STEP_MS = 200
  const PLAYER_WAIT_LIMIT = 80

  const state = {
    audio: null,
    button: null,
    config: null,
    dock: null,
    dockTrack: null,
    player: null,
    persistTimer: null,
    ready: false,
    trackText: '',
  }

  const getSourceKey = () => {
    if (!state.config) {
      return ''
    }

    return [state.config.server, state.config.type, String(state.config.id)].join(':')
  }

  const readStoredState = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch (error) {
      console.warn('Failed to read stored BGM state:', error)
      return null
    }
  }

  const persistState = () => {
    if (!state.audio) {
      return
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          playing: !state.audio.paused,
          source: getSourceKey(),
          time: Number.isFinite(state.audio.currentTime) ? state.audio.currentTime : 0,
          updatedAt: Date.now(),
        })
      )
    } catch (error) {
      console.warn('Failed to persist BGM state:', error)
    }
  }

  const setMode = mode => {
    const classNames = ['is-loading', 'is-playing', 'is-paused', 'is-error']

    ;[state.button, state.dock].forEach(element => {
      if (!element) {
        return
      }

      classNames.forEach(name => element.classList.remove(name))
      element.classList.add(mode)
    })
  }

  const getTrackLine = prefix => {
    const label = state.trackText || state.config?.label || '音乐角落'
    return prefix ? `${prefix} · ${label}` : label
  }

  const renderStatus = mode => {
    if (!state.button && !state.dock) {
      return
    }

    setMode(mode)

    const lineByMode = {
      'is-error': '暂时无法加载当前歌曲',
      'is-loading': '正在准备播放器',
      'is-paused': getTrackLine('点击继续播放'),
      'is-playing': state.trackText || state.config?.label || '音乐角落',
    }

    const titleByMode = {
      'is-error': '音乐播放器暂时不可用',
      'is-loading': '音乐播放器正在加载',
      'is-paused': '播放站内音乐',
      'is-playing': '暂停站内音乐',
    }

    if (state.dockTrack) {
      state.dockTrack.textContent = lineByMode[mode]
    }

    if (state.button) {
      state.button.title = titleByMode[mode]
      state.button.setAttribute('aria-label', titleByMode[mode])
    }

    if (state.dock) {
      state.dock.title = titleByMode[mode]
      state.dock.setAttribute('aria-label', titleByMode[mode])
    }
  }

  const syncUi = () => {
    if (!state.ready || !state.audio) {
      renderStatus('is-loading')
      return
    }

    renderStatus(state.audio.paused ? 'is-paused' : 'is-playing')
  }

  const updateTrackText = () => {
    if (!state.player) {
      state.trackText = state.config?.label || '音乐角落'
      syncUi()
      return
    }

    const list = state.player.list && Array.isArray(state.player.list.audios) ? state.player.list.audios : []
    const current = list[state.player.list.index] || null
    const name = current && typeof current.name === 'string' ? current.name.trim() : ''
    const artist = current && typeof current.artist === 'string' ? current.artist.trim() : ''

    state.trackText = [name, artist].filter(Boolean).join(' · ') || state.config?.label || '音乐角落'
    syncUi()
  }

  const attemptPlay = reason => {
    if (!state.player) {
      return
    }

    try {
      const result = state.player.play()

      if (result && typeof result.catch === 'function') {
        result.catch(error => {
          console.warn(`BGM playback failed during ${reason}:`, error)
          syncUi()
        })
      }
    } catch (error) {
      console.warn(`BGM playback failed during ${reason}:`, error)
      syncUi()
    }
  }

  const togglePlayback = () => {
    if (!state.audio || !state.player) {
      return
    }

    if (state.audio.paused) {
      attemptPlay('manual-toggle')
    } else {
      state.player.pause()
    }

    persistState()
  }

  const createNavButton = () => {
    const menus = document.getElementById('menus')

    if (!menus || document.getElementById('nav-music')) {
      state.button = document.getElementById('nav-music-btn')
      return
    }

    const wrapper = document.createElement('div')
    wrapper.id = 'nav-music'
    wrapper.innerHTML =
      '<button id="nav-music-btn" type="button"><i class="fas fa-compact-disc" aria-hidden="true"></i></button>'

    const toggleMenu = document.getElementById('toggle-menu')
    if (toggleMenu) {
      menus.insertBefore(wrapper, toggleMenu)
    } else {
      menus.appendChild(wrapper)
    }

    state.button = wrapper.querySelector('#nav-music-btn')
  }

  const createDock = () => {
    if (document.getElementById('music-dock')) {
      state.dock = document.getElementById('music-dock')
      state.dockTrack = state.dock.querySelector('.music-dock-track')
      return
    }

    const dock = document.createElement('button')
    dock.id = 'music-dock'
    dock.type = 'button'
    dock.innerHTML = [
      '<span class="music-dock-disc" aria-hidden="true">',
      '<i class="fas fa-compact-disc"></i>',
      '</span>',
      '<span class="music-dock-copy">',
      `<span class="music-dock-label">${state.config?.label || '音乐角落'}</span>`,
      '<span class="music-dock-track">正在准备播放器</span>',
      '</span>',
    ].join('')

    document.body.appendChild(dock)
    state.dock = dock
    state.dockTrack = dock.querySelector('.music-dock-track')
  }

  const bindControls = () => {
    ;[state.button, state.dock].forEach(element => {
      if (!element || element.dataset.musicBound === 'true') {
        return
      }

      element.dataset.musicBound = 'true'
      element.addEventListener('click', togglePlayback)
    })
  }

  const createPlayerContainer = () => {
    if (document.getElementById('global-bgm-container')) {
      return
    }

    const container = document.createElement('div')
    container.id = 'global-bgm-container'

    const meting = document.createElement('meting-js')
    meting.setAttribute('server', state.config.server)
    meting.setAttribute('type', state.config.type)
    meting.setAttribute('id', String(state.config.id))
    meting.setAttribute('volume', String(state.config.volume ?? 0.45))
    meting.setAttribute('preload', 'auto')
    meting.setAttribute('loop', state.config.loop || 'all')
    meting.setAttribute('order', state.config.order || 'list')
    meting.setAttribute('mutex', String(state.config.mutex !== false))

    container.appendChild(meting)
    document.body.appendChild(container)
  }

  const waitForPlayer = () =>
    new Promise((resolve, reject) => {
      let attempts = 0

      const timer = window.setInterval(() => {
        attempts += 1
        const meting = document.querySelector('#global-bgm-container meting-js')

        if (meting && meting.aplayer) {
          window.clearInterval(timer)
          resolve(meting.aplayer)
          return
        }

        if (attempts >= PLAYER_WAIT_LIMIT) {
          window.clearInterval(timer)
          reject(new Error('Timed out while waiting for the BGM player'))
        }
      }, PLAYER_WAIT_STEP_MS)
    })

  const restoreProgress = () => {
    const saved = readStoredState()

    if (!saved || saved.source !== getSourceKey()) {
      if (state.config.autoplay) {
        attemptPlay('config-autoplay')
      }
      syncUi()
      return
    }

    if (Date.now() - saved.updatedAt > RESUME_WINDOW_MS) {
      window.localStorage.removeItem(STORAGE_KEY)
      syncUi()
      return
    }

    const seekToSavedTime = () => {
      if (!state.audio || !Number.isFinite(saved.time)) {
        return
      }

      if (Number.isFinite(state.audio.duration) && saved.time < state.audio.duration) {
        state.audio.currentTime = Math.max(saved.time, 0)
      }
    }

    if (state.audio.readyState >= 1) {
      seekToSavedTime()
    } else {
      state.audio.addEventListener('loadedmetadata', seekToSavedTime, { once: true })
    }

    if (saved.playing) {
      window.setTimeout(() => attemptPlay('stored-state'), 140)
    }

    syncUi()
  }

  const bindPlayerEvents = () => {
    if (!state.audio || !state.player) {
      return
    }

    state.audio.addEventListener('play', () => {
      syncUi()
      persistState()
    })

    state.audio.addEventListener('pause', () => {
      syncUi()
      persistState()
    })

    state.audio.addEventListener('ended', persistState)
    state.audio.addEventListener('loadedmetadata', updateTrackText)
    state.audio.addEventListener('error', () => renderStatus('is-error'))

    if (typeof state.player.on === 'function') {
      state.player.on('listswitch', () => {
        updateTrackText()
        persistState()
      })
    }
  }

  const startPersistLoop = () => {
    if (state.persistTimer) {
      window.clearInterval(state.persistTimer)
    }

    state.persistTimer = window.setInterval(() => {
      if (state.audio && !state.audio.paused) {
        persistState()
      }
    }, 4000)
  }

  const loadConfig = async () => {
    const response = await fetch(CONFIG_PATH, { cache: 'no-store' })

    if (!response.ok) {
      throw new Error(`Unexpected status ${response.status}`)
    }

    return response.json()
  }

  const init = async () => {
    if (typeof window.APlayer === 'undefined' || !window.customElements) {
      return
    }

    try {
      state.config = await loadConfig()
    } catch (error) {
      console.warn('Failed to load site music config:', error)
      return
    }

    if (!state.config || state.config.enabled === false || !state.config.id) {
      return
    }

    createNavButton()
    createDock()
    bindControls()

    if (state.dock) {
      state.dock.classList.add('is-ready')
    }

    renderStatus('is-loading')
    createPlayerContainer()

    try {
      state.player = await waitForPlayer()
    } catch (error) {
      console.warn('Failed to initialize BGM player:', error)
      renderStatus('is-error')
      return
    }

    state.audio = state.player.audio
    state.ready = true

    if (typeof state.player.volume === 'function' && Number.isFinite(state.config.volume)) {
      state.player.volume(state.config.volume, true)
    }

    bindPlayerEvents()
    updateTrackText()
    startPersistLoop()
    restoreProgress()

    window.addEventListener('beforeunload', persistState)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        persistState()
      }
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()
