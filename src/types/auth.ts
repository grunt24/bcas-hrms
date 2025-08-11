export type AuthenticationTypes = {
  token: string;
  user: {
    userId: number;
    employeeId: number;
    roleId: number;
    firstName: string;
    lastName: string;
    username: string;
    roles: {
      roleId: number;
      roleName: string;
    }[];
  };
};

export type LoginTypes = {
  username: string;
  password: string;
};

export const ROLES = {
  Admin: 1,
  Teaching: 2,
  NonTeaching: 3,
} as const;