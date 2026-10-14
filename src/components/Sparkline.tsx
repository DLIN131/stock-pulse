interface Props {
  values: number[];
  className?: string;
}

export function Sparkline({ values, className }: Props) {
  const data = values.slice(-30);
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${30 - ((v - min) / span) * 28 - 1}`)
    .join(' ');
  return (
    <svg className={`spark ${className ?? ''}`} viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
