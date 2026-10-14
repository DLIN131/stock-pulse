import type { Series } from './api';
import type { StockDef } from './universe';

export type Signal = '強力看多' | '偏多' | '中性' | '偏空';

export interface Analysis {
  def: StockDef;
  series: Series;
  change: number;
  changePct: number;
  ma20: number;
  ma60: number;
  rsi: number;
  macdHist: number;
  ret20: number;
  volRatio: number;
  score: number;
  breakdown: { label: string; value: number; max: number }[];
  signal: Signal;
  reasons: string[];
}

const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function sma(values: number[], n: number): number[] {
  return values.map((_, i) => (i < n - 1 ? NaN : avg(values.slice(i - n + 1, i + 1))));
}

function ema(values: number[], n: number): number[] {
  const k = 2 / (n + 1);
  const out: number[] = [];
  values.forEach((v, i) => out.push(i === 0 ? v : v * k + out[i - 1] * (1 - k)));
  return out;
}

function rsi(closes: number[], n = 14): number {
  if (closes.length <= n) return 50;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= n; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gain += d;
    else loss -= d;
  }
  gain /= n;
  loss /= n;
  for (let i = n + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gain = (gain * (n - 1) + Math.max(d, 0)) / n;
    loss = (loss * (n - 1) + Math.max(-d, 0)) / n;
  }
  if (loss === 0) return 100;
  return 100 - 100 / (1 + gain / loss);
}

export function analyze(def: StockDef, series: Series): Analysis {
  const c = series.closes;
  const last = c.length - 1;
  const price = series.price;

  const ma20s = sma(c, 20);
  const ma20 = ma20s[last];
  const ma20Prev = ma20s[Math.max(0, last - 5)];
  const ma60 = c.length >= 60 ? avg(c.slice(-60)) : avg(c);

  const r = rsi(c);
  const ema26 = ema(c, 26);
  const macdLine = ema(c, 12).map((v, i) => v - ema26[i]);
  const signalLine = ema(macdLine, 9);
  const hist = macdLine.map((v, i) => v - signalLine[i]);
  const macdHist = hist[last];
  const histPrev = hist[last - 1] ?? macdHist;

  const ret20 = c.length > 20 ? (price / c[last - 20] - 1) * 100 : 0;
  const v = series.volumes;
  const volRatio = avg(v.slice(-5)) / (avg(v.slice(-20)) || 1);

  // 趨勢 30
  let trend = 0;
  if (price > ma20) trend += 10;
  if (ma20 > ma60) trend += 10;
  if (ma20 > ma20Prev) trend += 10;
  // 動能 25：20 日報酬 -10%→0 分、+20%→滿分
  const momentum = clamp(((ret20 + 10) / 30) * 25, 0, 25);
  // RSI 20：58 附近最佳，過熱或過冷扣分
  const rsiScore = clamp(20 - Math.abs(r - 58) * 0.6, 0, 20);
  // MACD 15
  const macdScore = (macdHist > 0 ? 8 : 0) + (macdHist > histPrev ? 7 : 0);
  // 量能 10
  const volScore = clamp(((volRatio - 0.8) / 0.7) * 10, 0, 10);

  const score = Math.round(trend + momentum + rsiScore + macdScore + volScore);

  const reasons: string[] = [];
  if (price > ma20 && ma20 > ma60) reasons.push('站上月線且均線多頭排列');
  else if (price < ma20 && ma20 < ma60) reasons.push('跌破月線、均線空頭排列');
  if (macdHist > 0 && macdHist > histPrev) reasons.push('MACD 柱狀體擴大');
  else if (macdHist < 0 && macdHist < histPrev) reasons.push('MACD 空方動能增強');
  if (r > 75) reasons.push(`RSI ${r.toFixed(0)} 過熱，留意回檔`);
  else if (r < 30) reasons.push(`RSI ${r.toFixed(0)} 超賣`);
  if (volRatio > 1.4) reasons.push(`近 5 日量能放大 ${volRatio.toFixed(1)} 倍`);
  if (ret20 > 10) reasons.push(`20 日漲幅 ${ret20.toFixed(1)}%`);
  if (reasons.length === 0) reasons.push('技術面無明顯方向');

  const signal: Signal = score >= 72 ? '強力看多' : score >= 56 ? '偏多' : score >= 40 ? '中性' : '偏空';

  return {
    def,
    series,
    change: price - series.prevClose,
    changePct: (price / series.prevClose - 1) * 100,
    ma20,
    ma60,
    rsi: r,
    macdHist,
    ret20,
    volRatio,
    score,
    breakdown: [
      { label: '趨勢', value: trend, max: 30 },
      { label: '動能', value: momentum, max: 25 },
      { label: 'RSI', value: rsiScore, max: 20 },
      { label: 'MACD', value: macdScore, max: 15 },
      { label: '量能', value: volScore, max: 10 },
    ],
    signal,
    reasons,
  };
}
