import { Children, cloneElement, isValidElement, useEffect, useRef, useState } from 'react';
import SearchableDropdown from './SearchableDropdown';
import { selectOptions } from './dropdownOptions';

function nativeOptions(children) {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    if (child.type === 'option') {
      return Object.hasOwn(child.props, 'value') && child.props.value == null
        ? cloneElement(child, { value: '' })
        : child;
    }
    return child.props.children
      ? cloneElement(child, {}, nativeOptions(child.props.children))
      : child;
  });
}

/** Native form values and events stay intact while the visible picker is shared. */
export default function SearchableSelect({
  children,
  value,
  defaultValue,
  onChange,
  onValueChange,
  className = '',
  style,
  id,
  name,
  disabled,
  required,
  onInvalid,
  ref,
  items: _items,
  ...props
}) {
  const options = selectOptions(children);
  const initial = defaultValue ?? options.find((option) => !option.disabled)?.value ?? '';
  const [localValue, setLocalValue] = useState(initial);
  const [open, setOpen] = useState(false);
  const [validation, setValidation] = useState('');
  const native = useRef(null);
  const trigger = useRef(null);
  const current = value === undefined ? localValue : value;
  const selected =
    options.find((option) => option.value === String(current ?? '')) ||
    (value === undefined ? options.find((option) => !option.disabled) : null);
  useEffect(() => {
    const form = native.current?.form;
    const reset = () =>
      queueMicrotask(() => {
        if (native.current) setLocalValue(native.current.value);
        setValidation('');
      });
    form?.addEventListener('reset', reset);
    return () => form?.removeEventListener('reset', reset);
  }, []);
  const change = (event) => {
    const next = event.target.value;
    setLocalValue(next);
    setValidation('');
    onChange?.(event);
    if (onValueChange) {
      const option = options.find((item) => item.value === next);
      onValueChange(option ? option.rawValue : next);
    }
  };
  return (
    <>
      <SearchableDropdown
        bare
        options={options}
        selectedOption={selected?.name || ''}
        id={id}
        role="combobox"
        name={name}
        value={String(current ?? '')}
        disabled={disabled}
        aria-required={required || undefined}
        aria-invalid={validation ? true : props['aria-invalid']}
        open={open}
        onOpenChange={setOpen}
        triggerRef={trigger}
        triggerClassName={`searchable-select-trigger ${className}`.trim()}
        style={style}
        error={validation || null}
        isOptionSelected={(option) => option.value === selected?.value}
        onSelect={(option) => {
          if (!native.current) return;
          native.current.value = option.value;
          native.current.dispatchEvent(new Event('change', { bubbles: true }));
        }}
        {...props}
      />
      <select
        ref={(node) => {
          native.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        id={id ? `${id}--native` : undefined}
        name={name}
        disabled={disabled}
        required={required}
        value={value === undefined ? undefined : (current ?? '')}
        defaultValue={value === undefined ? initial : undefined}
        onChange={change}
        tabIndex={-1}
        aria-hidden="true"
        style={{ display: 'none' }}
        onInvalid={(event) => {
          onInvalid?.(event);
          event.preventDefault();
          setValidation(event.target.validationMessage);
          setOpen(true);
          trigger.current?.focus();
        }}
      >
        {nativeOptions(children)}
      </select>
    </>
  );
}
