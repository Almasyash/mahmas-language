// ==============================================================================
// MAHMAS LANGUAGE — AI TUTOR SERVICE
// Conversational AI tutor orchestration, pedagogical feedback, memory, & rewards
// ==============================================================================

import { CEFRLevel } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { NotFoundError, BadRequestError } from '../../common/errors';
import { AIProviderFactory } from './ai-provider.adapter';
import {
  AICharacterDTO,
  AIConversationDTO,
  AIMessageDTO,
  ConversationDebriefDTO,
} from './ai.types';
import { xpService } from '../progression/xp.service';
import { currencyService } from '../progression/currency.service';
import { questsService } from '../progression/quests.service';
import { achievementsService } from '../progression/achievements.service';
import { streakService } from '../progression/streak.service';
import { dailyGoalService } from '../progression/daily-goal.service';
import { ProgressionConfig } from '../progression/progression.config';

export class AIService {
  private aiProvider = AIProviderFactory.getProvider();

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
    let welcomeGreeting = '¡Hola! Es un gusto saludarte. ¿De qué te gustaría que hablemos hoy?';
    if (character.name.includes('Mateo')) {
      welcomeGreeting = '¡Hola amigo! Bienvenido a la cafetería. ¿Qué tal tu día? ¿Te sirvo un café con leche mientras conversamos?';
    } else if (character.name.includes('Elena')) {
      welcomeGreeting = '¡Buenos días! Es un placer compartir este espacio de práctica contigo. ¿Qué tema cultural o lingüístico deseas explorar hoy?';
    } else if (character.name.includes('Sofia')) {
      welcomeGreeting = '¡Hola! Qué emoción conocerte. Estoy planificando mi próximo viaje por Latinoamérica. ¿A ti te gusta viajar?';
    } else if (character.name.includes('Alex')) {
      welcomeGreeting = '¡Hola! ¿Cómo va todo? Me alegra tener un momento libre entre proyectos para practicar español contigo.';
    }

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
