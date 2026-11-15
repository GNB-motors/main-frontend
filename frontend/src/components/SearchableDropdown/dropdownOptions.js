import { Children, Fragment, isValidElement } from 'react';

export function optionText(value) {
  if (value == null || typeof value === 'boolean') return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(optionText).join('');
  return isValidElement(value) ? optionText(value.props.children) : '';
}
export const optionLabel = (option) =>
  typeof option === 'object' && option !== null
    ? optionText(option.name ?? option.label ?? option.value)
    : String(option ?? '');
export const optionKey = (option) =>
  String(option?.value ?? option?.id ?? option?._id ?? optionLabel(option));
export const optionDisabled = (option) => Boolean(option?.disabled);

export function selectOptions(children, group = '', disabled = false) {
  const options = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const props = child.props;
    if (child.type === Fragment) options.push(...selectOptions(props.children, group, disabled));
    else if (child.type === 'optgroup')
      options.push(...selectOptions(props.children, props.label, disabled || props.disabled));
    else if (child.type === 'option')
      options.push({
        value: String(
          Object.hasOwn(props, 'value') ? (props.value ?? '') : optionText(props.children),
        ),
        rawValue: Object.hasOwn(props, 'value') ? props.value : optionText(props.children),
        name: props.label || optionText(props.children),
        group,
        disabled: Boolean(disabled || props.disabled),
      });
  });
  return options;
}
