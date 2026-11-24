/** Keep only an app-local destination from the signed-out route guard. */
export function loginReturnTo(path) {
  if (
    typeof path !== 'string' ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('\\') ||
    [...path].some((char) => char.charCodeAt(0) <= 32)
  )
    return null;
  const { pathname } = new URL(path, 'https://app.invalid');
  return pathname.startsWith('//') || /^\/(?:login|logout|superadmin)(?:\/|$)/i.test(pathname)
    ? null
    : path;
}
