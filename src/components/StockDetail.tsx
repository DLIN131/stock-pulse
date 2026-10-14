import { useEffect } from 'react';
import type { Analysis } from '../lib/analysis';
import { dir, fmtChange, fmtPct, fmtPrice, fmtTime } from '../lib/format';
import { PriceChart } from './PriceChart';

interface Props {
  a: Analysis;
  onClose: () => void;
}

export function StockDetail({ a, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const s = a.series;
  const stats = [
    { k: 'MA20', v: fmtPrice(a.ma20) },
    { k: 'MA60', v: fmtPrice(a.ma60) },
    { k: 'RSI(14)', v: a.rsi.toFixed(1) },
    { k: 'MACD 柱', v: a.macdHist.toFixed(2) },
    { k: '20日報酬', v: fmtPct(a.ret20) },
    { k: '5/20日量比', v: a.volRatio.toFixed(2) },
  ];

  return (
    <div className="overlay" onClick={onClose}>
      <aside className="detail" role="dialog" aria-modal="true" aria-label={`${a.def.name} 詳細分析`} onClick={(e) => e.stopPropagation()}>
        <header className="detail-head">
          <div>
            <h2>
              {a.def.name} <span className="muted">{a.def.code}</span>
            </h2>
            <p className="muted">
              {a.def.market === 'TW' ? '台股' : '美股'} · {a.def.sector} · 更新 {fmtTime(s.marketTime)}
            </p>
          </div>
          <button className="close" onClick={onClose} aria-label="關閉">✕</button>
        </header>

        <div className="detail-price">
          <span className="big">{fmtPrice(s.price)}</span>
          <span className="muted">{s.currency}</span>
          <span className={`chg ${dir(a.change)}`}>
            {fmtChange(a.change)} ({fmtPct(a.changePct)})
          </span>
        </div>

        <PriceChart timestamps={s.timestamps} closes={s.closes} />

        <section className="score-box">
          <div className="score-total">
            <div className="score-ring lg" style={{ '--p': a.score } as React.CSSProperties}>
              <span>{a.score}</span>
            </div>
            <div>
              <span className={`sig sig-${a.signal}`}>{a.signal}</span>
              <ul className="reasons">
                {a.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="bars">
            {a.breakdown.map((b) => (
              <div key={b.label} className="bar">
                <span>{b.label}</span>
                <div className="track">
                  <div className="fill" style={{ width: `${(b.value / b.max) * 100}%` }} />
                </div>
                <span className="muted">
                  {b.value.toFixed(0)}/{b.max}
                </span>
              </div>
            ))}
          </div>
        </section>

        <dl className="stats">
          {stats.map((x) => (
            <div key={x.k}>
              <dt>{x.k}</dt>
              <dd>{x.v}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}
