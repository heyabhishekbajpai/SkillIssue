// Canonical public origin. Override with VITE_SITE_URL for previews.
export const SITE_URL = (import.meta.env?.VITE_SITE_URL || 'https://skillissue.si').replace(/\/$/, '')
