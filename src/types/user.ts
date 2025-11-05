export interface UserProfile {
  id: string;
  fullname: string;
  birth: string; // Date as string
  email: string;
  contact_number: number;
  gender: string;
  address: string;
  profile_photo?: string;
  Bio?: string; // Note: capitalized in database
  active_status?: boolean; // Profile status: true for Active, false for Inactive
}

export interface UserProfileUpdate {
  fullname?: string;
  birth?: string;
  contact_number?: number;
  gender?: string;
  address?: string;
  profile_photo?: string;
  Bio?: string; // Note: capitalized in database
  active_status?: boolean; // Profile status: true for Active, false for Inactive
}
