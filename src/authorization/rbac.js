/**
 * Server-side authorization. Role and permission names never come from the client.
 */

export function createRbac({ rbacRepository }) {
  return {
    async getRoles(userId) {
      const rows = await rbacRepository.listRolesForUser(userId);
      return rows.map((row) => row.name);
    },
    async getPermissions(userId) {
      const rows = await rbacRepository.listPermissionsForUser(userId);
      return rows.map((row) => row.name);
    },
    hasRole(user, roleName) {
      return Boolean(user?.roles?.includes(roleName));
    },
    hasPermission(user, permissionName) {
      return Boolean(user?.permissions?.includes(permissionName));
    },
  };
}

/**
 * Optional translation of Formbar scopes into app permissions.
 * Disabled by default so a Formbar teacher is not an app admin.
 *
 * @param {string[]} formbarScopes
 * @param {object} config
 * @returns {string[]}
 */
export function mapFormbarScopes(formbarScopes, config) {
  if (!config.formbar.mapPermissions) {
    return [];
  }
  const mapped = new Set();
  for (const scope of formbarScopes || []) {
    if (scope === 'global.user.manage') {
      mapped.add('users.manage');
    }
  }
  return [...mapped];
}
