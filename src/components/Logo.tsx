export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="text-primary">
      <g fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="14" y="14" width="36" height="36" rx="3" />
        <rect x="14" y="14" width="36" height="36" rx="3" transform="rotate(45 32 32)" />
        <circle cx="32" cy="32" r="9" />
      </g>
      <circle cx="32" cy="32" r="3.5" fill="currentColor" />
    </svg>
  );
}
