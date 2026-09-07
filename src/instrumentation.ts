export function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  try {
    process.noDeprecation = true
  } catch {
    /* en algunos runtimes process.noDeprecation es de solo lectura */
  }
}
