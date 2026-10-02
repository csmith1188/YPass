import { randomUUID } from 'node:crypto';
import { ConflictError, NotFoundError, ValidationError } from '#errors';

export function createPassService({ db, passes, clock }) {
  async function kioskOptions(kioskCode, trx) {
    const kiosk = await passes.findKioskByCode(kioskCode, trx);
    if (!kiosk) {
      throw new NotFoundError('Kiosk not found or inactive');
    }
    const destinations = await passes.listDestinations(kiosk.location_id, trx);
    return { kiosk, destinations };
  }

  async function scanStudent({ kioskCode, studentNumber, actorUserId }) {
    const now = clock.now();
    return db.transaction(async (trx) => {
      const { kiosk, destinations } = await kioskOptions(kioskCode, trx);
      const student = await passes.findStudentByNumber(studentNumber, trx);
      if (!student) {
        throw new ValidationError('Student ID was not found');
      }

      const currentPass = await passes.findCurrentPassForStudent(student.id, trx);
      if (!currentPass) {
        return { action: 'create', kiosk, destinations, student };
      }
      if (currentPass.status === 'pending_approval') {
        return { action: 'pending', kiosk, destinations, student, pass: currentPass };
      }

      const eventType = transitionForScan(currentPass, kiosk.location_id);
      const completed = eventType === 'completed';
      const arrived = eventType === 'arrival';
      const leaving = eventType === 'scan_out';
      const patch = {
        updated_at: now,
        ...(completed
          ? {
              status: 'completed',
              ended_at: now,
              ended_location_id: kiosk.location_id,
              ended_kiosk_id: kiosk.id,
              ended_teacher_id: kiosk.location_teacher_id || null,
            }
          : {}),
        ...(arrived ? { status: 'arrived', arrived_at: now } : {}),
        ...(leaving ? { status: 'active' } : {}),
      };
      await passes.updatePass(currentPass.id, patch, trx);
      await passes.addEvent(
        {
          id: randomUUID(),
          pass_id: currentPass.id,
          event_type: eventType,
          kiosk_id: kiosk.id,
          location_id: kiosk.location_id,
          actor_user_id: actorUserId || null,
          occurred_at: now,
          metadata_json: JSON.stringify({ student_number: student.student_number }),
        },
        trx,
      );
      return { action: eventType, kiosk, destinations, student, pass: { ...currentPass, ...patch } };
    });
  }

  async function requestPass({ kioskCode, studentNumber, studentName, destinationLocationId, actorUserId }) {
    const now = clock.now();
    return db.transaction(async (trx) => {
      const { kiosk, destinations } = await kioskOptions(kioskCode, trx);
      const student = await passes.findStudentByNumber(studentNumber, trx);
      if (!student) {
        throw new ValidationError('Student ID was not found');
      }
      if (student.display_name.trim().toLowerCase() !== studentName.trim().toLowerCase()) {
        throw new ValidationError('Student name does not match that student ID');
      }
      const destination = destinations.find((item) => item.id === destinationLocationId);
      if (!destination) {
        throw new ValidationError('Choose a valid destination');
      }
      if (await passes.findCurrentPassForStudent(student.id, trx)) {
        throw new ConflictError('This student already has a current pass');
      }

      const pass = {
        id: randomUUID(),
        student_id: student.id,
        origin_location_id: kiosk.location_id,
        origin_kiosk_id: kiosk.id,
        destination_location_id: destination.id,
        destination_teacher_id: destination.teacher_user_id || null,
        journey_type: destination.type === 'round_trip' ? 'round_trip' : 'one_way',
        status: 'pending_approval',
        created_by: actorUserId || null,
        requested_at: now,
        timeout_at: null,
      };
      await passes.createPass(pass, {
        id: randomUUID(),
        pass_id: pass.id,
        event_type: 'created',
        kiosk_id: kiosk.id,
        location_id: kiosk.location_id,
        actor_user_id: actorUserId || null,
        occurred_at: now,
        metadata_json: JSON.stringify({ student_number: student.student_number }),
      }, trx);
      return { pass, student, destination, kiosk, destinations };
    });
  }

  return { kioskOptions, scanStudent, requestPass };
}

function transitionForScan(pass, kioskLocationId) {
  if (pass.journey_type !== 'round_trip') {
    return 'completed';
  }
  if (pass.status === 'active' && kioskLocationId === pass.destination_location_id) {
    return 'arrival';
  }
  if (pass.status === 'arrived' && kioskLocationId === pass.destination_location_id) {
    return 'scan_out';
  }
  if (pass.status === 'arrived' && kioskLocationId === pass.origin_location_id) {
    return 'completed';
  }
  return 'completed';
}
