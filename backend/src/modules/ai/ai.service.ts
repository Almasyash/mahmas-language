// ==============================================================================
// MAHMAS LANGUAGE — AI TUTOR SERVICE
// Conversational AI tutor orchestration, pedagogical feedback, memory, & rewards
// ==============================================================================

import { AICharacter, CEFRLevel } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { NotFoundError, BadRequestError } from '../../common/errors';
import { AIProviderFactory } from './ai-provider.adapter';
import {
  AICharacterDTO,
  AIConversationDTO,
  AIMessageDTO,
  ConversationDebriefDTO,
  AIVoiceCallDTO,
  InitiateVoiceCallInput,
  VoiceTurnInput,
  VoiceTurnResponseDTO,
  EndVoiceCallInput,
  VoiceCallDebriefDTO,
  AvatarEmotion,
  AvatarGesture,
  VisemeFrameDTO,
  VisualAidCueDTO,
  AIVideoCallDTO,
  InitiateVideoCallInput,
  VideoTurnInput,
  VideoTurnResponseDTO,
  EndVideoCallInput,
  VideoCallDebriefDTO,
} from './ai.types';
import { xpService } from '../progression/xp.service';
import { currencyService } from '../progression/currency.service';
import { questsService } from '../progression/quests.service';
import { achievementsService } from '../progression/achievements.service';
import { streakService } from '../progression/streak.service';
import { dailyGoalService } from '../progression/daily-goal.service';
import { ProgressionConfig } from '../progression/progression.config';

interface VideoCallSessionState {
  callId: string;
  userId: string;
  characterId: string;
  conversationId: string;
  startedAt: Date;
  endedAt?: Date | null;
  turnCount: number;
  accumulatedAccuracy: number;
  accumulatedFluency: number;
  accumulatedFacialEngagement: number;
  wordsSpokenEstimate: number;
  visualAidsExplored: number;
  currentEmotion: AvatarEmotion;
  sceneSetting: string;
  greetingText: string;
  greetingAudioBase64: string;
  audioMimeType: string;
  status: 'CONNECTED' | 'ENDED';
}

export class AIService {
  private aiProvider = AIProviderFactory.getProvider();
  private activeVideoCalls = new Map<string, VideoCallSessionState>();

  private getOpeningGreeting(character: AICharacter, modality: 'chat' | 'voice' | 'video'): string {
    const lang = (character.targetLanguageCode || 'es').toLowerCase();
    const name = character.name;

    if (lang === 'en' || lang === 'english') {
      if (name.includes('Sarah')) {
        if (modality === 'voice') return "Hello! I can hear you loud and clear. Welcome to the café! How are you doing today?";
        if (modality === 'video') return "Hello! Wonderful to see you face-to-face on video call. Everything looks and sounds great. How are you today?";
        return "Hello! Welcome to the café. I'm Sarah, and I'm so glad to chat with you today! How are you doing?";
      }
      if (name.includes('David')) {
        if (modality === 'voice') return "Good day! Professor David here. The audio connection is splendid. What topic shall we discuss today?";
        if (modality === 'video') return "Greetings! Professor David here. Delighted to meet you via video. What area of English would you like to explore today?";
        return "Good day! I am Professor David. It is a pleasure to assist you on your English journey. What would you like to practice today?";
      }
      if (modality === 'voice') return "Hello! I can hear you clearly. How are you today?";
      if (modality === 'video') return "Hello! Great to connect with you over video call. How are you today?";
      return "Hello! It is a pleasure to meet you. What would you like to talk about today?";
    }

    if (lang === 'fr' || lang === 'french') {
      if (name.includes('Amélie') || name.includes('Amelie')) {
        if (modality === 'voice') return "Bonjour ! Je vous entends parfaitement. Bienvenue au café parisien ! Comment allez-vous aujourd'hui ?";
        if (modality === 'video') return "Bonjour ! Quel plaisir de vous voir en direct par appel vidéo. Comment allez-vous aujourd'hui ?";
        return "Bonjour ! Bienvenue au café parisien. Je suis Amélie, ravie de faire votre connaissance ! Comment ça va aujourd'hui ?";
      }
      if (name.includes('Pierre')) {
        if (modality === 'voice') return "Bonjour ! Professeur Pierre à l'appareil. Le son est excellent. De quel sujet souhaitez-vous débattre aujourd'hui ?";
        if (modality === 'video') return "Bonjour ! C'est un réel plaisir de vous retrouver par vidéo pour cette séance de français. Commençons-nous ?";
        return "Bonjour ! C'est un grand plaisir de vous accompagner dans votre apprentissage du français. De quel sujet souhaitez-vous discuter ?";
      }
      if (modality === 'voice') return "Bonjour ! Je vous entends très bien. Comment allez-vous aujourd'hui ?";
      if (modality === 'video') return "Bonjour ! Ravi de vous voir par appel vidéo. De quoi aimerions-nous parler ?";
      return "Bonjour ! C'est un plaisir d'échanger avec vous. De quoi aimeriez-vous parler aujourd'hui ?";
    }

    if (lang === 'de' || lang === 'german') {
      if (name.includes('Lukas')) {
        if (modality === 'voice') return "Hallo! Ich kann dich laut und deutlich hören. Willkommen in München! Wie geht es dir heute?";
        if (modality === 'video') return "Hallo! Wie schön, dich per Videoanruf von Angesicht zu Angesicht zu sehen! Wie geht es dir?";
        return "Hallo! Willkommen in München. Ich bin Lukas und freue mich sehr darauf, mich mit dir zu unterhalten. Wie geht es dir heute?";
      }
      if (name.includes('Hannah')) {
        if (modality === 'voice') return "Guten Tag! Die Verbindung steht super. Ich freue mich darauf, heute mit dir Deutsch zu üben. Worüber möchtest du sprechen?";
        if (modality === 'video') return "Guten Tag! Schön, dich im Videoanruf zu sehen. Bereit für ein spannendes Gespräch auf Deutsch?";
        return "Guten Tag! Schön, dich kennenzulernen. Ich bin Hannah und freue mich darauf, heute mit dir Deutsch zu üben. Worüber möchtest du sprechen?";
      }
      if (modality === 'voice') return "Hallo! Ich kann dich gut hören. Wie geht es dir heute?";
      if (modality === 'video') return "Hallo! Schön, dich im Videoanruf zu sehen. Worüber sprechen wir heute?";
      return "Hallo! Schön, dass du da bist. Worüber möchtest du heute sprechen?";
    }

    if (lang === 'ja' || lang === 'japanese') {
      if (name.includes('Kenji')) {
        if (modality === 'voice') return "こんにちは！声がしっかり聞こえていますよ。通話でお話しできて嬉しいです。今日はいかがですか？";
        if (modality === 'video') return "こんにちは！ビデオ通話でお顔を見ながらお話しできて嬉しいです。今日はいかがお過ごしですか？";
        return "こんにちは！ケンジです。お会いできて嬉しいです。今日はどんなことについて話しましょうか？";
      }
      if (name.includes('Yuki')) {
        if (modality === 'voice') return "こんにちは！ユキです。音声通話がつながりましたね。日本語の練習、ご一緒できて光栄です。";
        if (modality === 'video') return "こんにちは！ビデオ通話でお会いできて嬉しいです。楽しく日本語を練習しましょうね。";
        return "こんにちは！ユキと申します。日本語の学習をご一緒できて光栄です。今日はいかがお過ごしですか？";
      }
      if (modality === 'voice') return "こんにちは！声がよく聞こえます。今日はいかがですか？";
      if (modality === 'video') return "こんにちは！ビデオ通話でお話しできて嬉しいです。";
      return "こんにちは！お話しできて嬉しいです。今日はどんな話をしましょうか？";
    }

    // Default: Spanish (es)
    if (name.includes('Mateo')) {
      if (modality === 'voice') return "¡Hola amigo! Bienvenido al café. Te escucho alto y claro. ¿Qué te gustaría tomar hoy o de qué te apetece charlar?";
      if (modality === 'video') return "¡Hola amigo! Qué alegría saludarte por video. Bienvenido a mi café. ¡Mira qué día tan bueno hace hoy! ¿Te apetece charlar un rato?";
      return "¡Hola amigo! Bienvenido a la cafetería. ¿Qué tal tu día? ¿Te sirvo un café con leche mientras conversamos?";
    }
    if (name.includes('Elena')) {
      if (modality === 'voice') return "¡Buenos días! Es un verdadero placer saludarte por voz. Estoy lista para conversar y ayudarte con tu pronunciación y fluidez. ¿De qué tema hablaremos hoy?";
      if (modality === 'video') return "¡Buenos días! Es un placer compartir esta sesión de videollamada contigo. Podremos practicar la articulación y la expresión visual en español. ¿Comenzamos?";
      return "¡Buenos días! Es un placer compartir este espacio de práctica contigo. ¿Qué tema cultural o lingüístico deseas explorar hoy?";
    }
    if (name.includes('Sofia')) {
      if (modality === 'voice') return "¡Hola viajero! Qué alegría conectar contigo por llamada. Cuéntame, ¿qué tal tu día y qué aventuras tienes en mente?";
      if (modality === 'video') return "¡Hola! Qué ilusión verte en video. Justo estaba revisando mi mapa de viaje. ¡Qué bien tener compañía para practicar español!";
      return "¡Hola! Qué emoción conocerte. Estoy planificando mi próximo viaje por Latinoamérica. ¿A ti te gusta viajar?";
    }
    if (name.includes('Alex')) {
      if (modality === 'voice') return "¡Hola! Me alegro de saludarte. La llamada suena perfecta. ¿Cómo va tu día y tus proyectos tecnológicos?";
      if (modality === 'video') return "¡Hola! Qué tal, qué buena conexión de video tenemos. Me alegra saludarte cara a cara entre reunión y reunión.";
      return "¡Hola! ¿Cómo va todo? Me alegra tener un momento libre entre proyectos para practicar español contigo.";
    }

    if (modality === 'voice') return "¡Hola! Te escucho perfectamente. ¿Cómo estás hoy?";
    if (modality === 'video') return "¡Hola! Qué gusto verte cara a cara por videollamada. Te veo y te escucho de maravilla. ¿Qué tal estás hoy?";
    return "¡Hola! Es un gusto saludarte. ¿De qué te gustaría que hablemos hoy?";
  }

