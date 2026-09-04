export function slugifyTitle(title: string) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function skuFromTitle(title: string) {
  const base = slugifyTitle(title).replace(/-/g, '').toUpperCase().slice(0, 12)
  return `KAP-${base || 'PROD'}`
}
