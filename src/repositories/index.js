/**
 * User persistence. Keep SQL inside this module.
 */
export function createUserRepository(db) {
  const knex = db.knex;

  return {
    async create(user, trx = knex) {
      await trx('users').insert(user);
      return user;
    },
    async findById(id, trx = knex) {
      return trx('users').where({ id }).first();
    },
    async findByEmail(email, trx = knex) {
      if (!email) {
        return null;
      }
      return trx('users').whereRaw('lower(primary_email) = ?', [email.toLowerCase()]).first();
    },
    async update(id, patch, trx = knex) {
      await trx('users')
        .where({ id })
        .update({ ...patch, updated_at: trx.fn.now() });
    },
  };
}

export function createIdentityRepository(db) {
  const knex = db.knex;
  return {
    async create(identity, trx = knex) {
      await trx('auth_identities').insert(identity);
      return identity;
    },
    async findByProviderSubject(provider, subject, trx = knex) {
      return trx('auth_identities').where({ provider, subject }).first();
    },
    async listByUser(userId, trx = knex) {
      return trx('auth_identities').where({ user_id: userId }).orderBy('created_at');
    },
    async deleteById(id, trx = knex) {
      await trx('auth_identities').where({ id }).delete();
    },
  };
}

export function createLocalCredentialRepository(db) {
  const knex = db.knex;
  return {
    async create(row, trx = knex) {
      await trx('local_credentials').insert(row);
    },
    async findByUsername(username, trx = knex) {
      return trx('local_credentials').whereRaw('lower(username) = ?', [username.toLowerCase()]).first();
    },
    async findByUserId(userId, trx = knex) {
      return trx('local_credentials').where({ user_id: userId }).first();
    },
    async update(userId, patch, trx = knex) {
      await trx('local_credentials').where({ user_id: userId }).update(patch);
    },
    async deleteByUserId(userId, trx = knex) {
      await trx('local_credentials').where({ user_id: userId }).delete();
    },
  };
}

export function createChallengeRepository(db) {
  const knex = db.knex;
  return {
    async create(row, trx = knex) {
      await trx('auth_challenges').insert(row);
    },
    async findByHash(tokenHash, trx = knex) {
      return trx('auth_challenges').where({ token_hash: tokenHash }).first();
    },
    async markUsed(id, trx = knex) {
      await trx('auth_challenges').where({ id }).update({ used_at: trx.fn.now() });
    },
    async deleteExpired(now, trx = knex) {
      return trx('auth_challenges').where('expires_at', '<', now).delete();
    },
  };
}

export function createTokenRepository(db) {
  const knex = db.knex;
  return {
    async upsert(row, trx = knex) {
      const existing = await trx('provider_tokens').where({ identity_id: row.identity_id }).first();
      if (existing) {
        await trx('provider_tokens').where({ identity_id: row.identity_id }).update(row);
        return;
      }
      await trx('provider_tokens').insert(row);
    },
    async findByIdentity(identityId, trx = knex) {
      return trx('provider_tokens').where({ identity_id: identityId }).first();
    },
    async deleteByIdentity(identityId, trx = knex) {
      await trx('provider_tokens').where({ identity_id: identityId }).delete();
    },
  };
}

export function createRbacRepository(db) {
  const knex = db.knex;
  return {
    async findRoleByName(name, trx = knex) {
      return trx('roles').where({ name }).first();
    },
    async assignRole(userId, roleId, trx = knex) {
      await trx('user_roles').insert({ user_id: userId, role_id: roleId }).onConflict(['user_id', 'role_id']).ignore();
    },
    async listRolesForUser(userId, trx = knex) {
      return trx('roles')
        .join('user_roles', 'roles.id', 'user_roles.role_id')
        .where('user_roles.user_id', userId)
        .select('roles.*');
    },
    async listPermissionsForUser(userId, trx = knex) {
      return trx('permissions')
        .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
        .join('user_roles', 'role_permissions.role_id', 'user_roles.role_id')
        .where('user_roles.user_id', userId)
        .distinct('permissions.name');
    },
  };
}

export function createAuditRepository(db) {
  const knex = db.knex;
  return {
    async write(row) {
      await knex('audit_events').insert(row);
    },
  };
}
