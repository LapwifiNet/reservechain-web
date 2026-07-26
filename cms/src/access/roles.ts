import type { Access, FieldAccess } from "payload/types";

type Role = "admin" | "editor" | "viewer";

const hasRole = (user: { role?: Role } | null | undefined, roles: Role[]) =>
  !!user && !!user.role && roles.includes(user.role);

/** Collection-level: only admins. */
export const isAdmin: Access = ({ req: { user } }) => hasRole(user, ["admin"]);

/** Collection-level: admins or editors may write. */
export const isAdminOrEditor: Access = ({ req: { user } }) =>
  hasRole(user, ["admin", "editor"]);

/** Collection-level: any signed-in staff user may read. */
export const isSignedIn: Access = ({ req: { user } }) => !!user;

/**
 * Public read gate: signed-in staff see everything; anonymous callers only see
 * documents whose status is "published".
 */
export const publishedOrSignedIn: Access = ({ req: { user } }) => {
  if (user) return true;
  return { status: { equals: "published" } };
};

/** Field-level: only admins may change this field. */
export const isAdminFieldLevel: FieldAccess = ({ req: { user } }) =>
  hasRole(user, ["admin"]);
