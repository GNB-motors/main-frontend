/* eslint-disable react-refresh/only-export-components -- test-only module, never hot-reloaded */
import React, { createContext, useContext, useState } from 'react';

/**
 * Light stand-ins for the Base UI Popover and Select (components/ui), for
 * tests only. Opening the real ones in jsdom stalls the event loop for ~15 s
 * in Base UI's focus handling; browsers are unaffected. These keep the same
 * props and roles, so tests still drive what is ours: the trigger, the
 * content, the chosen value.
 *
 *   vi.mock('@/components/ui/popover', () => import('../../test/baseUiStubs').then((m) => m.popover));
 */
const PopoverCtx = createContext({ open: false, setOpen: () => {} });

function Popover({ children }) {
  const [open, setOpen] = useState(false);
  return <PopoverCtx.Provider value={{ open, setOpen }}>{children}</PopoverCtx.Provider>;
}
function PopoverTrigger({ children, ...props }) {
  const { open, setOpen } = useContext(PopoverCtx);
  return (
    <button type="button" {...props} aria-expanded={open} onClick={() => setOpen(!open)}>
      {children}
    </button>
  );
}
function PopoverContent({ children }) {
  const { open } = useContext(PopoverCtx);
  return open ? <div role="dialog">{children}</div> : null;
}
const Pass = ({ children }) => <div>{children}</div>;

export const popover = {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader: Pass,
  PopoverTitle: Pass,
  PopoverDescription: Pass,
};

const SelectCtx = createContext({ value: '', onValueChange: () => {} });

function Select({ value, onValueChange, children }) {
  return <SelectCtx.Provider value={{ value, onValueChange }}>{children}</SelectCtx.Provider>;
}
function SelectTrigger({ id }) {
  const { value, onValueChange } = useContext(SelectCtx);
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      data-testid="stub-select"
    >
      <option value="">Choose</option>
    </select>
  );
}
const Nothing = () => null;
function SelectContent({ children }) {
  return <div role="listbox">{children}</div>;
}
function SelectItem({ value, children }) {
  const { onValueChange } = useContext(SelectCtx);
  return (
    <div
      role="option"
      aria-selected={false}
      tabIndex={-1}
      onClick={() => onValueChange(value)}
      onKeyDown={() => {}}
    >
      {children}
    </div>
  );
}

export const select = {
  Select,
  SelectTrigger,
  SelectValue: Nothing,
  SelectContent,
  SelectItem,
};
