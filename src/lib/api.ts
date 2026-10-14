export interface Series {
  symbol: string;
  currency: string;
  price: number;
  prevClose: number;
  marketTime: number;
  timestamps: number[];
  closes: number[];
  volumes: number[];
}

interface ChartResponse {
  chart: {
    result?: {
      meta: { currency: string; regularMarketPrice: number; regularMarketTime: number };
      timestamp?: number[];
      indicators: { quote: { close: (number | null)[]; volume: (number | null)[] }[] };
    }[];
    error?: { description: string } | null;
  };
}

export async function fetchSeries(symbol: string, range = '6mo'): Promise<Series> {
  const url = `/yf/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${symbol}: HTTP ${res.status}`);
  const json = (await res.json()) as ChartResponse;
  const r = json.chart.result?.[0];
  if (!r || !r.timestamp) throw new Error(json.chart.error?.description ?? `${symbol}: 無資料`);

  const q = r.indicators.quote[0];
  const timestamps: number[] = [];
  const closes: number[] = [];
  const volumes: number[] = [];
  r.timestamp.forEach((t, i) => {
    const c = q.close[i];
    if (c == null) return;
    timestamps.push(t);
    closes.push(c);
    volumes.push(q.volume[i] ?? 0);
  });

  const price = r.meta.regularMarketPrice ?? closes[closes.length - 1];
  // 最後一根 K 棒即為今日，前一根收盤為昨收
  closes[closes.length - 1] = price;
  const prevClose = closes.length > 1 ? closes[closes.length - 2] : price;

  return {
    symbol,
    currency: r.meta.currency,
    price,
    prevClose,
    marketTime: r.meta.regularMarketTime,
    timestamps,
    closes,
    volumes,
  };
}

export interface FetchResult {
  data: Map<string, Series>;
  errors: string[];
  /** 資料快照時間（ms）；開發模式直接抓即時資料時為現在 */
  asOf: number;
}

/**
 * 正式站（GitHub Pages）沒有後端可代理 Yahoo，改讀 GitHub Actions 定期產生的快照；
 * 開發模式則透過 Vite 代理即時抓取。
 */
export async function fetchMany(symbols: string[]): Promise<FetchResult> {
  if (import.meta.env.PROD) return fetchSnapshot(symbols);
  return { ...(await fetchLive(symbols)), asOf: Date.now() };
}

async function fetchSnapshot(symbols: string[]): Promise<FetchResult> {
  const res = await fetch(`./data/quotes.json?t=${Date.now()}`);
  if (!res.ok) return { data: new Map(), errors: [`快照讀取失敗 HTTP ${res.status}`], asOf: Date.now() };
  const snap = (await res.json()) as { updatedAt: number; series: Record<string, Series>; errors: string[] };
  const data = new Map(symbols.flatMap((s) => (snap.series[s] ? [[s, snap.series[s]] as const] : [])));
  return { data, errors: snap.errors, asOf: snap.updatedAt };
}

/** 以有限併發抓取，避免同時打太多請求 */
async function fetchLive(symbols: string[], concurrency = 8) {
  const out = new Map<string, Series>();
  const errors: string[] = [];
  let idx = 0;
  const worker = async () => {
    while (idx < symbols.length) {
      const s = symbols[idx++];
      try {
        out.set(s, await fetchSeries(s));
      } catch (e) {
        errors.push((e as Error).message);
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return { data: out, errors };
}
