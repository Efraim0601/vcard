export interface BusinessCard {
  id: string;
  fullName: string;
  title: string;
  company: string;
  mobile?: string;
  office?: string;
  email?: string;
  website?: string;
  createdAt: string;
}

export interface SavedContact {
  id: string;
  cardId: string;
  card: BusinessCard;
  savedAt: string;
}
