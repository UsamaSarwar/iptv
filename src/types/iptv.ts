export interface IPTVChannel {
  id: string;
  name: string;
  logo?: string;
  group: string;
  url: string;
  tvgId?: string;
  tvgName?: string;
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  language?: string;
  quality?: string;
  isFavorite?: boolean;
  featured?: boolean;
  description?: string;
  backdrop?: string;
  website?: string;
  network?: string;
}

export interface PlaylistInfo {
  id: string;
  name: string;
  url?: string;
  channelCount: number;
  addedAt: number;
  isActive: boolean;
}

export type Category = {
  id: string;
  name: string;
  icon?: string;
  count: number;
};
