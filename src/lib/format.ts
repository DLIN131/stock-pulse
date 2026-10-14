export const fmtPrice = (v: number) =>
  v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtPct = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;

export const fmtChange = (v: number) => `${v > 0 ? '+' : ''}${fmtPrice(v)}`;

/** up / down / flat，顏色由 CSS 依據紅漲綠跌設定決定 */
export const dir = (v: number) => (v > 0 ? 'up' : v < 0 ? 'down' : 'flat');

export const fmtTime = (unix: number) =>
  new Date(unix * 1000).toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
