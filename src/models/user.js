/**
 * Domain model helpers. Repositories return plain objects;
 * these functions keep mapping in one place.
 */

export function toPublicUser(user) {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    displayName: user.display_name,
    email: user.primary_email,
    roles: user.roles || [],
    permissions: user.permissions || [],
  };
}
