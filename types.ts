export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  ERROR = 'error',
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  imageUrl?: string;
  sources?: GroundingSource[];
  quickReplies?: string[];
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

export interface HistoryItem {
  id: string;
  type: 'ia' | 'wiki' | 'imagen' | 'traductor';
  prompt: string;
  response: string;
  timestamp: number;
  fileName?: string;
  imageUrl?: string;
}