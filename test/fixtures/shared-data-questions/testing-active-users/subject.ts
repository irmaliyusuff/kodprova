export interface User {
  name: string;
  active: boolean;
}

export function activeUsers(users: User[]): User[] {
  return users.filter((user) => user.active);
}
