import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp } from '../helpers/app.js';


describe('staff pass controls', () => {
  let ctx;

  afterEach(async () => {
    if (ctx) {
      await ctx.close();
      ctx = null;
    }
  });

  it('limits approval to the teacher who owns a pass location and supports appointments', async () => {
    ctx = await createTestApp();
    const teacherId = randomUUID();
    const otherUserId = randomUUID();
    const users = [teacherId, otherUserId].map((id, index) => ({
      id,
      display_name: index ? 'Other Teacher' : 'Teacher One',
      primary_email: `${id}@example.test`,
      status: 'active',
    }));
    await ctx.container.db.knex('users').insert(users);
    const mainOffice = await ctx.container.db.knex('locations').where({ name: 'Main Office' }).first();
    const counseling = await ctx.container.db.knex('locations').where({ name: 'Counseling Office' }).first();
    await ctx.container.db.knex('locations').where({ id: counseling.id }).update({ teacher_user_id: teacherId });

    const requested = await ctx.container.passService.requestPass({
      kioskCode: 'main-office',
      studentNumber: '111111',
      studentName: 'Test Student 111111',
      destinationLocationId: counseling.id,
    });
    await expect(ctx.container.passService.approvePass({ passId: requested.pass.id, userId: otherUserId })).rejects.toMatchObject({ status: 404 });

    const approved = await ctx.container.passService.approvePass({ passId: requested.pass.id, userId: teacherId });
    expect(approved.status).toBe('active');
    expect(approved.timeout_at).toBeTruthy();

    const appointment = await ctx.container.passService.createAppointment({
      userId: teacherId,
      studentNumber: '111111',
      studentName: 'Test Student 111111',
      originLocationId: counseling.id,
      destinationLocationId: mainOffice.id,
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      notes: 'Testing appointment',
    });
    expect(appointment.appointment.status).toBe('scheduled');

    const manager = await ctx.container.passService.managerDashboard({ status: 'active' });
    expect(manager.passes).toHaveLength(1);
    expect(manager.passes[0].id).toBe(requested.pass.id);
  });
});
