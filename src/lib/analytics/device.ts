export type DeviceKind = 'desktop' | 'mobile' | 'tablet' | 'bot'

export function parseDevice(userAgent: string, isBot: boolean): {
  device: DeviceKind
  browser: string
  os: string
} {
  const ua = userAgent || ''
  if (isBot) return { device: 'bot', browser: 'Bot', os: 'Bot' }

  const os = /windows/i.test(ua)
    ? 'Windows'
    : /android/i.test(ua)
      ? 'Android'
      : /iphone|ipad|ipod/i.test(ua)
        ? 'iOS'
        : /mac os/i.test(ua)
          ? 'macOS'
          : /linux/i.test(ua)
            ? 'Linux'
            : 'Otro'

  const browser = /edg\//i.test(ua)
    ? 'Edge'
    : /opr\//i.test(ua) || /opera/i.test(ua)
      ? 'Opera'
      : /samsungbrowser/i.test(ua)
        ? 'Samsung'
        : /firefox|fxios/i.test(ua)
          ? 'Firefox'
          : /chrome|crios/i.test(ua)
            ? 'Chrome'
            : /safari/i.test(ua)
              ? 'Safari'
              : 'Otro'

  const device: DeviceKind = /ipad|tablet|kindle|silk/i.test(ua)
    ? 'tablet'
    : /mobi|iphone|android.+mobile|webos/i.test(ua)
      ? 'mobile'
      : 'desktop'

  return { device, browser, os }
}
