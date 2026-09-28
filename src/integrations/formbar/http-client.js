/**
 * Formbar HTTP API client. Server-side only. Never expose API keys to browsers.
 * Retries GET/HEAD only. Logs never include secrets.
 */

import { ExternalServiceError } from '#errors';

export function createFormbarHttpClient({ config, logger, fetchImpl = fetch }) {
  const baseUrl = config.formbar.baseUrl;

  async function request(method, pathname, { accessToken, body, retry = 0 } = {}) {
    const url = `${baseUrl}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
    const headers = {
      accept: 'application/json',
    };
    if (body !== undefined) {
      headers['content-type'] = 'application/json';
    }
    if (accessToken) {
      headers.authorization = `Bearer ${accessToken}`;
    } else if (config.formbar.apiKey) {
      headers.api = config.formbar.apiKey;
    }

    let response;
    try {
      response = await fetchImpl(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      logger.error({ err: error, method, pathname }, 'formbar http request failed');
      if (retry < 1 && (method === 'GET' || method === 'HEAD')) {
        return request(method, pathname, { accessToken, body, retry: retry + 1 });
      }
      throw new ExternalServiceError('Formbar request failed');
    }

    const text = await response.text();
    let parsed = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { raw: text.slice(0, 200) };
      }
    }

    if (!response.ok) {
      logger.warn({ status: response.status, method, pathname }, 'formbar http error');
      throw new ExternalServiceError('Formbar request failed');
    }

    return parsed;
  }

  return {
    get(pathname, options) {
      return request('GET', pathname, options);
    },
    post(pathname, body, options) {
      return request('POST', pathname, { ...options, body });
    },
  };
}
