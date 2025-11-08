export interface UserProfile {
  id: string;
  fullname: string;
  birth: string; // Date as string
  email: string;
  contact_number: number;
  gender: string;
  address: string;
  profile_photo?: string;
  Bio?: string; // Note: Database column is "Bio" with capital B
  active_status?: boolean;
}

export interface UserProfileUpdate {
  fullname?: string;
  birth?: string;
  contact_number?: number;
  gender?: string;
  address?: string;
  profile_photo?: string;
  Bio?: string; // Note: Database column is "Bio" with capital B
  active_status?: boolean;
}
