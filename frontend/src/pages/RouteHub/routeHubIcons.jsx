import React from 'react';
import { ICON_PATHS } from './routeHubIconPaths';

export default function Ico({ n, s = 16, className, style }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[n] || '' }}
    />
  );
}
