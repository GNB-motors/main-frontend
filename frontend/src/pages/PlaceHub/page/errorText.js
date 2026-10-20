export default function errorText(err, fallback) {
  return err?.displayMessage || err?.response?.data?.message || err?.message || fallback;
}
