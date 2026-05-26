import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

function stripCssLayersPlugin(): import('vite').Plugin {
  return {
    name: 'strip-css-layers',
    enforce: 'post',
    generateBundle(_, bundle) {
      for (const [name, chunk] of Object.entries(bundle)) {
        if (name.endsWith('.css') && chunk.type === 'asset') {
          let css = chunk.source as string;
          css = removeLayerBlocks(css);
          chunk.source = css;
        }
      }
    },
  };
}

function removeLayerBlocks(css: string): string {
  const result: string[] = [];
  let i = 0;
  while (i < css.length) {
    const layerMatch = css.slice(i).match(/^@layer\s+\w*\s*\{/);
    if (layerMatch) {
      const start = i + layerMatch[0].length;
      const end = findMatchingBrace(css, start);
      if (end !== -1) {
        result.push(css.slice(start, end));
        i = end + 1;
        continue;
      }
    }
    result.push(css[i]);
    i++;
  }
  return result.join('');
}

function findMatchingBrace(css: string, from: number): number {
  let depth = 1;
  let inString = false;
  let stringChar = '';
  for (let i = from; i < css.length; i++) {
    const ch = css[i];
    if (inString) {
      if (ch === stringChar && css[i - 1] !== '\\') inString = false;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), stripCssLayersPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    cssMinify: 'light',
  },
})
