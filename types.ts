
export enum BotType {
  ASSISTANT = 'ASSISTANT',
  ARTIST = 'ARTIST',
  SEARCH = 'SEARCH',
  VOICE = 'VOICE',
  HUMAN = 'HUMAN',
  GLOBAL = 'GLOBAL'
}

export type Theme = 'dark' | 'light';
export type Language = 'ru' | 'en';
export type BackgroundType = 'default' | 'stars' | 'bubbles' | 'solid' | 'abstract';

export interface User {
  id: string;
  username: string;
  password?: string;
  avatar: string;
  bio?: string;
  email?: string;
  phone?: string;
  lastSeen?: number;
  isCreator?: boolean;
  settings?: {
    notifications: boolean;
    showOnline: boolean;
    background: BackgroundType;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  senderId?: string;
  senderName?: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  timestamp: number;
  isEdited?: boolean;
}

export interface ChatThread {
  id: string;
  botType: BotType;
  name: string;
  avatar: string;
  description: string;
  messages: Message[];
  isOnline?: boolean;
  targetUserId?: string;
  isTyping?: boolean;
  isGroup?: boolean;
  memberIds?: string[];
}

export interface BroadcastEvent {
  type: 'PRESENCE' | 'MESSAGE' | 'TYPING' | 'GLOBAL_MESSAGE' | 'DELETE_MESSAGE' | 'EDIT_MESSAGE' | 'REQUEST_SYNC' | 'PRESENCE_OFFLINE' | 'USER_UPDATE';
  payload: any;
}
