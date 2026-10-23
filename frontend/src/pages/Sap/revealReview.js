/** Keep a selected review visible when its detail panel stacks below the table. */
export default function revealReview(id) {
  requestAnimationFrame(() => {
    const detail = document.getElementById(id);
    if (!detail) return;
    const layout = detail.closest('.sap-review-layout');
    const columns = layout && getComputedStyle(layout).gridTemplateColumns;
    if (columns && columns.split(' ').length === 1)
      detail.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
}
