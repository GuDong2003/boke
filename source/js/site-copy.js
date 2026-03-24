(() => {
  const SITE_COPY_PATH = '/site-copy.json'
  const SITE_PROFILE_PATH = '/site-profile.json'
  const ADMIN_PORTAL_PATH = '/admin/'
  const ADMIN_PORTAL_ICON = '/img/admin-fox.svg'

  const fetchJson = async path => {
    const response = await fetch(path, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`Unexpected status ${response.status}`)
    }

    return response.json()
  }

  const normalizePath = pathname => {
    const normalized = pathname.replace(/\/+$/, '')
    return normalized === '' ? '/' : normalized
  }

  const getHomepageSubtitles = data => {
    if (!data || !Array.isArray(data.homepage_subtitles)) {
      return []
    }

    return data.homepage_subtitles
      .filter(item => typeof item === 'string')
      .map(item => item.trim())
      .filter(Boolean)
  }

  const applyHomepageSubtitles = async () => {
    if (normalizePath(window.location.pathname) !== '/') {
      return
    }

    const subtitleElement = document.getElementById('subtitle')
    if (!subtitleElement || !window.typedJSFn || typeof window.typedJSFn.processSubtitle !== 'function') {
      return
    }

    try {
      const data = await fetchJson(SITE_COPY_PATH)
      const subtitles = getHomepageSubtitles(data)

      if (subtitles.length === 0) {
        return
      }

      if (window.typed && typeof window.typed.destroy === 'function') {
        window.typed.destroy()
        window.typed = null
      }

      window.typedJSFn.processSubtitle(subtitles)
    } catch (error) {
      console.error('Failed to load homepage subtitles from site-copy.json:', error)
    }
  }

  const applyText = (selector, value) => {
    if (typeof value !== 'string' || value.trim() === '') {
      return
    }

    document.querySelectorAll(selector).forEach(element => {
      element.textContent = value
    })
  }

  const applyAvatar = avatar => {
    if (typeof avatar !== 'string' || avatar.trim() === '') {
      return
    }

    document.querySelectorAll('.avatar-img img').forEach(image => {
      image.src = avatar
    })
  }

  const applyFavicon = favicon => {
    if (typeof favicon !== 'string' || favicon.trim() === '') {
      return
    }

    const selectors = [
      'link[rel="shortcut icon"]',
      'link[rel="icon"]',
      'link[rel="alternate icon"]',
      'link[rel="apple-touch-icon"]',
    ]

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(link => {
        link.href = favicon
      })
    })

    if (!document.querySelector('link[rel="icon"]')) {
      const link = document.createElement('link')
      link.rel = 'icon'
      link.href = favicon
      document.head.appendChild(link)
    }
  }

  const ensureFooterAdminLink = () => {
    const footerText = document.querySelector('.footer_custom_text')
    if (!footerText) {
      return
    }

    let link = footerText.querySelector('.footer-admin-link')

    if (!link) {
      link = document.createElement('a')
      link.className = 'footer-admin-link'
      link.href = ADMIN_PORTAL_PATH
      link.title = 'Admin'
      link.setAttribute('aria-label', 'Admin')

      const icon = document.createElement('img')
      icon.src = ADMIN_PORTAL_ICON
      icon.alt = ''
      icon.decoding = 'async'

      link.appendChild(icon)
      footerText.appendChild(link)
    }
  }

  const applySiteProfile = async () => {
    try {
      const data = await fetchJson(SITE_PROFILE_PATH)

      applyAvatar(data.avatar)
      applyFavicon(data.favicon)
      applyText('.author-info-name', data.author_name)
      applyText('.author-info-description', data.author_description)
      applyText('.announcement_content', data.announcement)
      applyText('.footer_custom_text', data.footer_text)
      ensureFooterAdminLink()
    } catch (error) {
      console.error('Failed to load site profile from site-profile.json:', error)
      ensureFooterAdminLink()
    }
  }

  const applySiteContent = () => {
    applyHomepageSubtitles()
    applySiteProfile()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySiteContent, { once: true })
  } else {
    applySiteContent()
  }

  if (window.btf && typeof window.btf.addGlobalFn === 'function') {
    window.btf.addGlobalFn('pjaxComplete', applySiteContent, 'siteCopyContent')
  }
})()
