export type Sensitivity = 'high' | 'medium' | 'low';

export type RoleKey = 'sommelier' | 'front_desk' | 'housekeeping' | 'concierge' | 'manager';

export type Classification = {
  sensitivity: Sensitivity;
  themes: string[];
  suggestedRoles: RoleKey[];
};

export type AbstractInput = {
  raw: string;
  sensitivity: Sensitivity;
  themes: string[];
  role: string;
  guestName: string;
  guestInterestTags: string[];
  relationshipThemes: string[];
};

export type DraftInput = {
  guestName: string;
  guestInterestTags: string[];
  guestPartnerName?: string | null;
  guestAnniversary?: string | null;
  placeMakerName: string;
  placeMakerRole: string;
  placeMakerVoiceStyle: string;
  relationshipThemes: string[];
  visits: number;
  rawNote: string;
  sensitivity: Sensitivity;
  priorExchanges: Array<{ from: 'staff' | 'guest'; content: string; at: Date }>;
  intent: string;
};
