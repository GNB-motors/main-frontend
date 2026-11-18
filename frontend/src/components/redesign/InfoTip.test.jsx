import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import InfoTip from './InfoTip';

const TEXT = 'Live means measured in the last 5 minutes.';
const box = () => document.querySelector('[data-slot="info-tip"]');
// jsdom's synthetic pointer events carry no pointerType: build a real one.
const pointer = (el, type, pointerType) => {
  const ev = new MouseEvent(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'pointerType', { value: pointerType });
  fireEvent(el, ev);
};
const tap = (el) => {
  pointer(el, 'pointerdown', 'touch');
  fireEvent.click(el);
};

describe('InfoTip', () => {
  it('shows a labelled button that explains the number', () => {
    render(<InfoTip text={TEXT} />);
    expect(screen.getByRole('button', { name: 'What is this?' })).toBeInTheDocument();
  });

  it('can carry its own label for screen readers', () => {
    render(<InfoTip text="x" label="What is Live?" />);
    expect(screen.getByRole('button', { name: 'What is Live?' })).toBeInTheDocument();
  });

  it('renders nothing when there is no text to explain', () => {
    const { container } = render(<InfoTip text={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('opens on hover and closes when the pointer leaves', async () => {
    render(<InfoTip text={TEXT} />);
    const trigger = screen.getByRole('button', { name: 'What is this?' });
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    fireEvent.mouseEnter(trigger);
    fireEvent.mouseMove(trigger);
    await waitFor(() => expect(box()).toHaveTextContent(TEXT));
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });
    fireEvent.mouseLeave(trigger);
    await waitFor(() => expect(box()).toBeNull());
  });

  it('opens on keyboard focus and closes on Escape', async () => {
    render(<InfoTip text={TEXT} />);
    const trigger = screen.getByRole('button', { name: 'What is this?' });
    act(() => trigger.focus());
    fireEvent.focus(trigger);
    await waitFor(() => expect(box()).toHaveTextContent(TEXT));
    fireEvent.keyDown(document.activeElement || trigger, { key: 'Escape' });
    await waitFor(() => expect(box()).toBeNull());
  });

  it('a mouse click does not open it', async () => {
    render(<InfoTip text={TEXT} />);
    const trigger = screen.getByRole('button', { name: 'What is this?' });
    pointer(trigger, 'pointerdown', 'mouse');
    fireEvent.click(trigger);
    await new Promise((r) => setTimeout(r, 250));
    expect(box()).toBeNull();
  });

  it('a touch tap toggles it (no hover on a phone)', async () => {
    render(<InfoTip text={TEXT} />);
    const trigger = screen.getByRole('button', { name: 'What is this?' });
    tap(trigger);
    await waitFor(() => expect(box()).toHaveTextContent(TEXT));
    tap(trigger);
    await waitFor(() => expect(box()).toBeNull());
  });

  it('a tap is not undone by the hover and focus a phone emulates after it', async () => {
    render(<InfoTip text={TEXT} />);
    const trigger = screen.getByRole('button', { name: 'What is this?' });
    pointer(trigger, 'pointerenter', 'touch');
    tap(trigger);
    fireEvent.mouseEnter(trigger);
    fireEvent.focus(trigger);
    await new Promise((r) => setTimeout(r, 250));
    expect(box()).toHaveTextContent(TEXT);
  });

  it('lays a long "how we know" out as a headed list with its own text size', async () => {
    render(
      <InfoTip
        text="How we know: AutoTrip (as of 17 Nov); counted by pickup departure; km is the Trips table loaded distance"
        label="How we know: Yesterday's work"
      />,
    );
    const trigger = screen.getByRole('button', { name: "How we know: Yesterday's work" });
    tap(trigger);
    await waitFor(() => expect(box()).not.toBeNull());
    expect(box()).toHaveTextContent("How we know: Yesterday's work");
    const items = box().querySelectorAll('li');
    expect(items).toHaveLength(3);
    // Each text element sets its own size: a page's global `p { font-size }` cannot reach it.
    expect(box().querySelector('p')).toBeNull();
    for (const li of items) expect(li.className).toMatch(/text-\[12\.5px\]/);
  });
});