  /**
   * Lists available AI tutor characters, optionally filtered by language and CEFR difficulty.
   */
  async getCharacters(targetLanguageCode?: string, cefrLevel?: CEFRLevel): Promise<AICharacterDTO[]> {
    const where: any = { isActive: true };
    if (targetLanguageCode) {
      where.targetLanguageCode = targetLanguageCode;
    }
    if (cefrLevel) {
      where.difficultyCEFR = cefrLevel;
    }

    const characters = await prisma.aICharacter.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return characters.map((c) => this.mapCharacterToDto(c));
  }

  /**
   * Retrieves a single AI Character by ID.
   */
  async getCharacterById(characterId: string): Promise<AICharacterDTO> {
    const character = await prisma.aICharacter.findUnique({
      where: { id: characterId },
    });

    if (!character || !character.isActive) {
      throw new NotFoundError('AI Character not found or inactive');
    }

    return this.mapCharacterToDto(character);
  }

  /**
   * Starts a new dialogue session between the learner and chosen AI character.
   * Generates a persona-authentic initial welcome greeting.
   */
  async startConversation(userId: string, characterId: string, topic?: string): Promise<AIConversationDTO> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            nativeLanguage: true,
            targetLanguage: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const character = await prisma.aICharacter.findUnique({
      where: { id: characterId },
    });

    if (!character || !character.isActive) {
      throw new NotFoundError('AI Character not found or inactive');
    }

    // Create the conversation session
    const conversation = await prisma.aIConversation.create({
      data: {
        userId,
        characterId,
        topic: topic || 'Daily Conversation & Warm Greetings',
      },
    });

    // Generate initial persona-aligned greeting message
    const welcomeGreeting = this.getOpeningGreeting(character, 'chat');

