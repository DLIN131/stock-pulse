import { useMemo, useState } from 'react';
import type { Analysis } from '../lib/analysis';
import { dir, fmtPct, fmtPrice } from '../lib/format';
import { Sparkline } from './Sparkline';

type Key = 'score' | 'changePct' | 'ret20' | 'rsi' | 'volRatio' | 'name';

const COLS: { key: Key; label: string; num?: boolean }[] = [
  { key: 'name', label: '股票' },
  { key: 'changePct', label: '漲跌幅', num: true },
  { key: 'ret20', label: '20日報酬', num: true },
  { key: 'rsi', label: 'RSI', num: true },
  { key: 'volRatio', label: '量比', num: true },
  { key: 'score', label: '評分', num: true },
];

interface Props {
  rows: Analysis[];
  onSelect: (a: Analysis) => void;
}

export function StockTable({ rows, onSelect }: Props) {
  const [sort, setSort] = useState<{ key: Key; asc: boolean }>({ key: 'score', asc: false });
  const [q, setQ] = useState('');

  const sorted = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const list = rows.filter(
      (a) => !kw || a.def.name.toLowerCase().includes(kw) || a.def.code.toLowerCase().includes(kw) || a.def.sector.includes(kw),
    );
    const val = (a: Analysis) => (sort.key === 'name' ? a.def.code : a[sort.key]);
    return list.sort((a, b) => {
      const x = val(a);
      const y = val(b);
      const r = typeof x === 'string' ? x.localeCompare(y as string) : x - (y as number);
      return sort.asc ? r : -r;
    });
  }, [rows, sort, q]);

  const toggle = (key: Key) => setSort((s) => ({ key, asc: s.key === key ? !s.asc : key === 'name' }));

  return (
    <div className="table-wrap">
      <input
        className="search"
        type="search"
        placeholder="搜尋代號、名稱或產業…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="sort-chips" role="group" aria-label="排序">
        {COLS.map((c) => (
          <button key={c.key} className={sort.key === c.key ? 'on' : ''} onClick={() => toggle(c.key)}>
            {c.label}
            {sort.key === c.key ? (sort.asc ? ' ↑' : ' ↓') : ''}
          </button>
        ))}
      </div>
      <table className="stocks">
        <thead>
          <tr>
            {COLS.map((c) => (
              <th key={c.key} className={c.num ? 'num' : ''} aria-sort={sort.key === c.key ? (sort.asc ? 'ascending' : 'descending') : 'none'}>
                <button onClick={() => toggle(c.key)}>
                  {c.label}
                  {sort.key === c.key ? (sort.asc ? ' ↑' : ' ↓') : ''}
                </button>
              </th>
            ))}
            <th className="num">價格 / 走勢</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => (
            <tr key={a.def.symbol} onClick={() => onSelect(a)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelect(a)}>
              <td className="name-cell">
                <span className={`mk mk-${a.def.market}`}>{a.def.market === 'TW' ? '台' : '美'}</span>
                <div>
                  <strong>{a.def.name}</strong>
                  <span className="muted">{a.def.code} · {a.def.sector}</span>
                </div>
              </td>
              <td className={`num chg ${dir(a.changePct)}`} data-label="漲跌幅">{fmtPct(a.changePct)}</td>
              <td className={`num chg ${dir(a.ret20)}`} data-label="20日報酬">{fmtPct(a.ret20)}</td>
              <td className="num" data-label="RSI">{a.rsi.toFixed(0)}</td>
              <td className="num" data-label="量比">{a.volRatio.toFixed(2)}</td>
              <td className="num" data-label="評分">
                <span className={`sig sig-${a.signal}`}>{a.score}</span>
              </td>
              <td className="num price-cell">
                <span>{fmtPrice(a.series.price)}</span>
                <Sparkline values={a.series.closes} className={dir(a.ret20)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && <p className="empty">找不到符合的股票</p>}
    </div>
  );
}
