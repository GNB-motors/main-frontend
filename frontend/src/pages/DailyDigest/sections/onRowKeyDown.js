// A <tr> can't become a <button>, so clickable rows (role="button") need this
// to be keyboard-reachable — Enter/Space activate it like a real button would.
export function onRowKeyDown(activate) {
  return (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate();
    }
  };
}
