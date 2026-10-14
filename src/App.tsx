import { useCallback, useEffect, useMemo, useState } from 'react';
import { analyze, type Analysis } from './lib/analysis';
import { fetchMany, type Series } from './lib/api';
import { dir, fmtPct, fmtPrice } from './lib/format';
import { INDICES, UNIVERSE, type Market } from './lib/universe';
import { StockDetail } from './components/StockDetail';
import { StockTable } from './components/StockTable';
import { TopPicks } from './components/TopPicks';

type Filter = 'ALL' | Market;
const REFRESH_SEC = 60;

const load = <T,>(k: string, d: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : d;
  } catch {
    return d;
  }
};
const save = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* 私密模式等情況忽略 */
  }
};

export default function App() {
  const [series, setSeries] = useState<Map<string, Series>>(new Map());
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_SEC);
  const [filter, setFilter] = useState<Filter>(() => load('sp.filter', 'ALL'));
  const [redUp, setRedUp] = useState<boolean>(() => load('sp.redUp', true));
  const [auto, setAuto] = useState<boolean>(() => load('sp.auto', true));
  const [selected, setSelected] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const symbols = [...INDICES.map((i) => i.symbol), ...UNIVERSE.map((s) => s.symbol)];
    const { data, errors, asOf } = await fetchMany(symbols);
    setSeries(data);
    setErrors(errors);
    setUpdatedAt(new Date(asOf));
    setCountdown(REFRESH_SEC);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [auto]);

  useEffect(() => {
    if (auto && countdown === 0 && !loading) refresh();
  }, [auto, countdown, loading, refresh]);

  useEffect(() => save('sp.filter', filter), [filter]);
  useEffect(() => save('sp.redUp', redUp), [redUp]);
  useEffect(() => save('sp.auto', auto), [auto]);

  const analyses = useMemo(
    () =>
      UNIVERSE.flatMap((def) => {
        const s = series.get(def.symbol);
        return s && s.closes.length > 30 ? [analyze(def, s)] : [];
      }),
    [series],
  );

  const visible = useMemo(
    () => (filter === 'ALL' ? analyses : analyses.filter((a) => a.def.market === filter)),
    [analyses, filter],
  );
  const top10 = useMemo(() => [...visible].sort((a, b) => b.score - a.score).slice(0, 10), [visible]);

  const breadth = useMemo(() => {
    const up = visible.filter((a) => a.changePct > 0).length;
    const avgScore = visible.reduce((s, a) => s + a.score, 0) / (visible.length || 1);
    return { up, down: visible.length - up, avgScore };
  }, [visible]);

  const selectedA: Analysis | undefined = analyses.find((a) => a.def.symbol === selected);

  return (
    <div className={`app ${redUp ? 'red-up' : 'green-up'}`}>
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>
            <svg viewBox="0 0 24 24"><path d="M3 17l5-6 4 3 7-9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <div>
            <h1>StockPulse</h1>
            <p className="muted">台股 · 美股 即時技術分析</p>
          </div>
        </div>
        <div className="controls">
          <div className="seg" role="tablist" aria-label="市場">
            {(['ALL', 'TW', 'US'] as Filter[]).map((f) => (
              <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
                {f === 'ALL' ? '全部' : f === 'TW' ? '台股' : '美股'}
              </button>
            ))}
          </div>
          <button className="ghost" onClick={() => setRedUp((v) => !v)} title="切換漲跌顏色">
            {redUp ? '紅漲綠跌' : '綠漲紅跌'}
          </button>
          <button className={`ghost ${auto ? 'live' : ''}`} onClick={() => setAuto((v) => !v)}>
            <span className="dot" />
            {auto ? `自動 ${countdown}s` : '已暫停'}
          </button>
          <button className="primary" onClick={refresh} disabled={loading}>
            {loading ? '更新中…' : '立即更新'}
          </button>
        </div>
      </header>

      <section className="indices">
        {INDICES.map((ix) => {
          const s = series.get(ix.symbol);
          const pct = s ? (s.price / s.prevClose - 1) * 100 : 0;
          return (
            <div key={ix.symbol} className="index-card">
              <span className="muted">{ix.name}</span>
              <strong>{s ? fmtPrice(s.price) : '—'}</strong>
              <span className={`chg ${dir(pct)}`}>{s ? fmtPct(pct) : ''}</span>
            </div>
          );
        })}
        <div className="index-card">
          <span className="muted">漲 / 跌家數</span>
          <strong>
            <span className="chg up">{breadth.up}</span> / <span className="chg down">{breadth.down}</span>
          </strong>
          <span className="muted">平均評分 {breadth.avgScore.toFixed(0)}</span>
        </div>
      </section>

      {errors.length > 0 && (
        <p className="warn">
          {errors.length} 檔資料讀取失敗（{errors.slice(0, 3).join('、')}
          {errors.length > 3 ? '…' : ''}）
        </p>
      )}

      <main>
        <section>
          <div className="section-head">
            <h2>前 10 大推薦股</h2>
            <span className="muted">依技術面綜合評分排序 · {updatedAt ? `資料時間 ${updatedAt.toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}` : '載入中'}</span>
          </div>
          {loading && analyses.length === 0 ? (
            <div className="picks skeleton">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="pick sk" />
              ))}
            </div>
          ) : (
            <TopPicks picks={top10} onSelect={(a) => setSelected(a.def.symbol)} />
          )}
        </section>

        <section>
          <div className="section-head">
            <h2>全部觀察名單</h2>
            <span className="muted">{visible.length} 檔 · 點擊查看詳細分析</span>
          </div>
          <StockTable rows={visible} onSelect={(a) => setSelected(a.def.symbol)} />
        </section>
      </main>

      <footer>
        <p>
          評分模型：趨勢 30 · 動能 25 · RSI 20 · MACD 15 · 量能 10，滿分 100。資料來源 Yahoo Finance，網站版資料於交易時段每 10～15 分鐘更新一次，台股報價另有約 20 分鐘延遲。
        </p>
        <p>本站內容僅為技術指標的程式化計算結果，不構成任何投資建議；投資有風險，請自行判斷。</p>
      </footer>

      {selectedA && <StockDetail a={selectedA} onClose={() => setSelected(null)} />}
    </div>
  );
}
