export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // Optional for responses (should be excluded)
  role?: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  password?: string;
  role?: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterUser {
  email: string;
  password: string;
  company_name: string;
  cif: string;
  tax_address: string;
  telephone: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  PROV = 'provider'
}

export interface UserFilters {
  role?: UserRole;
  email?: string;
  name?: string;
}