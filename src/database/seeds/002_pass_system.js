import { randomUUID } from 'node:crypto';

const LOCATIONS = [
	{ name: 'Counseling Office', type: 'round_trip', kioskName: 'Counseling kiosk', kioskCode: 'counseling-main' },
	{ name: 'Main Office', type: 'round_trip', kioskName: 'Main Office kiosk', kioskCode: 'main-office' },
];

/**
 * Seed locations and kiosks. Teacher locations are linked after teacher users exist.
 * @param {import('knex').Knex} knex
 */
export async function seed(knex) {
	for (const location of LOCATIONS) {
		let locationRow = await knex('locations').where({ name: location.name }).first();
		if (!locationRow) {
			locationRow = {
				id: randomUUID(),
				name: location.name,
				type: location.type,
				teacher_user_id: null,
				active: true,
			};
			await knex('locations').insert(locationRow);
		}

		const kioskExists = await knex('kiosks').where({ kiosk_code: location.kioskCode }).first();
		if (!kioskExists) {
			await knex('kiosks').insert({
				id: randomUUID(),
				location_id: locationRow.id,
				name: location.kioskName,
				kiosk_code: location.kioskCode,
				active: true,
			});
		}
	}
}
