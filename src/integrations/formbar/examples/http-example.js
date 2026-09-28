/**
 * Disableable Formbar HTTP example. Production config forces this off.
 * It never exposes credentials or forwards arbitrary URLs.
 */
export function createFormbarHttpExample({ httpClient, logger }) {
  return {
    async ping() {
      logger.info('formbar http example ping');
      try {
        const result = await httpClient.get('/api/v1/me');
        return { ok: true, hasData: Boolean(result) };
      } catch {
        return { ok: false, hasData: false };
      }
    },
  };
}
