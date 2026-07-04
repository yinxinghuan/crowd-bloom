export const FIELD_W = 390;
export const FIELD_H = 680;

export const PETAL_COLORS = [
  '#ff6fb1',
  '#75e6ff',
  '#f7d65c',
  '#a8ff7a',
  '#b991ff',
  '#ff9d6c',
] as const;

export type BloomMode = 'ready' | 'planted' | 'missing-avatar';

export interface BloomPetal {
  id: string;
  createdAt: number;
  ring: 1 | 2 | 3;
  angle: number;
  colorIndex: number;
  pulse: number;
  userId: string;
  userName?: string;
  userAvatarUrl?: string;
}

export interface BloomSave {
  petals: BloomPetal[];
  _lastActive?: number;
}

export interface ProfileInfo {
  name?: string;
  head_url?: string;
}

export interface SaveRow {
  user_id?: string;
  resource_data?: string;
  time?: string;
}
