import { CEFRLevel } from '@prisma/client';

export interface AICharacterDTO {
  id: string;
  name: string;
  avatarUrl: string;
  personalityPrompt: string;
  defaultVoice: string | null;
  targetLanguageCode: string;
  difficultyCEFR: CEFRLevel;
  isActive: boolean;
  scenarioTitle?: string;
  suggestedTopics?: string[];
}

export interface AIMemoryItem {
  id: string;
  memoryKey: string;
  memoryValue: string;
  createdAt: string;
}

export interface AIMessageDTO {
  id: string;
  conversationId: string;
  senderRole: 'USER' | 'ASSISTANT';
  content: string;
  audioUrl?: string | null;
  correctionNote?: string | null;
  createdAt: string;
}

export interface AIConversationDTO {
  id: string;
  userId: string;
  characterId: string;
  character: AICharacterDTO;
  topic: string | null;
  startedAt: string;
  endedAt: string | null;
  messages: AIMessageDTO[];
  memories: AIMemoryItem[];
  totalTurns: number;
}

export interface StartConversationInput {
  characterId: string;
  topic?: string;
}

export interface SendMessageInput {
  content: string;
}

export interface EndConversationInput {
  durationSec?: number;
}

export interface ConversationDebriefDTO {
  conversationId: string;
  characterName: string;
  totalMessages: number;
  correctionsCount: number;
  durationSec: number;
  xpAwarded: number;
  gemsAwarded: number;
  unlockedAchievements: string[];
  vocabularyPracticed: string[];
  feedbackSummary: string;
}
