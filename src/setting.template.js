/* global process */
export default {
  server: `http://localhost:${process.env.VITE_DEV_PORT}${(process.env.PROXY_PATH || '').replace(/\/+$/, '')}/`,
  appUuid: '',
  pageId: '', // create an html page in universal app first
  accountToken: '',
};
