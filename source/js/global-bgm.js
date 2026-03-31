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
    player: null,
    persistTimer: null,
    ready: false,
    trackText: '',
  }

  const normalizeText = value => (typeof value === 'string' ? value.trim() : '')

  const clampNumber = (value, min, max, fallback) => {
    const number = Number(value)

    if (!Number.isFinite(number)) {
      return fallback
    }

    return Math.min(max, Math.max(min, number))
  }

  const getFileLabel = value => {
    const source = normalizeText(value)

    if (!source) {
      return ''
    }

    const fileName = source.split('/').pop() || source
    const decodedName = fileName.replace(/\.[^.]+$/, '')

    try {
      return decodeURIComponent(decodedName)
    } catch (error) {
      return decodedName
    }
  }

  const normalizeTrack = (track, index) => {
    if (!track || typeof track !== 'object') {
      return null
    }

    const url = normalizeText(track.url || track.file || track.src)

    if (!url) {
      return null
    }

    const name = normalizeText(track.name) || getFileLabel(url) || `歌曲 ${index + 1}`
    const artist = normalizeText(track.artist)
    const cover = normalizeText(track.cover)
    const lrc = normalizeText(track.lrc)
    const theme = normalizeText(track.theme)
    const normalizedTrack = {
      name,
      artist,
      url,
    }

    if (cover) {
      normalizedTrack.cover = cover
    }

    if (lrc) {
      normalizedTrack.lrc = lrc
    }

    if (theme) {
      normalizedTrack.theme = theme
    }

    return normalizedTrack
  }

  const normalizeConfig = rawConfig => {
    const config = rawConfig && typeof rawConfig === 'object' ? rawConfig : {}
    const rawSourceMode = normalizeText(config.sourceMode).toLowerCase()
    const rawTracks = Array.isArray(config.tracks) ? config.tracks : []
    const hasLocalTracks = rawTracks.length > 0
    const sourceMode =
      rawSourceMode === 'upload' || (rawSourceMode !== 'remote' && hasLocalTracks && !normalizeText(config.id))
        ? 'upload'
        : 'remote'

    return {
      enabled: config.enabled !== false,
      label: normalizeText(config.label) || '音乐角落',
      sourceMode,
      server: normalizeText(config.server) || 'netease',
      type: normalizeText(config.type) || 'song',
      id: normalizeText(config.id),
      volume: clampNumber(config.volume, 0, 1, 0.45),
      autoplay: config.autoplay === true,
      loop: ['all', 'one', 'none'].includes(config.loop) ? config.loop : 'all',
      order: ['list', 'random'].includes(config.order) ? config.order : 'list',
      mutex: config.mutex !== false,
      tracks: rawTracks.map(normalizeTrack).filter(Boolean),
    }
  }

  const getSourceKey = () => {
    if (!state.config) {
      return ''
    }

    if (state.config.sourceMode === 'upload') {
      return `upload:${state.config.tracks.map(track => track.url).join('|')}`
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
          index: Number.isInteger(state.player?.list?.index) ? state.player.list.index : 0,
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

    if (!state.button) {
      return
    }

    classNames.forEach(name => state.button.classList.remove(name))
    state.button.classList.add(mode)
  }

  const renderStatus = mode => {
    if (!state.button) {
      return
    }

    setMode(mode)

    const titleByMode = {
      'is-error': '音乐播放器暂时不可用',
      'is-loading': '音乐播放器正在加载',
      'is-paused': '播放站内音乐',
      'is-playing': '暂停站内音乐',
    }

    state.button.title = titleByMode[mode]
    state.button.setAttribute('aria-label', titleByMode[mode])
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

  const removeDock = () => {
    const dock = document.getElementById('music-dock')

    if (dock) {
      dock.remove()
    }
  }

  const bindControls = () => {
    if (!state.button || state.button.dataset.musicBound === 'true') {
      return
    }

    state.button.dataset.musicBound = 'true'
    state.button.addEventListener('click', togglePlayback)
  }

  const getPlayerContainer = () => {
    if (document.getElementById('global-bgm-container')) {
      return document.getElementById('global-bgm-container')
    }

    const container = document.createElement('div')
    container.id = 'global-bgm-container'
    document.body.appendChild(container)

    return container
  }

  const createRemotePlayer = () => {
    if (!window.customElements) {
      throw new Error('Custom elements are not available for remote music playback')
    }

    const container = getPlayerContainer()

    if (!container.querySelector('meting-js')) {
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
    }

    return waitForPlayer()
  }

  const createUploadPlayer = () => {
    const container = getPlayerContainer()

    if (state.player) {
      return state.player
    }

    container.innerHTML = ''

    return new window.APlayer({
      container,
      preload: 'auto',
      autoplay: false,
      loop: state.config.loop || 'all',
      order: state.config.order || 'list',
      mutex: state.config.mutex !== false,
      volume: state.config.volume ?? 0.45,
      audio: state.config.tracks,
    })
  }

  const createPlayer = async () => {
    if (state.config.sourceMode === 'upload') {
      return createUploadPlayer()
    }

    return createRemotePlayer()
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

    const savedIndex = Number.parseInt(saved.index, 10)
    const playlist = state.player?.list && Array.isArray(state.player.list.audios) ? state.player.list.audios : []

    const switchedTrack =
      Number.isInteger(savedIndex) &&
      savedIndex >= 0 &&
      savedIndex < playlist.length &&
      state.player?.list &&
      typeof state.player.list.switch === 'function' &&
      state.player.list.index !== savedIndex

    if (switchedTrack) {
      state.player.list.switch(savedIndex)
    }

    if (!switchedTrack && state.audio.readyState >= 1) {
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

    return normalizeConfig(await response.json())
  }

  const init = async () => {
    if (typeof window.APlayer === 'undefined') {
      return
    }

    try {
      state.config = await loadConfig()
    } catch (error) {
      console.warn('Failed to load site music config:', error)
      return
    }

    if (!state.config || state.config.enabled === false) {
      return
    }

    if (state.config.sourceMode === 'upload' && state.config.tracks.length === 0) {
      return
    }

    if (state.config.sourceMode !== 'upload' && !state.config.id) {
      return
    }

    createNavButton()
    removeDock()
    bindControls()

    renderStatus('is-loading')

    try {
      state.player = await createPlayer()
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
