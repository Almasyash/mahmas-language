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

// ------------------------------------------------------------------------------
// PHASE 6: AI VOICE CALLING DTOs
// ------------------------------------------------------------------------------

export type VoiceCallStatus = 'CONNECTING' | 'CONNECTED' | 'ENDED';

export interface PhonemeFeedbackDTO {
  phoneme: string;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_WORK';
  hint: string;
}

export interface AIVoiceCallDTO {
  id: string;
  conversationId: string;
  characterId: string;
  character: AICharacterDTO;
  status: VoiceCallStatus;
  startedAt: string;
  endedAt: string | null;
  durationSec: number;
  turnCount: number;
  greetingText: string;
  greetingAudioBase64?: string;
  audioMimeType?: string;
  audioStreamEndpoint?: string;
}

export interface InitiateVoiceCallInput {
  characterId: string;
  topic?: string;
}

export interface VoiceTurnInput {
  audioBase64?: string;
  spokenText?: string;
  audioDurationMs?: number;
}

export interface VoiceTurnResponseDTO {
  turnIndex: number;
  userTranscription: string;
  pronunciationScore: number; // 0 - 100
  fluencyScore: number;       // 0 - 100
  phonemeFeedback: PhonemeFeedbackDTO[];
  assistantReply: string;
  assistantAudioBase64: string;
  audioMimeType: string;
  correctionNote?: string | null;
  pronunciationAdvice?: string | null;
  xpAwarded: number;
  totalTurns: number;
}

export interface EndVoiceCallInput {
  durationSec?: number;
}

export interface VoiceCallDebriefDTO {
  callId: string;
  characterName: string;
  totalDurationSec: number;
  turnsCompleted: number;
  overallAccuracy: number;    // 0 - 100
  overallFluency: number;     // 0 - 100
  wordsSpokenEstimate: number;
  wordsPerMinute: number;
  xpAwarded: number;
  gemsAwarded: number;
  unlockedAchievements: string[];
  pronunciationHighlights: string[];
  feedbackSummary: string;
}

// ------------------------------------------------------------------------------
// Phase 7: AI Video Calling Types & DTOs
// ------------------------------------------------------------------------------

export type AvatarEmotion =
  | 'neutral'
  | 'happy'
  | 'encouraging'
  | 'thoughtful'
  | 'surprised'
  | 'celebrating';

export type VisemeType = 'rest' | 'aa' | 'ee' | 'oo' | 'ch' | 'ff';

export type AvatarGesture = 'nod' | 'smile' | 'wave' | 'tilt' | 'rest';

export interface VisemeFrameDTO {
  viseme: VisemeType;
  timestampMs: number;
  durationMs: number;
}

export interface VisualAidCueDTO {
  id: string;
  title: string;
  category: 'menu' | 'map' | 'flashcard' | 'cultural_tip' | 'photo';
  headline: string;
  body: string;
  targetVocab: string[];
  imageUrl?: string;
}

export interface AIVideoCallDTO {
  id: string;
  conversationId: string;
  characterId: string;
  character: AICharacterDTO;
  status: 'CONNECTING' | 'CONNECTED' | 'ENDED';
  startedAt: string;
  endedAt?: string | null;
  durationSec: number;
  turnCount: number;
  greetingText: string;
  greetingAudioBase64: string;
  audioMimeType: string;
  currentEmotion: AvatarEmotion;
  initialVisemes: VisemeFrameDTO[];
  initialVisualAid?: VisualAidCueDTO | null;
  sceneSetting: string;
}

export interface InitiateVideoCallInput {
  characterId: string;
  topic?: string;
  sceneSetting?: string;
}

export interface VideoTurnInput {
  spokenText?: string;
  audioBase64?: string;
  audioDurationMs?: number;
  requestHelpHint?: boolean;
}

export interface VideoTurnResponseDTO {
  turnIndex: number;
  userTranscription: string;
  pronunciationScore: number;
  fluencyScore: number;
  facialEngagementScore: number; // 0 - 100 engagement & visual responsiveness
  phonemeFeedback: PhonemeFeedbackDTO[];
  assistantReply: string;
  assistantAudioBase64: string;
  audioMimeType: string;
  emotion: AvatarEmotion;
  gesture: AvatarGesture;
  visemes: VisemeFrameDTO[];
  visualAid?: VisualAidCueDTO | null;
  correctionNote?: string | null;
  pronunciationAdvice?: string | null;
  difficultyLevel: string;
  xpAwarded: number;
  totalTurns: number;
}

export interface EndVideoCallInput {
  durationSec?: number;
}

export interface VideoCallDebriefDTO {
  callId: string;
  characterName: string;
  totalDurationSec: number;
  turnsCompleted: number;
  overallAccuracy: number;
  overallFluency: number;
  facialEngagementScore: number;
  wordsSpokenEstimate: number;
  wordsPerMinute: number;
  xpAwarded: number;
  gemsAwarded: number;
  unlockedAchievements: string[];
  pronunciationHighlights: string[];
  visualAidsExplored: number;
  feedbackSummary: string;
}
