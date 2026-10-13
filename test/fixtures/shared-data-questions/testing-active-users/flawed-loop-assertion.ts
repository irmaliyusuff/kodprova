export interface User {
  name: string;
  active: boolean;
}

export function activeUsers(users: User[]): User[] {
  const first = users.find((user) => user.active);
  return first === undefined ? [] : [first];
}
