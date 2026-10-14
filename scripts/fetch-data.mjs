// 由 GitHub Actions 定期執行：抓取 Yahoo Finance 資料並輸出成靜態 JSON 快照
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const src = await readFile(new URL('../src/lib/universe.ts', import.meta.url), 'utf8');
const symbols = [
  ...[...src.matchAll(/symbol: '([^']+)'/g)].map((m) => m[1]),
  ...[...src.matchAll(/tw\('(\d+)'/g)].map((m) => `${m[1]}.TW`),
  ...[...src.matchAll(/us\('([A-Z.]+)'/g)].map((m) => m[1]),
];

async function fetchSeries(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=6mo&interval=1d`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`${symbol}: HTTP ${res.status}`);
  const json = await res.json();
  const r = json.chart.result?.[0];
  if (!r?.timestamp) throw new Error(`${symbol}: 無資料`);
  const q = r.indicators.quote[0];
  const timestamps = [];
  const closes = [];
  const volumes = [];
  r.timestamp.forEach((t, i) => {
    if (q.close[i] == null) return;
    timestamps.push(t);
    closes.push(q.close[i]);
    volumes.push(q.volume[i] ?? 0);
  });
  const price = r.meta.regularMarketPrice ?? closes[closes.length - 1];
  closes[closes.length - 1] = price;
  return {
    symbol,
    currency: r.meta.currency,
    price,
    prevClose: closes.length > 1 ? closes[closes.length - 2] : price,
    marketTime: r.meta.regularMarketTime,
    timestamps,
    closes,
    volumes,
  };
}

const series = {};
const errors = [];
let idx = 0;
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (idx < symbols.length) {
      const s = symbols[idx++];
      try {
        series[s] = await fetchSeries(s);
      } catch (e) {
        errors.push(e.message);
      }
    }
  }),
);

console.log(`成功 ${Object.keys(series).length} / ${symbols.length}`);
if (errors.length) console.warn(errors.join('\n'));
if (Object.keys(series).length === 0) process.exit(1);

await mkdir(new URL('../public/data/', import.meta.url), { recursive: true });
await writeFile(
  new URL('../public/data/quotes.json', import.meta.url),
  JSON.stringify({ updatedAt: Date.now(), series, errors }),
);
