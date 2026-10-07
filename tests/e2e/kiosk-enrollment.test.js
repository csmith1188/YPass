import { afterEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createTestApp } from '../helpers/app.js';

describe('kiosk enrollment', () => {
  let ctx;

  afterEach(async () => {
    if (ctx) {
      await ctx.close();
      ctx = null;
    }
  });

  it('enrolls once and never stores the plaintext kiosk secret', async () => {
    ctx = await createTestApp({ LOCAL_AUTH_EMAIL_FLOW: 'disabled' });
    const managerId = randomUUID();
    await ctx.container.db.knex('users').insert({
      id: managerId,
      display_name: 'Enrollment Manager',
      primary_email: `${managerId}@example.test`,
      status: 'active',
    });
    const location = await ctx.container.db.knex('locations').first();
    const created = await ctx.container.kioskService.createEnrollmentCode({
      createdBy: managerId,
      name: 'Library Kiosk',
      locationId: location.id,
      type: 'ROUND_TRIP',
    });

    const enrolled = await ctx.request.post('/api/v1/kiosks/enroll').send({
      enrollmentCode: created.code,
      softwareVersion: '1.2.3',
    });

    expect(enrolled.status).toBe(201);
    expect(enrolled.body.success).toBe(true);
    expect(enrolled.body.credentials.secret).toHaveLength(64);
    const kiosk = await ctx.container.db.knex('kiosks').where({ kiosk_code: enrolled.body.kiosk.code }).first();
    expect(kiosk.secret_hash).not.toBe(enrolled.body.credentials.secret);
    expect(kiosk.software_version).toBe('1.2.3');

    const replay = await ctx.request.post('/api/v1/kiosks/enroll').send({
      enrollmentCode: created.code,
      softwareVersion: '1.2.3',
    });
    expect(replay.status).toBe(409);
  });
});