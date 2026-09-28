/**
 * Database health helper used by readiness probes.
 *
 * @param {{ health: () => Promise<{ ok: boolean }> } | null} db
 */
export async function checkDatabaseHealth(db) {
  if (!db) {
    return { ok: false, reason: 'not_initialized' };
  }
  const result = await db.health();
  return result.ok ? { ok: true } : { ok: false, reason: 'unreachable' };
}