    // Persist assistant's opening turn
    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        senderRole: 'ASSISTANT',
        content: welcomeGreeting,
      },
    });

    return this.getConversation(userId, conversation.id);
  }

  /**
   * Retrieves active or past conversation details including all message history and episodic memories.
   */
  async getConversation(userId: string, conversationId: string): Promise<AIConversationDTO> {
    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId },
      include: {
        character: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        memories: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundError('Conversation not found');
    }

    const messagesDto: AIMessageDTO[] = conversation.messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderRole: m.senderRole as 'USER' | 'ASSISTANT',
      content: m.content,
      audioUrl: m.audioUrl,
      correctionNote: m.correctionNote,
      createdAt: m.createdAt.toISOString(),
    }));

    return {
      id: conversation.id,
      userId: conversation.userId,
      characterId: conversation.characterId,
      character: this.mapCharacterToDto(conversation.character),
      topic: conversation.topic,
      startedAt: conversation.startedAt.toISOString(),
      endedAt: conversation.endedAt ? conversation.endedAt.toISOString() : null,
      messages: messagesDto,
      memories: conversation.memories.map((mem) => ({
        id: mem.id,
        memoryKey: mem.memoryKey,
        memoryValue: mem.memoryValue,
        createdAt: mem.createdAt.toISOString(),
      })),
      totalTurns: messagesDto.length,
    };
  }

  /**
   * Lists past conversations for a user.
   */
  async listUserConversations(userId: string): Promise<AIConversationDTO[]> {
    const conversations = await prisma.aIConversation.findMany({
      where: { userId },
      include: {
        character: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        memories: true,
      },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });

    return conversations.map((conv) => {
      const messagesDto: AIMessageDTO[] = conv.messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderRole: m.senderRole as 'USER' | 'ASSISTANT',
        content: m.content,
        audioUrl: m.audioUrl,
        correctionNote: m.correctionNote,
        createdAt: m.createdAt.toISOString(),
      }));

      return {
        id: conv.id,
        userId: conv.userId,
        characterId: conv.characterId,
        character: this.mapCharacterToDto(conv.character),
        topic: conv.topic,
        startedAt: conv.startedAt.toISOString(),
        endedAt: conv.endedAt ? conv.endedAt.toISOString() : null,
        messages: messagesDto,
        memories: conv.memories.map((mem) => ({
          id: mem.id,
          memoryKey: mem.memoryKey,
          memoryValue: mem.memoryValue,
          createdAt: mem.createdAt.toISOString(),
        })),
        totalTurns: messagesDto.length,
      };
    });
  }

  /**
   * Sends a user utterance to the AI tutor, generates an adaptive reply,
   * extracts non-intrusive pedagogical corrections and episodic memories,
   * and server-authoritatively awards micro-interaction XP.
   */
  async sendMessage(userId: string, conversationId: string, content: string) {
    if (!content || !content.trim()) {
      throw new BadRequestError('Message content cannot be empty');
    }

    if (content.length > 4000) {
      throw new BadRequestError('Message exceeds maximum allowed length of 4000 characters');
    }

    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId },
      include: {
        character: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 15,
        },
        memories: true,
        user: {
          include: { profile: true },
        },
      },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundError('Conversation not found');
    }

    if (conversation.endedAt) {
      throw new BadRequestError('Conversation has already ended. Please start a new session.');
    }

    // 1. Save user utterance
    const userMsg = await prisma.aIMessage.create({
      data: {
        conversationId,
        senderRole: 'USER',
        content: content.trim(),
      },
    });

    // 2. Build context for AI Provider
    const history = conversation.messages.map((m) => ({
      role: (m.senderRole === 'ASSISTANT' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: m.content,
    }));

    const memories = conversation.memories.map((m) => ({
      key: m.memoryKey,
      value: m.memoryValue,
    }));

    const targetLang = conversation.character.targetLanguageCode || 'es';
    const nativeLang = conversation.user.profile?.nativeLanguageId || 'en';
    const cefrLevel = conversation.user.profile?.currentLevel || 'A1';

    // 3. Generate response via vendor-agnostic adapter
    const aiResponse = await this.aiProvider.generateReply({
      targetLanguage: targetLang,
      nativeLanguage: nativeLang,
      cefrLevel,
      characterName: conversation.character.name,
      personalityPrompt: conversation.character.personalityPrompt,
      topic: conversation.topic || undefined,
      memories,
      history,
      latestUserMessage: content.trim(),
    });

    // 4. Save assistant reply
    const assistantMsg = await prisma.aIMessage.create({
      data: {
        conversationId,
        senderRole: 'ASSISTANT',
        content: aiResponse.reply,
        audioUrl: aiResponse.audioUrl,
        correctionNote: aiResponse.correctionNote,
      },
    });

    // 5. Save newly extracted episodic memories
    if (aiResponse.newMemories && aiResponse.newMemories.length > 0) {
      for (const mem of aiResponse.newMemories) {
        await prisma.aIConversationMemory.create({
          data: {
            conversationId,
            memoryKey: mem.key,
            memoryValue: mem.value,
          },
        });
      }
    }

    // 6. Award micro interaction XP
    const xpAwarded = ProgressionConfig.XP_REWARDS.AI_MESSAGE_SENT || 3;
    await xpService.awardXp({
      userId,
      amount: xpAwarded,
      reason: 'AI_MESSAGE_SENT',
      idempotencyKey: `ai_msg:${userMsg.id}`,
      referenceId: userMsg.id,
    });

    return {
      userMessage: {
        id: userMsg.id,
        conversationId: userMsg.conversationId,
        senderRole: 'USER',
        content: userMsg.content,
        createdAt: userMsg.createdAt.toISOString(),
      },
      assistantMessage: {
        id: assistantMsg.id,
        conversationId: assistantMsg.conversationId,
        senderRole: 'ASSISTANT',
        content: assistantMsg.content,
        audioUrl: assistantMsg.audioUrl,
        correctionNote: assistantMsg.correctionNote,
        createdAt: assistantMsg.createdAt.toISOString(),
      },
      xpAwarded,
      newMemories: aiResponse.newMemories || [],
    };
  }

  /**
   * Concludes a conversational session, authoritatively awards completion XP & Gems,
   * updates quests, streaks, daily goals, checks achievements, and returns debrief summary.
   */
  async endConversation(userId: string, conversationId: string, durationSec: number = 120): Promise<ConversationDebriefDTO> {
    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId },
      include: {
        character: true,
        messages: true,
      },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundError('Conversation not found');
    }

    const wasAlreadyEnded = conversation.endedAt !== null;

    if (!wasAlreadyEnded) {
      await prisma.aIConversation.update({
        where: { id: conversationId },
        data: { endedAt: new Date() },
      });
    }

    const totalMessages = conversation.messages.length;
    const corrections = conversation.messages.filter((m) => m.correctionNote && m.correctionNote.length > 0);
    const correctionsCount = corrections.length;

    let xpAwarded = 0;
    let gemsAwarded = 0;
    const unlockedAchievements: string[] = [];

    if (!wasAlreadyEnded) {
      // Authoritatively award completion rewards
      xpAwarded = ProgressionConfig.XP_REWARDS.AI_CONVERSATION_COMPLETED || 15;
      gemsAwarded = ProgressionConfig.GEM_REWARDS.AI_CONVERSATION_COMPLETED || 2;

      await xpService.awardXp({
        userId,
        amount: xpAwarded,
        reason: 'AI_CONVERSATION_COMPLETED',
        idempotencyKey: `ai_complete:${conversationId}`,
        referenceId: conversationId,
      });

      await currencyService.credit({
        userId,
        amount: gemsAwarded,
        reason: 'AI_CONVERSATION_COMPLETED',
        idempotencyKey: `ai_gems:${conversationId}`,
        referenceId: conversationId,
      });

      // Update quests progress
      await questsService.recordQuestProgress(userId, 'AI_CHAT', 1);

      // Check and unlock FIRST_AI_CONVERSATION achievement
      const ach = await achievementsService.unlockAchievement(userId, 'FIRST_AI_CONVERSATION');
      if (ach) {
        unlockedAchievements.push(ach.code);
      }

      // Record daily practice minutes & streak activity
      const minutesSpent = Math.max(1, Math.round(durationSec / 60));
      await dailyGoalService.recordActivityTime(userId, minutesSpent);
      await streakService.recordActivity(userId);
    }

    return {
      conversationId: conversation.id,
      characterName: conversation.character.name,
      totalMessages,
      correctionsCount,
      durationSec,
      xpAwarded,
      gemsAwarded,
      unlockedAchievements,
      vocabularyPracticed: ['saludos', 'conversación', 'café', 'viajes'],
      feedbackSummary: correctionsCount === 0
        ? '¡Excelente fluidez y vocabulario! Mantuviste una conversación natural sin errores notables.'
        : `Gran práctica activa. Recibiste ${correctionsCount} sugerencia(s) pedagógica(s) para pulir tu precisión gramatical.`,
    };
  }

  // ----------------------------------------------------------------------------
  // PHASE 6: AI VOICE CALLING
  // ----------------------------------------------------------------------------

  private activeVoiceCalls = new Map<string, {
    callId: string;
    userId: string;
    characterId: string;
    conversationId: string;
    startedAt: Date;
    endedAt?: Date;
    turnCount: number;
    accumulatedAccuracy: number;
    accumulatedFluency: number;
    wordsSpokenEstimate: number;
    greetingText: string;
    greetingAudioBase64: string;
    audioMimeType: string;
    status: 'CONNECTING' | 'CONNECTED' | 'ENDED';
  }>();

  /**
   * Initiates a live AI voice call session with the chosen character.
   * Creates underlying conversation, synthesizes spoken greeting, and returns call metadata.
   */
  async initiateVoiceCall(userId: string, input: InitiateVoiceCallInput): Promise<AIVoiceCallDTO> {
    const character = await prisma.aICharacter.findUnique({
      where: { id: input.characterId },
    });

    if (!character || !character.isActive) {
      throw new NotFoundError('AI Character not found or inactive');
    }

    const topic = input.topic || 'Práctica de pronunciación y conversación fluida';

    // 1. Create underlying conversation entity
    const conversation = await prisma.aIConversation.create({
      data: {
        userId,
        characterId: character.id,
        topic,
      },
      include: {
        character: true,
      },
    });

    const callId = `call-${conversation.id}`;

    // 2. Generate persona-aligned voice greeting
    const greetingText = this.getOpeningGreeting(character, 'voice');

    // 3. Synthesize speech for the greeting
    const speechResult = await this.aiProvider.generateSpeech(
      greetingText,
      character.defaultVoice,
      character.targetLanguageCode
    );

    // 4. Save greeting as first message in DB
    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        senderRole: 'ASSISTANT',
        content: greetingText,
      },
    });

    // 5. Store active call state
    const sessionState = {
      callId,
      userId,
      characterId: character.id,
      conversationId: conversation.id,
      startedAt: new Date(),
      turnCount: 0,
      accumulatedAccuracy: 0,
      accumulatedFluency: 0,
      wordsSpokenEstimate: 0,
      greetingText,
      greetingAudioBase64: speechResult.audioBase64,
      audioMimeType: speechResult.mimeType,
      status: 'CONNECTED' as const,
    };
    this.activeVoiceCalls.set(callId, sessionState);

    const characterDto = this.mapCharacterToDto(character);

    return {
      id: callId,
      conversationId: conversation.id,
      characterId: character.id,
      character: characterDto,
      status: 'CONNECTED',
      startedAt: sessionState.startedAt.toISOString(),
      endedAt: null,
      durationSec: 0,
      turnCount: 0,
      greetingText,
      greetingAudioBase64: speechResult.audioBase64,
      audioMimeType: speechResult.mimeType,
      audioStreamEndpoint: `/api/v1/ai/calls/${callId}/stream`,
    };
  }

  /**
   * Processes a spoken user turn: transcribes, grades pronunciation & fluency, generates AI reply and voice audio.
   */
  async processVoiceTurn(userId: string, callId: string, input: VoiceTurnInput): Promise<VoiceTurnResponseDTO> {
    const session = this.activeVoiceCalls.get(callId);
    if (!session || session.userId !== userId || session.status === 'ENDED') {
      throw new NotFoundError('Active voice call session not found');
    }

    const character = await prisma.aICharacter.findUnique({
      where: { id: session.characterId },
    });
    if (!character) {
      throw new NotFoundError('Character associated with call not found');
    }

    // 1. Evaluate speech acoustic & phonetic features
    const evalResult = await this.aiProvider.evaluateSpeech(
      {
        audioBase64: input.audioBase64,
        spokenText: input.spokenText,
        audioDurationMs: input.audioDurationMs,
      },
      character.targetLanguageCode
    );

    const userText = evalResult.transcription;

    // 2. Persist user spoken utterance in database
    await prisma.aIMessage.create({
      data: {
        conversationId: session.conversationId,
        senderRole: 'USER',
        content: userText,
      },
    });

    // 3. Retrieve conversational context
    const conversation = await prisma.aIConversation.findUnique({
      where: { id: session.conversationId },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 15 },
        memories: true,
      },
    });

    const history = (conversation?.messages || []).map((m) => ({
      role: m.senderRole.toLowerCase() as 'user' | 'assistant',
      content: m.content,
    }));

    const memories = (conversation?.memories || []).map((m) => ({
      key: m.memoryKey,
      value: m.memoryValue,
    }));

    // 4. Retrieve learner profile for native language context
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    const nativeLang = user?.profile?.nativeLanguageId || 'en';

    // 5. Generate conversational reply
    const replyResult = await this.aiProvider.generateReply({
      targetLanguage: character.targetLanguageCode,
      nativeLanguage: nativeLang,
      cefrLevel: user?.profile?.currentLevel || character.difficultyCEFR,
      characterName: character.name,
      personalityPrompt: character.personalityPrompt,
      topic: conversation?.topic || undefined,
      memories,
      history,
      latestUserMessage: userText,
    });

    // 5. Store new memories if extracted
    if (replyResult.newMemories && replyResult.newMemories.length > 0) {
      for (const mem of replyResult.newMemories) {
        await prisma.aIConversationMemory.create({
          data: {
            conversationId: session.conversationId,
            memoryKey: mem.key,
            memoryValue: mem.value,
          },
        });
      }
    }

    // 6. Synthesize assistant reply audio
    const speechResult = await this.aiProvider.generateSpeech(
      replyResult.reply,
      character.defaultVoice,
      character.targetLanguageCode
    );

    // 7. Persist assistant message with pedagogical note
    await prisma.aIMessage.create({
      data: {
        conversationId: session.conversationId,
        senderRole: 'ASSISTANT',
        content: replyResult.reply,
        correctionNote: replyResult.correctionNote,
      },
    });

    // 8. Update session metrics
    session.turnCount += 1;
    session.accumulatedAccuracy += evalResult.accuracyScore;
    session.accumulatedFluency += evalResult.fluencyScore;
    const wordsCount = userText.split(/\s+/).filter(Boolean).length;
    session.wordsSpokenEstimate += wordsCount;

    // 9. Award speaking micro-XP (+5 XP per spoken turn)
    const xpAwarded = 5;
    await xpService.awardXp({
      userId,
      amount: xpAwarded,
      reason: 'AI_VOICE_TURN',
      idempotencyKey: `ai_vturn:${callId}:${session.turnCount}`,
      referenceId: callId,
    });

    return {
      turnIndex: session.turnCount,
      userTranscription: userText,
      pronunciationScore: evalResult.accuracyScore,
      fluencyScore: evalResult.fluencyScore,
      phonemeFeedback: evalResult.phonemeFeedback,
      assistantReply: replyResult.reply,
      assistantAudioBase64: speechResult.audioBase64,
      audioMimeType: speechResult.mimeType,
      correctionNote: replyResult.correctionNote,
      pronunciationAdvice: evalResult.pronunciationAdvice,
      xpAwarded,
      totalTurns: session.turnCount,
    };
  }

  /**
   * Concludes the live voice call session and generates gamified pronunciation & fluency debrief.
   */
  async endVoiceCall(userId: string, callId: string, input: EndVoiceCallInput): Promise<VoiceCallDebriefDTO> {
    const session = this.activeVoiceCalls.get(callId);
    if (!session || session.userId !== userId) {
      throw new NotFoundError('Voice call session not found');
    }

    session.status = 'ENDED';
    const endedAt = new Date();
    session.endedAt = endedAt;

    const character = await prisma.aICharacter.findUnique({
      where: { id: session.characterId },
    });
    if (!character) {
      throw new NotFoundError('Character not found');
    }

    // 1. Calculate duration
    let durationSec = input.durationSec;
    if (!durationSec || durationSec <= 0) {
      durationSec = Math.max(15, Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000));
    }

    // 2. Mark conversation ended in DB
    await prisma.aIConversation.update({
      where: { id: session.conversationId },
      data: { endedAt },
    });

    // 3. Compute aggregate scores
    const turns = session.turnCount;
    const overallAccuracy = turns > 0 ? Math.round(session.accumulatedAccuracy / turns) : 88;
    const overallFluency = turns > 0 ? Math.round(session.accumulatedFluency / turns) : 85;
    const wordsSpoken = session.wordsSpokenEstimate > 0 ? session.wordsSpokenEstimate : Math.max(12, turns * 7);
    const wordsPerMinute = Math.min(180, Math.round((wordsSpoken / Math.max(10, durationSec)) * 60));

    // 4. Award authoritative completion rewards (+25 XP, +3 Gems)
    const xpAwarded = 25;
    const gemsAwarded = 3;

    await xpService.awardXp({
      userId,
      amount: xpAwarded,
      reason: 'AI_VOICE_CALL_COMPLETED',
      idempotencyKey: `ai_voice_complete:${callId}`,
      referenceId: callId,
    });

    await currencyService.credit({
      userId,
      amount: gemsAwarded,
      reason: 'AI_VOICE_CALL_REWARD',
      idempotencyKey: `ai_voice_gems:${callId}`,
      referenceId: callId,
    });

    // 5. Unlock FIRST_AI_VOICE_CALL achievement
    const unlockedAchievements: string[] = [];
    const ach = await achievementsService.unlockAchievement(userId, 'FIRST_AI_VOICE_CALL');
    if (ach) {
      unlockedAchievements.push(ach.code);
    }

    // 6. Update Quests & Streak
    await questsService.recordQuestProgress(userId, 'AI_VOICE_CALL', 1);
    await questsService.recordQuestProgress(userId, 'EARN_XP', xpAwarded);
    await streakService.recordActivity(userId);
    const minutesSpent = Math.max(1, Math.ceil(durationSec / 60));
    await dailyGoalService.recordActivityTime(userId, minutesSpent);

    // 7. Generate pronunciation highlights
    const pronunciationHighlights: string[] = [];
    if (overallAccuracy >= 90) {
      pronunciationHighlights.push('Superb vowel clarity and native-like rhythm.');
      pronunciationHighlights.push('Accurate syllable stress in Spanish phrasing.');
    } else {
      pronunciationHighlights.push('Good vocal projection with steady cadence.');
      pronunciationHighlights.push('Focus on rolling the alveolar "rr" and pure vowels.');
    }

    const feedbackSummary = overallAccuracy >= 90
      ? `¡Brillante llamada con ${character.name}! Tu fluidez alcanzó ${wordsPerMinute} palabras por minuto con una pronunciación sobresaliente.`
      : `¡Excelente llamada de práctica con ${character.name}! Completaste ${turns} turno(s) de conversación oral activa.`;

    return {
      callId,
      characterName: character.name,
      totalDurationSec: durationSec,
      turnsCompleted: turns,
      overallAccuracy,
      overallFluency,
      wordsSpokenEstimate: wordsSpoken,
      wordsPerMinute,
      xpAwarded,
      gemsAwarded,
      unlockedAchievements,
      pronunciationHighlights,
      feedbackSummary,
    };
  }

  /**
   * Retrieves active or completed voice call session state.
   */
  async getVoiceCall(userId: string, callId: string): Promise<AIVoiceCallDTO> {
    const session = this.activeVoiceCalls.get(callId);
    if (!session || session.userId !== userId) {
      const conversationId = callId.replace(/^call-/, '');
      const conv = await prisma.aIConversation.findUnique({
        where: { id: conversationId },
        include: { character: true, messages: true },
      });
      if (!conv || conv.userId !== userId) {
        throw new NotFoundError('Voice call not found');
      }

      return {
        id: callId,
        conversationId: conv.id,
        characterId: conv.characterId,
        character: this.mapCharacterToDto(conv.character),
        status: conv.endedAt ? 'ENDED' : 'CONNECTED',
        startedAt: conv.startedAt.toISOString(),
        endedAt: conv.endedAt?.toISOString() || null,
        durationSec: conv.endedAt
          ? Math.round((conv.endedAt.getTime() - conv.startedAt.getTime()) / 1000)
          : 0,
        turnCount: conv.messages.filter((m) => m.senderRole === 'USER').length,
        greetingText: conv.messages[0]?.content || '¡Hola!',
        greetingAudioBase64: undefined,
        audioMimeType: 'audio/wav',
      };
    }

    const character = await prisma.aICharacter.findUnique({
      where: { id: session.characterId },
    });
    if (!character) {
      throw new NotFoundError('Character not found');
    }

    return {
      id: callId,
      conversationId: session.conversationId,
      characterId: session.characterId,
      character: this.mapCharacterToDto(character),
      status: session.status,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt?.toISOString() || null,
      durationSec: session.endedAt
        ? Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000)
        : Math.round((Date.now() - session.startedAt.getTime()) / 1000),
      turnCount: session.turnCount,
      greetingText: session.greetingText,
      greetingAudioBase64: session.greetingAudioBase64,
      audioMimeType: session.audioMimeType,
    };
  }

  // ----------------------------------------------------------------------------
  // PHASE 7: AI VIDEO CALLING (Avatar Animation, Visemes, & Visual Scenario Props)
  // ----------------------------------------------------------------------------

  /**
   * Initializes a live interactive video calling session with an AI tutor avatar,
   * setting up scenario visual aid cards and synchronized animation visemes.
   */
  async initiateVideoCall(userId: string, input: InitiateVideoCallInput): Promise<AIVideoCallDTO> {
    const character = await prisma.aICharacter.findUnique({
      where: { id: input.characterId },
    });
    if (!character || !character.isActive) {
      throw new NotFoundError('AI Character not found or inactive');
    }

    const topic = input.topic || 'Inmersión visual y conversación cara a cara';
    const sceneSetting = input.sceneSetting || (
      character.name.includes('Mateo') ? 'Cafetería de Especialidad en Madrid' :
      character.name.includes('Sofia') ? 'Centro Histórico y Metro de la Ciudad' :
      character.name.includes('Elena') ? 'Seminario Académico y Biblioteca' :
      'Espacio de Co-working y Startups'
    );

    // 1. Create underlying conversation entity
    const conversation = await prisma.aIConversation.create({
      data: {
        userId,
        characterId: character.id,
        topic,
      },
      include: {
        character: true,
      },
    });

    const callId = `vcall-${conversation.id}`;

    // 2. Generate persona-aligned video greeting
    const greetingText = this.getOpeningGreeting(character, 'video');

    // 3. Synthesize speech for greeting
    const speechResult = await this.aiProvider.generateSpeech(
      greetingText,
      character.defaultVoice,
      character.targetLanguageCode
    );

    // 4. Generate avatar visemes & animation
    const initialAnim = this.aiProvider.generateAvatarAnimation(greetingText, 'happy', speechResult.durationSec);

    // 5. Get initial scene visual aid
    const initialVisualAid = this.aiProvider.getSceneVisualAid(character.name, sceneSetting);

    // 6. Save greeting as message in DB
    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        senderRole: 'ASSISTANT',
        content: greetingText,
      },
    });

    // 7. Store active video call state
    const sessionState: VideoCallSessionState = {
      callId,
      userId,
      characterId: character.id,
      conversationId: conversation.id,
      startedAt: new Date(),
      turnCount: 0,
      accumulatedAccuracy: 0,
      accumulatedFluency: 0,
      accumulatedFacialEngagement: 0,
      wordsSpokenEstimate: 0,
      visualAidsExplored: initialVisualAid ? 1 : 0,
      currentEmotion: 'happy',
      sceneSetting,
      greetingText,
      greetingAudioBase64: speechResult.audioBase64,
      audioMimeType: speechResult.mimeType,
      status: 'CONNECTED',
    };
    this.activeVideoCalls.set(callId, sessionState);

    const characterDto = this.mapCharacterToDto(character);

    return {
      id: callId,
      conversationId: conversation.id,
      characterId: character.id,
      character: characterDto,
      status: 'CONNECTED',
      startedAt: sessionState.startedAt.toISOString(),
      endedAt: null,
      durationSec: 0,
      turnCount: 0,
      greetingText,
      greetingAudioBase64: speechResult.audioBase64,
      audioMimeType: speechResult.mimeType,
      currentEmotion: 'happy',
      initialVisemes: initialAnim.visemes,
      initialVisualAid,
      sceneSetting,
    };
  }

  /**
   * Processes an interactive video turn: parses spoken words, evaluates phonetic accuracy,
   * generates pedagogical response with lip-synced visemes, emotions, gestures, and optional visual aid props.
   */
  async processVideoTurn(userId: string, callId: string, input: VideoTurnInput): Promise<VideoTurnResponseDTO> {
    const session = this.activeVideoCalls.get(callId);
    if (!session || session.userId !== userId) {
      throw new NotFoundError('Video call session not found');
    }
    if (session.status === 'ENDED') {
      throw new BadRequestError('Video call has already ended');
    }

    const character = await prisma.aICharacter.findUnique({
      where: { id: session.characterId },
    });
    if (!character) {
      throw new NotFoundError('AI Character not found');
    }

    // 1. Evaluate spoken speech phonetics and clarity
    const evalResult = await this.aiProvider.evaluateSpeech(
      {
        audioBase64: input.audioBase64,
        spokenText: input.spokenText,
        audioDurationMs: input.audioDurationMs || 2000,
      },
      character.targetLanguageCode
    );

    const userText = evalResult.transcription || input.spokenText || 'Hola';

    // 2. Persist user message in conversation
    await prisma.aIMessage.create({
      data: {
        conversationId: session.conversationId,
        senderRole: 'USER',
        content: userText,
      },
    });

    // 3. Fetch recent conversation history and memories
    const conversation = await prisma.aIConversation.findUnique({
      where: { id: session.conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 6,
        },
        memories: true,
      },
    });

    const history = (conversation?.messages || [])
      .reverse()
      .map((m) => ({
        role: (m.senderRole === 'USER' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      }));

    const memories = (conversation?.memories || []).map((mem) => ({
      key: mem.memoryKey,
      value: mem.memoryValue,
    }));

    // 4. Retrieve learner profile for native language context
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    const nativeLang = user?.profile?.nativeLanguageId || 'en';

    // 5. Generate AI pedagogical reply
    const replyResult = await this.aiProvider.generateReply({
      targetLanguage: character.targetLanguageCode,
      nativeLanguage: nativeLang,
      cefrLevel: user?.profile?.currentLevel || character.difficultyCEFR,
      characterName: character.name,
      personalityPrompt: character.personalityPrompt,
      memories,
      history,
      latestUserMessage: userText,
    });

    // 5. Store new memories if extracted
    if (replyResult.newMemories && replyResult.newMemories.length > 0) {
      for (const mem of replyResult.newMemories) {
        await prisma.aIConversationMemory.create({
          data: {
            conversationId: session.conversationId,
            memoryKey: mem.key,
            memoryValue: mem.value,
          },
        });
      }
    }

    // 6. Synthesize audio
    const speechResult = await this.aiProvider.generateSpeech(
      replyResult.reply,
      character.defaultVoice,
      character.targetLanguageCode
    );

    // 7. Dynamic emotion and facial engagement calculation
    let emotion: AvatarEmotion = 'happy';
    let facialEngagementScore = 88;

    if (input.requestHelpHint) {
      emotion = 'encouraging';
      facialEngagementScore = 85;
    } else if (evalResult.accuracyScore >= 95) {
      emotion = 'celebrating';
      facialEngagementScore = 96;
    } else if (replyResult.correctionNote) {
      emotion = 'encouraging';
      facialEngagementScore = 84;
    } else if (userText.toLowerCase().includes('por qué') || userText.toLowerCase().includes('cómo')) {
      emotion = 'thoughtful';
      facialEngagementScore = 90;
    }

    // 8. Generate synchronized avatar viseme sequence and gesture
    const animResult = this.aiProvider.generateAvatarAnimation(
      replyResult.reply,
      emotion,
      speechResult.durationSec
    );

    // 9. Visual aid cue (scene prop or hint flashcard)
    let visualAid: VisualAidCueDTO | null = null;
    if (input.requestHelpHint) {
      visualAid = this.aiProvider.getSceneVisualAid(character.name, session.sceneSetting, true);
      session.visualAidsExplored += 1;
    } else if (session.turnCount === 1) {
      visualAid = this.aiProvider.getSceneVisualAid(character.name, session.sceneSetting, false);
      if (visualAid) session.visualAidsExplored += 1;
    }

    // 10. Persist assistant message
    await prisma.aIMessage.create({
      data: {
        conversationId: session.conversationId,
        senderRole: 'ASSISTANT',
        content: replyResult.reply,
        correctionNote: replyResult.correctionNote,
      },
    });

    // 11. Update session metrics
    session.turnCount += 1;
    session.accumulatedAccuracy += evalResult.accuracyScore;
    session.accumulatedFluency += evalResult.fluencyScore;
    session.accumulatedFacialEngagement += facialEngagementScore;
    session.currentEmotion = emotion;
    const wordsCount = userText.split(/\s+/).filter(Boolean).length;
    session.wordsSpokenEstimate += wordsCount;

    // 12. Award video speaking micro-XP (+7 XP per video turn)
    const xpAwarded = 7;
    await xpService.awardXp({
      userId,
      amount: xpAwarded,
      reason: 'AI_VIDEO_TURN',
      idempotencyKey: `ai_vturn:${callId}:${session.turnCount}`,
      referenceId: callId,
    });

    return {
      turnIndex: session.turnCount,
      userTranscription: userText,
      pronunciationScore: evalResult.accuracyScore,
      fluencyScore: evalResult.fluencyScore,
      facialEngagementScore,
      phonemeFeedback: evalResult.phonemeFeedback,
      assistantReply: replyResult.reply,
      assistantAudioBase64: speechResult.audioBase64,
      audioMimeType: speechResult.mimeType,
      emotion: animResult.emotion,
      gesture: animResult.gesture,
      visemes: animResult.visemes,
      visualAid,
      correctionNote: replyResult.correctionNote,
      pronunciationAdvice: evalResult.pronunciationAdvice,
      difficultyLevel: character.difficultyCEFR,
      xpAwarded,
      totalTurns: session.turnCount,
    };
  }

  /**
   * Concludes the interactive video call session and generates debrief metrics,
   * awarding authoritative XP, Gems, daily quest progress, and the FIRST_AI_VIDEO_CALL achievement.
   */
  async endVideoCall(userId: string, callId: string, input: EndVideoCallInput): Promise<VideoCallDebriefDTO> {
    const session = this.activeVideoCalls.get(callId);
    if (!session || session.userId !== userId) {
      throw new NotFoundError('Video call session not found');
    }

    session.status = 'ENDED';
    const endedAt = new Date();
    session.endedAt = endedAt;

    const character = await prisma.aICharacter.findUnique({
      where: { id: session.characterId },
    });
    if (!character) {
      throw new NotFoundError('Character not found');
    }

    // 1. Calculate duration
    let durationSec = input.durationSec;
    if (!durationSec || durationSec <= 0) {
      durationSec = Math.max(20, Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000));
    }

    // 2. Mark conversation ended in DB
    await prisma.aIConversation.update({
      where: { id: session.conversationId },
      data: { endedAt },
    });

    // 3. Compute aggregate scores
    const turns = session.turnCount;
    const overallAccuracy = turns > 0 ? Math.round(session.accumulatedAccuracy / turns) : 90;
    const overallFluency = turns > 0 ? Math.round(session.accumulatedFluency / turns) : 88;
    const facialEngagementScore = turns > 0 ? Math.round(session.accumulatedFacialEngagement / turns) : 92;
    const wordsSpoken = session.wordsSpokenEstimate > 0 ? session.wordsSpokenEstimate : Math.max(15, turns * 8);
    const wordsPerMinute = Math.min(180, Math.round((wordsSpoken / Math.max(10, durationSec)) * 60));

    // 4. Award authoritative completion rewards (+35 XP, +5 Gems)
    const xpAwarded = 35;
    const gemsAwarded = 5;

    await xpService.awardXp({
      userId,
      amount: xpAwarded,
      reason: 'AI_VIDEO_CALL_COMPLETED',
      idempotencyKey: `ai_video_complete:${callId}`,
      referenceId: callId,
    });

    await currencyService.credit({
      userId,
      amount: gemsAwarded,
      reason: 'AI_VIDEO_CALL_REWARD',
      idempotencyKey: `ai_video_gems:${callId}`,
      referenceId: callId,
    });

    // 5. Unlock FIRST_AI_VIDEO_CALL achievement
    const unlockedAchievements: string[] = [];
    const ach = await achievementsService.unlockAchievement(userId, 'FIRST_AI_VIDEO_CALL');
    if (ach) {
      unlockedAchievements.push(ach.code);
    }

    // 6. Update daily quest progress
    await questsService.recordQuestProgress(userId, 'AI_VIDEO_CALL', 1);
    await questsService.recordQuestProgress(userId, 'EARN_XP', xpAwarded);

    // 7. Maintain streak & update daily activity time
    await streakService.recordActivity(userId);
    const minutesSpent = Math.max(1, Math.ceil(durationSec / 60));
    await dailyGoalService.recordActivityTime(userId, minutesSpent);

    // 9. Highlights & summary
    const pronunciationHighlights = [
      'Visual eye contact and face expression responsiveness: Excellent',
      'Synchronized mouth articulation across open vowels: Strong',
      overallAccuracy >= 90
        ? 'Great natural Spanish intonation and speech clarity!'
        : 'Solid effort with smooth conversational rhythm.',
    ];

    const feedbackSummary = `Fantástica videollamada con ${character.name}. Practicaste ${turns} turnos de conversación con soporte visual, completaste ${durationSec} segundos cara a cara y mantuviste un nivel de fluidez del ${overallFluency}%.`;

    return {
      callId,
      characterName: character.name,
      totalDurationSec: durationSec,
      turnsCompleted: turns,
      overallAccuracy,
      overallFluency,
      facialEngagementScore,
      wordsSpokenEstimate: wordsSpoken,
      wordsPerMinute,
      xpAwarded,
      gemsAwarded,
      unlockedAchievements,
      pronunciationHighlights,
      visualAidsExplored: Math.max(1, session.visualAidsExplored),
      feedbackSummary,
    };
  }

  /**
   * Retrieves active video call metadata.
   */
  async getVideoCall(userId: string, callId: string): Promise<AIVideoCallDTO> {
    const session = this.activeVideoCalls.get(callId);
    if (!session || session.userId !== userId) {
      throw new NotFoundError('Video call session not found');
    }

    const character = await prisma.aICharacter.findUnique({
      where: { id: session.characterId },
    });
    if (!character) {
      throw new NotFoundError('AI Character not found');
    }

    const elapsed = Math.round((new Date().getTime() - session.startedAt.getTime()) / 1000);
    const initialVisualAid = this.aiProvider.getSceneVisualAid(character.name, session.sceneSetting);

    return {
      id: session.callId,
      conversationId: session.conversationId,
      characterId: character.id,
      character: this.mapCharacterToDto(character),
      status: session.status,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt?.toISOString() || null,
      durationSec: elapsed,
      turnCount: session.turnCount,
      greetingText: session.greetingText,
      greetingAudioBase64: session.greetingAudioBase64,
      audioMimeType: session.audioMimeType,
      currentEmotion: session.currentEmotion,
      initialVisemes: [],
      initialVisualAid,
      sceneSetting: session.sceneSetting,
    };
  }

  private mapCharacterToDto(c: any): AICharacterDTO {
    let scenarioTitle = 'General Dialogue';
    let suggestedTopics = ['Daily Life', 'Greetings', 'Introductions'];

    if (c.name.includes('Mateo')) {
      scenarioTitle = 'Café & Ordering in Madrid';
      suggestedTopics = ['Pedir un café', 'Desayunos españoles', 'El tiempo hoy', 'Planes de fin de semana'];
    } else if (c.name.includes('Elena')) {
      scenarioTitle = 'Culture & Academic Inquiry';
      suggestedTopics = ['Literatura hispana', 'Diferencias lingüísticas', 'Historia de España', 'Arte y poesía'];
    } else if (c.name.includes('Sofia')) {
      scenarioTitle = 'Backpacking & Adventures';
      suggestedTopics = ['Lugares para visitar', 'Pedir direcciones', 'Comida callejera', 'Historias de viajes'];
    } else if (c.name.includes('Alex')) {
      scenarioTitle = 'Tech & Professional Work';
      suggestedTopics = ['Trabajo remoto', 'Proyectos tecnológicos', 'Innovación', 'Reuniones de equipo'];
    }

    return {
      id: c.id,
      name: c.name,
      avatarUrl: c.avatarUrl,
      personalityPrompt: c.personalityPrompt,
      defaultVoice: c.defaultVoice,
      targetLanguageCode: c.targetLanguageCode,
      difficultyCEFR: c.difficultyCEFR,
      isActive: c.isActive,
      scenarioTitle,
      suggestedTopics,
    };
  }
}

export const aiService = new AIService();
