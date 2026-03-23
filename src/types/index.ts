export type Role = 'admin' | 'vendedor';

export interface UserSession {
  id: string;
  username: string;
  role: Role;
}
