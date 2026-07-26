export interface PadiCertification {
  name: string;
  level: 'recreational' | 'technical' | 'professional';
  dateObtained?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  certifications: PadiCertification[];
  padiNumber?: string;
  lastDiveDate?: string;
  totalDives: number;
  notes: string;
  createdAt: string;
}

export const PADI_CERTIFICATIONS: PadiCertification[] = [
  { name: 'Open Water', level: 'recreational' },
  { name: 'Advanced OW', level: 'recreational' },
  { name: 'Rescue + EFR', level: 'recreational' },
  { name: 'Dive Master', level: 'professional' },
  { name: 'Nitrox', level: 'recreational' },
  { name: 'Deep Diver', level: 'recreational' },
  { name: 'Wreck', level: 'recreational' },
  { name: 'Sidemount Rec', level: 'recreational' },
  { name: 'Tec 40', level: 'technical' },
  { name: 'Tec 45', level: 'technical' },
  { name: 'Trimix', level: 'technical' },
  { name: 'Dry Suit', level: 'recreational' },
  { name: 'Foto Sub', level: 'recreational' },
];
