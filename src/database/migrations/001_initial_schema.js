/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.string('id', 36).primary();
    table.string('display_name', 120).notNullable();
    table.string('primary_email', 255).nullable().unique();
    table.timestamp('email_verified_at').nullable();
    table.string('status', 32).notNullable().defaultTo('active');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('auth_identities', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('provider', 32).notNullable();
    table.string('subject', 255).notNullable();
    table.string('email_at_provider', 255).nullable();
    table.text('profile_json').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['provider', 'subject']);
    table.index(['user_id']);
  });

  await knex.schema.createTable('local_credentials', (table) => {
    table.string('user_id', 36).primary().references('id').inTable('users').onDelete('CASCADE');
    table.string('username', 64).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.timestamp('password_changed_at').notNullable().defaultTo(knex.fn.now());
    table.integer('failed_attempts').notNullable().defaultTo(0);
    table.timestamp('locked_until').nullable();
  });

  await knex.schema.createTable('provider_tokens', (table) => {
    table.string('id', 36).primary();
    table
      .string('identity_id', 36)
      .notNullable()
      .references('id')
      .inTable('auth_identities')
      .onDelete('CASCADE');
    table.text('encrypted_payload').notNullable();
    table.timestamp('expires_at').nullable();
    table.timestamp('rotated_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['identity_id']);
  });

  await knex.schema.createTable('roles', (table) => {
    table.string('id', 36).primary();
    table.string('name', 64).notNullable().unique();
    table.string('description', 255).nullable();
  });

  await knex.schema.createTable('permissions', (table) => {
    table.string('id', 36).primary();
    table.string('name', 128).notNullable().unique();
    table.string('description', 255).nullable();
  });

  await knex.schema.createTable('user_roles', (table) => {
    table.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('role_id', 36).notNullable().references('id').inTable('roles').onDelete('CASCADE');
    table.primary(['user_id', 'role_id']);
  });

  await knex.schema.createTable('role_permissions', (table) => {
    table.string('role_id', 36).notNullable().references('id').inTable('roles').onDelete('CASCADE');
    table
      .string('permission_id', 36)
      .notNullable()
      .references('id')
      .inTable('permissions')
      .onDelete('CASCADE');
    table.primary(['role_id', 'permission_id']);
  });

  await knex.schema.createTable('auth_challenges', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).nullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('purpose', 64).notNullable();
    table.string('token_hash', 64).notNullable().unique();
    table.timestamp('expires_at').notNullable();
    table.timestamp('used_at').nullable();
    table.text('payload_json').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.index(['purpose', 'user_id']);
  });

  await knex.schema.createTable('audit_events', (table) => {
    table.string('id', 36).primary();
    table.timestamp('at').notNullable().defaultTo(knex.fn.now());
    table.string('actor_user_id', 36).nullable();
    table.string('event_type', 64).notNullable();
    table.string('ip_hash', 32).nullable();
    table.string('request_id', 64).nullable();
    table.text('metadata_json').nullable();
    table.index(['event_type', 'at']);
    table.index(['actor_user_id']);
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('audit_events');
  await knex.schema.dropTableIfExists('auth_challenges');
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('user_roles');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('provider_tokens');
  await knex.schema.dropTableIfExists('local_credentials');
  await knex.schema.dropTableIfExists('auth_identities');
  await knex.schema.dropTableIfExists('users');
}
