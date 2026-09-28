import { randomUUID } from 'node:crypto';
import { randomToken, sha256 } from '#utils/crypto.js';

const DEFAULT_TTL_MS = 60 * 60 * 1000;

/**
 * One-time hashed tokens for email verification, password reset, reauth, and linking.
 */
export function createTokenService(challengeRepository, clock) {
  return {
    async issue({ userId, purpose, ttlMs = DEFAULT_TTL_MS, payload = null }) {
      const token = randomToken(32);
      const row = {
        id: randomUUID(),
        user_id: userId,
        purpose,
        token_hash: sha256(token),
        expires_at: new Date(clock.nowMs() + ttlMs),
        used_at: null,
        payload_json: payload ? JSON.stringify(payload) : null,
      };
      await challengeRepository.create(row);
      return token;
    },

    async consume(token, purpose) {
      const row = await challengeRepository.findByHash(sha256(token));
      if (!row || row.purpose !== purpose || row.used_at) {
        return null;
      }
      if (new Date(row.expires_at).getTime() <= clock.nowMs()) {
        return null;
      }
      await challengeRepository.markUsed(row.id);
      return {
        ...row,
        payload: row.payload_json ? JSON.parse(row.payload_json) : null,
      };
    },
  };
}
