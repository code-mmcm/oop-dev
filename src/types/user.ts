export interface UserProfile {
  id: string;
  fullname: string;
  birth: string; // Date as string
  email: string;
  contact_number: number;
  gender: string;
  address: string;
  profile_photo?: string;
}

export interface UserProfileUpdate {
  fullname?: string;
  birth?: string;
  contact_number?: number;
  gender?: string;
  address?: string;
  profile_photo?: string;
}
