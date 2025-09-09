export interface UserRole {
  role: string;
  user_id: string;
  fullname: string;
  email: string;
}

export interface UserProfile {
  id: string;
  fullname: string;
  birth: string;
  email: string;
  contact_number: number;
  gender: string;
  address: string;
  profile_photo?: string;
  role?: string;
}
