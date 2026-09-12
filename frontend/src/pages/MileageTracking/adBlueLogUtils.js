/** Pure validation for the AdBlue receipt upload (rule 21). */
export function validateImageFile(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  return (
    validTypes.includes(file.type) &&
    validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext)) &&
    file.size <= 10 * 1024 * 1024
  );
}
