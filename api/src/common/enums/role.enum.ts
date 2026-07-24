export enum Role {
  ADMIN = 'ADMIN',
  COMPLIANCE = 'COMPLIANCE',
  VIEWER = 'VIEWER',
}

export type AuthenticatedUser = {
  sub?: string;
  email: string;
  role: Role;
  service?: boolean;
};
