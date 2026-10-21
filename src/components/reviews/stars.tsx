/** Five stars, filled up to `rating`. The drawing is hidden from screen readers; the label says it in words. */
export function Stars({
  rating,
  label,
  size = 18,
}: {
  rating: number;
  label: string;
  size?: number;
}) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <linearGradient id={`star-${i}-${fill}`}>
                <stop offset={`${fill * 100}%`} stopColor="currentColor" />
                <stop offset={`${fill * 100}%`} stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d="m12 2.8 2.8 5.7 6.3.9-4.5 4.4 1 6.3L12 17.2l-5.6 2.9 1-6.3L3 9.4l6.3-.9L12 2.8Z"
              fill={`url(#star-${i}-${fill})`}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </span>
  );
}
