export enum Role {
  ADMIN = "admin",
  COMPLIANCE = "compliance",
  VIEWER = "viewer",
}

export type AuthenticatedUser = {
  sub?: string;
  email: string;
  role: Role;
  service?: boolean;
};
