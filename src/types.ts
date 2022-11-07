export interface IQuickLink {
  tags: string[];
  replies: string[];
}

export interface IGuide {
  name: string;
  tags: string[];
  description: string;
  thumbnail: string;
  raid: string;
  wowhead: string;
  youtube: string;
  extra: IExtraInfo[];
}

export interface IExtraInfo {
  name: string;
  content: string;
}

export interface IRole {
  name: string;
  role: string;
  emoji: string;
}

export interface IStoredMessage {
  channelId: string;
  messageId: string;
}

export interface IDungeon {
  name: string;
  tags: string[];
  active: boolean;
}

// fallback emojis are in case the custom ones don't exist on the server
export enum Emoji {
  Tank = '🛡️',
  TankFallBack = '🛡️',
  Healer = '773896547230023722',
  HealerFallBack = '🇨🇭',
  Dps = '⚔️',
  DpsFallBack = '⚔️',
  // Healer = '773893882957135883', //(localhost custom emoji)
}
export interface IStoredKeystone {
  userId: string;
  dungeon: string;
  level: string;
  char: string;
}

export interface IDungeonKeyStones {
  dungeon: string;
  keystones: IStoredKeystone[];
}
