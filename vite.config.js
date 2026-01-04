import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import eslint from 'vite-plugin-eslint';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getTimestamp = () => {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

const loadLocalSettings = async () => {
  try {
    await fs.promises.access(path.resolve(__dirname, './src/setting.js'));
  } catch (e) {
    console.log(`${getTimestamp()} \x1b[33m[vite]\x1b[0m No local settings file is applied.`);
    return null;
  }
  try {
    const configModule = await import('./src/setting.js');
    return Object.values(configModule)[0];
  } catch (e) {
    console.log(`${getTimestamp()} \x1b[33m[vite]\x1b[0m Load local settings file failed.`);
    return null;
  }
};

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const isDev = mode === 'development';
  let devConfigs = null;
  if (isDev) {
    devConfigs = await loadLocalSettings();
  }

  return {
    base: './',
    root: './src',
    publicDir: '../public',
    build: {
      outDir: '../dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          entryFileNames: '[name]-[hash].js',
          chunkFileNames: '[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.names?.[0]?.endsWith('.css')) {
              return '[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
          // split vendor chunks if has chunk size warning limit
          // manualChunks(id) {
          //   if (id.includes('node_modules')) {
          //     if (id.includes('react') || id.includes('react-dom')) return 'react';
          //     return null;
          //   }
          // }
        },
      },
      assetsInlineLimit: 4 * 1024, // default is 4KB
      chunkSizeWarningLimit: 1000,
    },
    plugins: [
      {
        name: 'inject-html',
        transformIndexHtml(html) {
          return {
            html,
            tags: [
              devConfigs && {
                // for development: inject local settings
                tag: 'script',
                attrs: { type: 'text/javascript' },
                children: `window.__HTML_PAGE_DEV_CONFIG__ = ${JSON.stringify(devConfigs)}`,
                injectTo: 'head',
              }
            ].filter(Boolean),
          };
        },
      },
      eslint({
        cache: false,
        lintOnStart: true,
        emitWarning: true,
        emitError: true,
        failOnError: false,
        include: ['src/**/*.{js,ts,vue,jsx,tsx}'],
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@constants': path.resolve(__dirname, './src/constants'),
        '@utils': path.resolve(__dirname, './src/utils'),
      },
    },
  };
});
