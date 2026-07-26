import React from 'react';

type WerseePointsMarkProps = {
  className?: string;
  title?: string;
};

export const WerseePointsMark = ({ className = 'h-6 w-6', title }: WerseePointsMarkProps) => (
  <svg
    viewBox="0 0 32 24"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role={title ? 'img' : undefined}
    aria-hidden={title ? undefined : true}
  >
    {title && <title>{title}</title>}
    <rect x="1.5" y="2.5" width="27" height="19" rx="5" stroke="currentColor" strokeWidth="2.2" />
    <path d="M2.5 8.5h25" stroke="currentColor" strokeWidth="2" opacity=".55" />
    <rect x="5" y="11" width="5.5" height="4.3" rx="1.1" fill="currentColor" opacity=".85" />
    <path d="m13.2 12.2 2.15 5.1 2.05-3.35 2.2 3.35 2.45-5.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m27.7 1 .65 1.65L30 3.3l-1.65.65-.65 1.65-.65-1.65-1.65-.65 1.65-.65L27.7 1Z" fill="currentColor" />
  </svg>
);
