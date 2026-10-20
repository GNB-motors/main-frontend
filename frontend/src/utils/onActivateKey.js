// An element that can't be a <button> (a <tr>, a card wrapping other buttons)
// but acts like one gets role="button" and tabIndex={0}; this makes Enter and
// Space activate it, as they would a real button.
export function onActivateKey(activate) {
  return (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate(e);
    }
  };
}
