import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Yahoo Finance 不允許瀏覽器跨域呼叫，透過 Vite 代理轉送
const proxy = {
  '/yf': {
    target: 'https://query1.finance.yahoo.com',
    changeOrigin: true,
    rewrite: (p: string) => p.replace(/^\/yf/, ''),
    headers: { 'User-Agent': 'Mozilla/5.0' },
  },
};

export default defineConfig({
  base: './',
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
});
