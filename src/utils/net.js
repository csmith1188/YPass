import { createHash } from 'node:crypto';

/**
 * Hash a client IP for audit logs. Do not store raw IPs in audit metadata
 * unless a specific compliance requirement exists.
 *
 * @param {string | undefined} ip
 */
export function hashIp(ip) {
  if (!ip) {
    return null;
  }
  return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

/**
 * True if the request is from loopback. Used to gate verbose health details.
 *
 * @param {import('express').Request} req
 */
export function isLoopback(req) {
  const ip = req.ip || req.socket?.remoteAddress || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost';
}
