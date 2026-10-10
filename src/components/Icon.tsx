// The few symbols the design uses (spec §11), as inline SVG so they never
// depend on a fallback font. Always decorative: the text next to them says
// what they mean.

const PATHS = {
  check: (
    <path
      d="M5.5 10.5l3 3 6-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  cross: (
    <path
      d="M6.5 6.5l7 7M13.5 6.5l-7 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  ),
  bang: (
    <path
      d="M10 5v6.5M10 14.5v.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  ),
  diamond: <path d="M10 3l7 7-7 7-7-7z" fill="currentColor" />,
  diamondOutline: (
    <path
      d="M10 3l7 7-7 7-7-7z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  ),
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
