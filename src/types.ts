
export enum Gender {
  MALE = "PRIA",
  FEMALE = "WANITA",
  OTHER = "LAINNYA"
}

export interface UserData {
  nama: string;
  umur: string;
  gender: string;
}

export interface GodResult {
  godName: string;
  title: string;
  description: string;
  traits: string[];
  careers: string[];
}

export interface ScanResult {
  user: UserData;
  god: GodResult;
  photoUrl: string;
  matchPercentage: number;
}
