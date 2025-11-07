export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

export interface Thing {
  id: string;
  user_id: string;
  headline: string;
  description: string;
  latitude: number;
  longitude: number;
  contact_email: string;
  created_at: Date;
  status: 'active' | 'resolved';
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface CreateThingRequest {
  headline: string;
  description: string;
  latitude: number;
  longitude: number;
}

export interface ContactRequest {
  message: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
}
