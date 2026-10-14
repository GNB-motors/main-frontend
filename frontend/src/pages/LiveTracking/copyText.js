// Clipboard access can be missing (insecure origin) or refused; callers report either way.
const copyText = (text) =>
  navigator.clipboard?.writeText(text) ?? Promise.reject(new Error('Clipboard unavailable'));

export default copyText;
