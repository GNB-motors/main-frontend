import { fireEvent, screen, within } from '@testing-library/react';

/** Change a field through its visible control, including searchable dropdowns. */
export function changeField(control, init) {
  if (control.tagName !== 'BUTTON' || control.getAttribute('role') !== 'combobox') {
    return fireEvent.change(control, init);
  }
  const native =
    (control.id && document.getElementById(`${control.id}--native`)) || control.nextElementSibling;
  if (native?.tagName !== 'SELECT') throw new Error('Expected a form dropdown');
  const option = Array.from(native.options).find(
    (item) => item.value === String(init.target.value),
  );
  if (!option) throw new Error(`No option with value ${init.target.value}`);
  if (control.getAttribute('aria-expanded') !== 'true') fireEvent.click(control);
  const list = screen.getByRole('listbox');
  const label = option.textContent.replace(/\s+/g, ' ').trim();
  fireEvent.click(within(list).getByRole('option', { name: label }));
}
