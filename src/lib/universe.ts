export type Market = 'TW' | 'US';

export interface StockDef {
  symbol: string;
  code: string;
  name: string;
  market: Market;
  sector: string;
}

const tw = (code: string, name: string, sector: string): StockDef => ({
  symbol: `${code}.TW`,
  code,
  name,
  market: 'TW',
  sector,
});

const us = (code: string, name: string, sector: string): StockDef => ({
  symbol: code,
  code,
  name,
  market: 'US',
  sector,
});

export const UNIVERSE: StockDef[] = [
  tw('2330', '台積電', '半導體'),
  tw('2317', '鴻海', '電子代工'),
  tw('2454', '聯發科', '半導體'),
  tw('2308', '台達電', '電子零組件'),
  tw('2382', '廣達', '電腦週邊'),
  tw('3231', '緯創', '電腦週邊'),
  tw('6669', '緯穎', '電腦週邊'),
  tw('2345', '智邦', '網通'),
  tw('3711', '日月光投控', '半導體'),
  tw('2303', '聯電', '半導體'),
  tw('2357', '華碩', '電腦週邊'),
  tw('3008', '大立光', '光學'),
  tw('2412', '中華電', '電信'),
  tw('2881', '富邦金', '金融'),
  tw('2882', '國泰金', '金融'),
  tw('2891', '中信金', '金融'),
  tw('2886', '兆豐金', '金融'),
  tw('2603', '長榮', '航運'),
  tw('1301', '台塑', '塑化'),
  tw('2002', '中鋼', '鋼鐵'),
  us('NVDA', 'NVIDIA', '半導體'),
  us('AAPL', 'Apple', '科技硬體'),
  us('MSFT', 'Microsoft', '軟體'),
  us('GOOGL', 'Alphabet', '網路服務'),
  us('AMZN', 'Amazon', '電商/雲端'),
  us('META', 'Meta', '網路服務'),
  us('TSLA', 'Tesla', '電動車'),
  us('AVGO', 'Broadcom', '半導體'),
  us('AMD', 'AMD', '半導體'),
  us('TSM', '台積電 ADR', '半導體'),
  us('NFLX', 'Netflix', '串流媒體'),
  us('ORCL', 'Oracle', '軟體'),
  us('PLTR', 'Palantir', '軟體'),
  us('JPM', 'JPMorgan', '金融'),
  us('V', 'Visa', '金融'),
  us('LLY', 'Eli Lilly', '醫藥'),
  us('UNH', 'UnitedHealth', '醫療保險'),
  us('COST', 'Costco', '零售'),
  us('WMT', 'Walmart', '零售'),
  us('XOM', 'Exxon Mobil', '能源'),
];

export const INDICES = [
  { symbol: '^TWII', name: '台灣加權指數', market: 'TW' as Market },
  { symbol: '^GSPC', name: 'S&P 500', market: 'US' as Market },
  { symbol: '^IXIC', name: '那斯達克', market: 'US' as Market },
  { symbol: '^DJI', name: '道瓊工業', market: 'US' as Market },
];
