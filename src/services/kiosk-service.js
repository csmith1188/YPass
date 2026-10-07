import { randomUUID } from 'node:crypto';
import { ConflictError, NotFoundError, ValidationError } from '#errors';
import { randomToken, sha256 } from '#utils/crypto.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function createKioskService({ db, kiosks, clock, audit }) {
  async function createEnrollmentCode({ createdBy, name, locationId, type, kioskId, reqLike }) {
    const location = await kiosks.findLocationById(locationId);
    if (!location || !location.active) throw new ValidationError('Choose a valid active location');

    const code = formatEnrollmentCode();
    const row = {
      id: randomUUID(),
      code_hash: sha256(code),
      expires_at: new Date(clock.now().getTime() + 10 * 60 * 1000),
      used_at: null,
      created_by: createdBy,
      name,
      location_id: locationId,
      type,
      kiosk_id: kioskId || null,
    };
    await kiosks.createEnrollmentCode(row);
    await writeAudit('KIOSK_ENROLLMENT_CODE_CREATED', createdBy, reqLike, {
      enrollmentCodeId: row.id,
      locationId,
      type,
    });
    return { code, expiresAt: row.expires_at };
  }

  async function enroll({ enrollmentCode, softwareVersion, reqLike }) {
    const now = clock.now();
    const secret = randomToken(32);
    const codeHash = sha256(normalizeCode(enrollmentCode));
    const result = await db.transaction(async (trx) => {
      const code = await kiosks.findEnrollmentCode(codeHash, trx);
      if (!code) throw new NotFoundError('Enrollment code is invalid or expired');
      if (new Date(code.expires_at) <= now) {
        throw new NotFoundError('Enrollment code is invalid or expired');
      }
      const claimed = await kiosks.claimEnrollmentCode(code.id, now, trx);
      if (claimed !== 1) throw new ConflictError('Enrollment code has already been used');
      if (!code.location_id || !code.name) {
        throw new ValidationError('Enrollment code is not configured for a kiosk');
      }

      const kioskCode = await kiosks.nextKioskCode(trx);
      const existingKiosk = code.kiosk_id ? await kiosks.findKioskById(code.kiosk_id, trx) : null;
      const kiosk = existingKiosk
        ? (await kiosks.updateKiosk(
            existingKiosk.id,
            {
              secret_hash: sha256(secret),
              active: true,
              software_version: softwareVersion || null,
              last_seen_at: now,
              last_seen: now,
            },
            trx,
          ), { ...existingKiosk, secret_hash: sha256(secret) })
        : await kiosks.createKiosk(
            {
              id: randomUUID(),
              location_id: code.location_id,
              name: code.name,
              kiosk_code: kioskCode,
              type: code.type,
              secret_hash: sha256(secret),
              active: true,
              software_version: softwareVersion || null,
              last_seen_at: now,
              last_seen: now,
            },
            trx,
          );
      return { kiosk };
    });

    await writeAudit('KIOSK_ENROLLED', null, reqLike, { kioskId: result.kiosk.id });
    return {
      kiosk: { code: result.kiosk.kiosk_code },
      credentials: { secret },
      serverUrl: reqLike.serverUrl,
    };
  }

  async function listEnrollmentCodes() {
    return kiosks.listEnrollmentCodes();
  }

  async function createCredentialRegenerationCode({ createdBy, kioskId, reqLike }) {
    const kiosk = await kiosks.findKioskById(kioskId);
    if (!kiosk) throw new NotFoundError('Kiosk not found');
    await kiosks.updateKiosk(kiosk.id, { secret_hash: null, active: false });
    return createEnrollmentCode({
      createdBy,
      name: kiosk.name,
      locationId: kiosk.location_id,
      type: kiosk.type,
      kioskId: kiosk.id,
      reqLike,
    });
  }

  async function writeAudit(eventType, actorUserId, reqLike, metadata) {
    await audit.write({
      id: randomUUID(),
      actor_user_id: actorUserId || null,
      event_type: eventType,
      ip_hash: null,
      request_id: reqLike?.requestId || null,
      metadata_json: metadata ? JSON.stringify(metadata) : null,
    });
  }

  return { createEnrollmentCode, enroll, listEnrollmentCodes, createCredentialRegenerationCode };
}

function normalizeCode(code) {
  return String(code || '').trim().toUpperCase();
}

function formatEnrollmentCode() {
  const bytes = randomToken(8);
  let value = '';
  for (let index = 0; index < 8; index += 1) {
    value += CODE_ALPHABET[parseInt(bytes.slice(index * 2, index * 2 + 2), 16) % CODE_ALPHABET.length];
  }
  return `${value.slice(0, 4)}-${value.slice(4)}`;
}