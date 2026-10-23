import { onRequest, onRequestPost } from './functions/api/offers/analyze.js';

const ANALYZE_PATH = '/api/offers/analyze';

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === ANALYZE_PATH) {
      if (request.method === 'POST') return onRequestPost({ request });
      return onRequest({ request });
    }

    return env.ASSETS.fetch(request);
  },
};
