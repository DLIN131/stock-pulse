import type { Analysis } from '../lib/analysis';
import { dir, fmtPct, fmtPrice } from '../lib/format';
import { Sparkline } from './Sparkline';

interface Props {
  picks: Analysis[];
  onSelect: (a: Analysis) => void;
}

export function TopPicks({ picks, onSelect }: Props) {
  return (
    <ol className="picks">
      {picks.map((a, i) => (
        <li key={a.def.symbol}>
          <button className="pick" onClick={() => onSelect(a)}>
            <span className={`rank r${i + 1}`}>{i + 1}</span>
            <div className="pick-head">
              <div className="pick-name">
                <strong>{a.def.name}</strong>
                <span className="muted">
                  <span className={`mk mk-${a.def.market}`}>{a.def.market === 'TW' ? '台' : '美'}</span>
                  {a.def.code} · {a.def.sector}
                </span>
              </div>
              <div className="score-ring" style={{ '--p': a.score } as React.CSSProperties}>
                <span>{a.score}</span>
              </div>
            </div>
            <div className="pick-price">
              <span className="price">{fmtPrice(a.series.price)}</span>
              <span className={`chg ${dir(a.changePct)}`}>{fmtPct(a.changePct)}</span>
              <Sparkline values={a.series.closes} className={dir(a.ret20)} />
            </div>
            <div className="pick-foot">
              <span className={`sig sig-${a.signal}`}>{a.signal}</span>
              <span className="muted reason">{a.reasons[0]}</span>
            </div>
          </button>
        </li>
      ))}
    </ol>
  );
}
