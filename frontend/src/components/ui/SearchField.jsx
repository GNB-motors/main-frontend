import { createElement } from 'react';

/** The rounded search container owns focus; its input stays visually borderless. */
export default function SearchField({ as = 'div', children, ...props }) {
  return createElement(as, { ...props, 'data-search-field': '' }, children);
}
