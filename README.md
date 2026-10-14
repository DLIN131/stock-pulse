# StockPulse 台美股即時分析

React + Vite 製作的台股、美股技術分析儀表板，依趨勢、動能、RSI、MACD、量能綜合評分，列出前 10 大推薦股。支援 RWD 與深色模式。

**線上版：** https://dlin131.github.io/stock-pulse/

## 本機開發

```bash
npm install
npm run dev
```

開發模式透過 Vite 代理直接抓取 Yahoo Finance 即時資料。

## 部署

GitHub Pages 為純靜態網站，因此由 GitHub Actions（`.github/workflows/deploy.yml`）於交易時段每 15 分鐘執行 `scripts/fetch-data.mjs` 抓取資料、產生 `data/quotes.json` 快照並重新部署。

> 本站內容僅為技術指標的程式化計算結果，不構成任何投資建議。
