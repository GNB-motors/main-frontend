import { shouldCaptureSpace, isSpaceKey, SPACE_PAN_CURSORS } from './spacePan';

describe('spacePan guards', () => {
  it('captures Space on the page body and plain chrome divs', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    expect(shouldCaptureSpace(document.body)).toBe(true);
    expect(shouldCaptureSpace(div)).toBe(true);
    div.remove();
  });

  it('captures Space on the canvas wrapper (focusable div)', () => {
    const wrap = document.createElement('div');
    wrap.tabIndex = 0;
    document.body.appendChild(wrap);
    expect(shouldCaptureSpace(wrap)).toBe(true);
    wrap.remove();
  });

  it('does NOT capture Space inside inputs, textarea, select', () => {
    for (const tag of ['input', 'textarea', 'select']) {
      const el = document.createElement(tag);
      document.body.appendChild(el);
      expect(shouldCaptureSpace(el)).toBe(false);
      el.remove();
    }
  });

  it('does NOT capture Space on buttons or links (Space activates them)', () => {
    const btn = document.createElement('button');
    const a = document.createElement('a');
    a.href = '#';
    const div = document.createElement('div');
    div.appendChild(btn);
    document.body.appendChild(div);
    document.body.appendChild(a);
    expect(shouldCaptureSpace(btn)).toBe(false);
    expect(shouldCaptureSpace(a)).toBe(false);
    // even from a nested non-interactive child inside a button
    const span = document.createElement('span');
    btn.appendChild(span);
    expect(shouldCaptureSpace(span)).toBe(false);
    div.remove();
    a.remove();
  });

  it('does NOT capture Space in contentEditable regions', () => {
    const ce = document.createElement('div');
    ce.setAttribute('contenteditable', 'true');
    document.body.appendChild(ce);
    expect(shouldCaptureSpace(ce)).toBe(false);
    ce.remove();
  });

  it('is safe against null and non-element targets', () => {
    expect(shouldCaptureSpace(null)).toBe(false);
    expect(shouldCaptureSpace(undefined)).toBe(false);
    expect(shouldCaptureSpace(window)).toBe(false);
  });

  it('recognises the Space key variants and ignores others', () => {
    expect(isSpaceKey(' ')).toBe(true);
    expect(isSpaceKey('Spacebar')).toBe(true);
    expect(isSpaceKey('Space')).toBe(false); // e.key for Space is ' ' (e.code is 'Space')
    expect(isSpaceKey('Enter')).toBe(false);
    expect(isSpaceKey('f')).toBe(false);
  });

  it('cursor phases are grab/grabbing', () => {
    expect(SPACE_PAN_CURSORS.ready).toBe('grab');
    expect(SPACE_PAN_CURSORS.dragging).toBe('grabbing');
  });
});
