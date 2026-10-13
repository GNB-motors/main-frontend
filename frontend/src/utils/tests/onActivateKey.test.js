import { describe, it, expect, vi } from 'vitest';
import { onActivateKey } from '../onActivateKey';

const key = (k) => ({ key: k, preventDefault: vi.fn() });

describe('onActivateKey', () => {
  it('activates on Enter and Space, and stops Space from scrolling', () => {
    const activate = vi.fn();
    const space = key(' ');
    onActivateKey(activate)(key('Enter'));
    onActivateKey(activate)(space);
    expect(activate).toHaveBeenCalledTimes(2);
    expect(space.preventDefault).toHaveBeenCalled();
  });

  it('ignores other keys', () => {
    const activate = vi.fn();
    onActivateKey(activate)(key('Tab'));
    expect(activate).not.toHaveBeenCalled();
  });
});
