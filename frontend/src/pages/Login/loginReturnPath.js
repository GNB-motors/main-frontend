// Only return to an app path; never interpret router state as an external URL.
export function resolveLoginReturnPath(requested, fallback) {
  if (
    typeof requested !== 'string' ||
    !requested.startsWith('/') ||
    requested.startsWith('//') ||
    /[\\\s]/.test(requested)
  )
    return fallback;
  const pathname = requested.split(/[?#]/)[0];
  if (pathname === '/login' || pathname === '/onboarding') return fallback;
  return requested;
}
