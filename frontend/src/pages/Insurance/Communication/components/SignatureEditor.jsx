import React, { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link2, ChevronDown } from 'lucide-react';
import { PLACEHOLDERS } from '../../insuranceConstants';

// Lightweight in-house rich-text editor (no third-party deps).
// - Formatting via document.execCommand (deprecated but universally supported).
// - Placeholders insert as non-editable chips; serialized back to literal
//   {{Token}} text so stored HTML stays merge-ready, and re-hydrated to chips
//   when an external value loads.
const CHIP_STYLE = `
.ied-chip{display:inline-block;padding:1px 6px;margin:0 1px;border-radius:6px;
  background:#eef2ff;color:#4f46e5;font-family:'JetBrains Mono',ui-monospace,monospace;
  font-size:12px;font-weight:600;white-space:nowrap;}
`;

const chipHtml = (token) =>
  `<span class="ied-chip" contenteditable="false" data-token="${token}">${token}</span>&nbsp;`;

// DOM clone → replace chips with their literal token text → return innerHTML.
function serialize(node) {
  const clone = node.cloneNode(true);
  clone.querySelectorAll('.ied-chip').forEach((chip) => {
    const token = chip.getAttribute('data-token') || chip.textContent;
    chip.replaceWith(document.createTextNode(token));
  });
  return clone.innerHTML;
}

// Literal {{Token}} → chip spans (for editing). Direct string replace is fine:
// tokens only appear in body text in our content.
function hydrate(html) {
  return (html || '').replace(/\{\{(\w+)\}\}/g, (m) => chipHtml(m).trim());
}

export default function SignatureEditor({ value, onChange, placeholder = 'Write here…', minHeight = 160 }) {
  const ref = useRef(null);
  const lastHtml = useRef(null); // last value we emitted — guards cursor resets
  const [menuOpen, setMenuOpen] = useState(false);

  // Load external value (initial + when it changes from outside this editor).
  useEffect(() => {
    if (!ref.current) return;
    if (value !== lastHtml.current) {
      ref.current.innerHTML = hydrate(value);
      lastHtml.current = value;
    }
  }, [value]);

  const emit = () => {
    if (!ref.current) return;
    const html = serialize(ref.current);
    lastHtml.current = html;
    onChange(html);
  };

  // Keep the editor's selection while clicking toolbar buttons.
  const exec = (command, arg = null) => {
    document.execCommand(command, false, arg);
    emit();
  };

  const insertToken = (token) => {
    ref.current?.focus();
    document.execCommand('insertHTML', false, chipHtml(token));
    setMenuOpen(false);
    emit();
  };

  const addLink = () => {
    const url = window.prompt('Link URL', 'https://');
    if (url) exec('createLink', url);
  };

  const Btn = ({ onAction, title, children }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onAction();
      }}
      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
    >
      {children}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 focus-within:border-blue-400">
      <style>{CHIP_STYLE}</style>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50 px-2 py-1">
        <Btn title="Bold" onAction={() => exec('bold')}><Bold size={15} /></Btn>
        <Btn title="Italic" onAction={() => exec('italic')}><Italic size={15} /></Btn>
        <Btn title="Underline" onAction={() => exec('underline')}><Underline size={15} /></Btn>
        <span className="mx-1 h-4 w-px bg-slate-200" />
        <Btn title="Bullet list" onAction={() => exec('insertUnorderedList')}><List size={15} /></Btn>
        <Btn title="Numbered list" onAction={() => exec('insertOrderedList')}><ListOrdered size={15} /></Btn>
        <Btn title="Insert link" onAction={addLink}><Link2 size={15} /></Btn>
        <span className="mx-1 h-4 w-px bg-slate-200" />
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setMenuOpen((o) => !o);
            }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
          >
            + Insert field <ChevronDown size={13} />
          </button>
          {menuOpen && (
            <div className="absolute z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              {PLACEHOLDERS.map((p) => (
                <button
                  key={p.token}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertToken(p.token);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50"
                >
                  {p.label}
                  <span className="ml-1 font-mono text-[10px] text-slate-400">{p.token}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        data-placeholder={placeholder}
        className="ied-area px-3 py-2 text-sm leading-relaxed text-slate-700 outline-none"
        style={{ minHeight }}
      />
      <style>{`.ied-area:empty:before{content:attr(data-placeholder);color:#94a3b8;}`}</style>
    </div>
  );
}
