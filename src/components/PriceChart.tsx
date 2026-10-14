import { useMemo, useState } from 'react';
import { sma } from '../lib/analysis';
import { fmtPrice } from '../lib/format';

interface Props {
  timestamps: number[];
  closes: number[];
}

const W = 600;
const H = 240;
const PAD = { t: 12, r: 52, b: 22, l: 8 };

export function PriceChart({ timestamps, closes }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  const geo = useMemo(() => {
    const ma20 = sma(closes, 20);
    const ma60 = sma(closes, 60);
    const all = [...closes, ...ma20.filter(Number.isFinite), ...ma60.filter(Number.isFinite)];
    const min = Math.min(...all);
    const max = Math.max(...all);
    const span = max - min || 1;
    const x = (i: number) => PAD.l + (i / (closes.length - 1)) * (W - PAD.l - PAD.r);
    const y = (v: number) => PAD.t + (1 - (v - min) / span) * (H - PAD.t - PAD.b);
    const path = (arr: number[]) =>
      arr
        .map((v, i) => (Number.isFinite(v) ? `${x(i)},${y(v)}` : null))
        .filter(Boolean)
        .join(' L ');
    const ticks = Array.from({ length: 4 }, (_, k) => min + (span * k) / 3);
    const months: { i: number; label: string }[] = [];
    let lastM = -1;
    timestamps.forEach((t, i) => {
      const m = new Date(t * 1000).getMonth();
      if (m !== lastM) {
        if (lastM !== -1) months.push({ i, label: `${m + 1}月` });
        lastM = m;
      }
    });
    return { x, y, ma20, ma60, ticks, months, close: path(closes), m20: path(ma20), m60: path(ma60) };
  }, [timestamps, closes]);

  const up = closes[closes.length - 1] >= closes[0];
  const area = `M ${geo.close} L ${geo.x(closes.length - 1)},${H - PAD.b} L ${geo.x(0)},${H - PAD.b} Z`;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (closes.length - 1));
    setHover(Math.max(0, Math.min(closes.length - 1, i)));
  };

  const hi = hover ?? closes.length - 1;

  return (
    <div className="chart">
      <div className="chart-legend">
        <span>{new Date(timestamps[hi] * 1000).toLocaleDateString('zh-TW')}</span>
        <span>收盤 <b>{fmtPrice(closes[hi])}</b></span>
        <span className="l-ma20">MA20 {Number.isFinite(geo.ma20[hi]) ? fmtPrice(geo.ma20[hi]) : '—'}</span>
        <span className="l-ma60">MA60 {Number.isFinite(geo.ma60[hi]) ? fmtPrice(geo.ma60[hi]) : '—'}</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={up ? 'up' : 'down'}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label="近六個月股價走勢"
      >
        {geo.ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={geo.y(t)} y2={geo.y(t)} className="grid" />
            <text x={W - PAD.r + 6} y={geo.y(t) + 4} className="axis">{fmtPrice(t)}</text>
          </g>
        ))}
        {geo.months.map((m) => (
          <text key={m.i} x={geo.x(m.i)} y={H - 6} className="axis" textAnchor="middle">{m.label}</text>
        ))}
        <path d={area} className="area" />
        <path d={`M ${geo.m60}`} className="ma60" />
        <path d={`M ${geo.m20}`} className="ma20" />
        <path d={`M ${geo.close}`} className="price" />
        {hover !== null && (
          <g>
            <line x1={geo.x(hi)} x2={geo.x(hi)} y1={PAD.t} y2={H - PAD.b} className="cross" />
            <circle cx={geo.x(hi)} cy={geo.y(closes[hi])} r={4} className="dot" />
          </g>
        )}
      </svg>
    </div>
  );
}
