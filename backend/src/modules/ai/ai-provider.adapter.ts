// ==============================================================================
// MAHMAS LANGUAGE — AI PROVIDER ADAPTER LAYER
// Vendor-agnostic abstraction for conversational tutors (Gemini / OpenAI / Mock)
// ==============================================================================

import { config } from '../../config/environment';
import {
  PhonemeFeedbackDTO,
  AvatarEmotion,
  AvatarGesture,
  VisemeFrameDTO,
  VisemeType,
  VisualAidCueDTO,
} from './ai.types';

export interface AIMessageContext {
  targetLanguage: string;
  nativeLanguage: string;
  cefrLevel: string;
  characterName: string;
  personalityPrompt: string;
  topic?: string;
  memories?: { key: string; value: string }[];
  history: { role: 'user' | 'assistant'; content: string }[];
  latestUserMessage: string;
}

export interface AIResponsePayload {
  reply: string;
  correctionNote?: string | null;
  newMemories?: { key: string; value: string }[];
  audioUrl?: string | null;
}

export interface SpeechSynthesisResult {
  audioBase64: string;
  mimeType: string;
  durationSec: number;
}

export interface SpeechEvaluationResult {
  transcription: string;
  accuracyScore: number;
  fluencyScore: number;
  phonemeFeedback: PhonemeFeedbackDTO[];
  pronunciationAdvice?: string | null;
}

export interface AvatarAnimationResult {
  emotion: AvatarEmotion;
  gesture: AvatarGesture;
  visemes: VisemeFrameDTO[];
}

export interface IAIProviderAdapter {
  generateReply(context: AIMessageContext): Promise<AIResponsePayload>;
  generateSpeech(text: string, voiceName?: string | null, languageCode?: string): Promise<SpeechSynthesisResult>;
  evaluateSpeech(input: { audioBase64?: string; spokenText?: string; audioDurationMs?: number }, languageCode: string): Promise<SpeechEvaluationResult>;
  generateAvatarAnimation(text: string, emotion?: AvatarEmotion, durationSec?: number): AvatarAnimationResult;
  getSceneVisualAid(characterName: string, sceneSetting?: string, isHintRequest?: boolean): VisualAidCueDTO | null;
}

/**
 * Generates a valid standard RIFF WAV base64 string with PCM 16-bit audio.
 * Allows client audio players (Flutter/browser) to decode real audio without external dependencies.
 */
function createMockWavBase64(durationSec: number = 1.5, sampleRate: number = 16000): string {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = Math.floor(sampleRate * durationSec * blockAlign);
  const totalSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(totalSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Gentle audible tone envelope
  for (let i = 0; i < sampleRate * durationSec; i++) {
    const t = i / sampleRate;
    const envelope = Math.max(0, 1 - t / durationSec);
    const sample = Math.floor(Math.sin(2 * Math.PI * 440 * t) * 6000 * envelope);
    buffer.writeInt16LE(sample, 44 + i * 2);
  }

  return buffer.toString('base64');
}

// ------------------------------------------------------------------------------
// 1. MOCK ADAPTER (Deterministic, offline, pedagogical rules engine)
// ------------------------------------------------------------------------------
export class MockAIProviderAdapter implements IAIProviderAdapter {
  async generateReply(context: AIMessageContext): Promise<AIResponsePayload> {
    const rawInput = context.latestUserMessage.trim();
    const lowerInput = rawInput.toLowerCase();

    // 1. Check for common learner mistakes & pedagogical corrections
    let correctionNote: string | null = null;

    if (context.targetLanguage === 'es' || context.targetLanguage === 'Spanish') {
      if (lowerInput.includes('yo querer')) {
        correctionNote = 'Pedagogical tip: Say "Yo quiero" instead of "Yo querer" (conjugate the verb in the present tense).';
      } else if (lowerInput.includes('el casa') || lowerInput.includes('un casa')) {
        correctionNote = 'Pedagogical tip: "Casa" is feminine in Spanish, so use "la casa" or "una casa".';
      } else if (lowerInput.includes('el comida') || lowerInput.includes('un comida')) {
        correctionNote = 'Pedagogical tip: "Comida" is feminine, so use "la comida" or "una comida".';
      } else if (lowerInput.includes('yo tener') && !lowerInput.includes('tengo')) {
        correctionNote = 'Pedagogical tip: In present tense, say "Yo tengo" instead of "Yo tener".';
      } else if (lowerInput.includes('gracias you') || lowerInput.includes('thank you')) {
        correctionNote = 'Pedagogical tip: In Spanish, simply say "Muchas gracias" or "Gracias".';
      } else if (lowerInput.length > 5 && !/[áéíóúñ¿¡a-z]/i.test(lowerInput)) {
        correctionNote = 'Pedagogical tip: Try expressing your thoughts using basic Spanish words.';
      }
    }

    // 2. Extract episodic memory facts from conversational statements
    const newMemories: { key: string; value: string }[] = [];
    const meGustaMatch = lowerInput.match(/me gusta ([a-záéíóúñ\s]+)/i);
    if (meGustaMatch && meGustaMatch[1]) {
      const hobbyOrItem = meGustaMatch[1].trim();
      newMemories.push({ key: 'LIKES', value: hobbyOrItem });
    }

    const soyMatch = lowerInput.match(/soy ([a-záéíóúñ\s]+)/i);
    if (soyMatch && soyMatch[1]) {
      const identity = soyMatch[1].trim();
      newMemories.push({ key: 'IDENTITY', value: identity });
    }

    const vivoEnMatch = lowerInput.match(/vivo en ([a-záéíóúñ\s]+)/i);
    if (vivoEnMatch && vivoEnMatch[1]) {
      const city = vivoEnMatch[1].trim();
      newMemories.push({ key: 'LOCATION', value: city });
    }

    // 3. Generate persona-aligned conversational response
    const name = context.characterName;
    let reply = '';

    if (name.includes('Mateo')) {
      // Friendly Madrid Barista persona
      if (lowerInput.includes('hola') || lowerInput.includes('buenos')) {
        reply = '¡Hola amigo! Bienvenido al café. ¿Qué te apetece tomar hoy? Tenemos café con leche delicioso y croissants recién hechos.';
      } else if (lowerInput.includes('café') || lowerInput.includes('cafe') || lowerInput.includes('quiero') || lowerInput.includes('querer')) {
        reply = '¡Excelente elección! Un buen café siempre alegra el día. ¿Te gusta con azúcar o prefieres probarlo solo?';
      } else if (lowerInput.includes('gracias')) {
        reply = '¡De nada, qué amable! Es un placer atenderte. ¿Cómo va tu día en la ciudad?';
      } else if (lowerInput.includes('cómo estás') || lowerInput.includes('como estas')) {
        reply = '¡Muy bien, gracias por preguntar! Hoy la cafetería tiene un ambiente genial. ¿Y tú, qué planes tienes para hoy?';
      } else {
        reply = `¡Qué interesante! Me encanta conversar contigo mientras preparo los pedidos. Cuéntame más sobre eso en español, lo estás haciendo genial.`;
      }
    } else if (name.includes('Elena')) {
      // Academic linguistics professor persona
      if (lowerInput.includes('hola') || lowerInput.includes('buenos')) {
        reply = '¡Buenos días! Es un placer compartir esta sesión de conversación contigo. ¿De qué tema te gustaría dialogar hoy?';
      } else if (lowerInput.includes('gramática') || lowerInput.includes('aprender') || lowerInput.includes('español')) {
        reply = 'La lengua española tiene una riqueza maravillosa. La clave de la fluidez es la práctica constante y no temer a los errores.';
      } else {
        reply = `Comprendo perfectamente tu perspectiva. Expresas tus ideas con claridad. ¿Podrías elaborar un poco más sobre las razones de tu opinión?`;
      }
    } else if (name.includes('Sofia')) {
      // Adventurous traveler persona
      if (lowerInput.includes('hola') || lowerInput.includes('buenos')) {
        reply = '¡Hola viajero! Acabo de llegar de una excursión increíble en las montañas. ¿Te gusta viajar y conocer nuevos lugares?';
      } else if (lowerInput.includes('viaj') || lowerInput.includes('país') || lowerInput.includes('ciudad')) {
        reply = '¡Me encanta! Viajar es la mejor manera de aprender idiomas y conocer culturas. ¿Cuál ha sido tu destino favorito hasta ahora?';
      } else {
        reply = `¡Qué aventura! Siempre hay algo nuevo por descubrir en cada rincón del mundo. ¿Qué te gustaría explorar en tu próximo viaje?`;
      }
    } else {
      // Generic encouraging tutor persona
      if (lowerInput.includes('hola')) {
        reply = `¡Hola! Qué gusto saludarte. Estoy aquí para ayudarte a practicar y mejorar día a día. ¿Sobre qué te gustaría conversar?`;
      } else {
        reply = `Te he entendido muy bien. Tu práctica está dando frutos. Sigue hablándome en español: ¿puedes contarme algo más sobre tu día a día?`;
      }
    }

    return {
      reply,
      correctionNote,
      newMemories: newMemories.length > 0 ? newMemories : undefined,
      audioUrl: null,
    };
  }

  async generateSpeech(text: string, _voiceName?: string | null, _languageCode?: string): Promise<SpeechSynthesisResult> {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    // Estimate ~0.35s per word, minimum 1.2s, max 10s
    const durationSec = Math.min(10, Math.max(1.2, Math.round(wordCount * 0.35 * 10) / 10));
    const audioBase64 = createMockWavBase64(durationSec);

    return {
      audioBase64,
      mimeType: 'audio/wav',
      durationSec,
    };
  }

  async evaluateSpeech(
    input: { audioBase64?: string; spokenText?: string; audioDurationMs?: number },
    languageCode: string
  ): Promise<SpeechEvaluationResult> {
    const text = input.spokenText?.trim() || 'Hola, me gustaría practicar español contigo.';
    const lower = text.toLowerCase();

    const phonemeFeedback: PhonemeFeedbackDTO[] = [];
    let accuracy = 90;
    let fluency = 88;
    let advice = 'Great pronunciation and clear vocal cadence!';

    // Check rolled 'rr' / alveolar trill in Spanish
    if (languageCode === 'es' || languageCode.toLowerCase().includes('spanish')) {
      if (lower.includes('rr') || lower.includes('perro') || lower.includes('carro')) {
        phonemeFeedback.push({
          phoneme: 'r (trill)',
          status: 'EXCELLENT',
          hint: 'Superb alveolar trill vibration on the rolled "rr".',
        });
        advice = 'Excellent trill on your rolled "rr" sounds! Native-like resonance.';
        accuracy = Math.min(98, accuracy + 5);
      } else {
        phonemeFeedback.push({
          phoneme: 'r (flap)',
          status: 'GOOD',
          hint: 'Clean alveolar tap between vowels.',
        });
      }

      // Check vowels purity
      if (/[aeiouáéíóú]/.test(lower)) {
        phonemeFeedback.push({
          phoneme: 'Vowels [a, e, i, o, u]',
          status: 'GOOD',
          hint: 'Spanish vowels are short and crisp without diphthong glide.',
        });
      }

      // Check syntax / common learner errors impacting accuracy
      if (lower.includes('yo querer')) {
        accuracy = 75;
        fluency = 72;
        advice = 'Clear articulation, but remember to conjugate "Yo quiero" instead of "Yo querer".';
        phonemeFeedback.push({
          phoneme: 'Grammatical Cadence',
          status: 'NEEDS_WORK',
          hint: 'Use present indicative for smooth conversational flow.',
        });
      }
    } else {
      phonemeFeedback.push({
        phoneme: 'vocal clarity',
        status: 'EXCELLENT',
        hint: 'Speech is distinct and intelligible.',
      });
    }

    return {
      transcription: text,
      accuracyScore: accuracy,
      fluencyScore: fluency,
      phonemeFeedback,
      pronunciationAdvice: advice,
    };
  }

  generateAvatarAnimation(
    text: string,
    emotion: AvatarEmotion = 'neutral',
    durationSec: number = 2.0
  ): AvatarAnimationResult {
    // 1. Gesture selection based on emotion and content
    let gesture: AvatarGesture = 'rest';
    const lower = text.toLowerCase();
    if (lower.includes('hola') || lower.includes('buenos') || lower.includes('bienvenido')) {
      gesture = 'wave';
    } else if (emotion === 'celebrating') {
      gesture = 'smile';
    } else if (emotion === 'happy' || emotion === 'encouraging') {
      gesture = 'nod';
    } else if (emotion === 'thoughtful') {
      gesture = 'tilt';
    }

    // 2. Build timed visemes from speech utterance
    const visemes: VisemeFrameDTO[] = [];
    const totalMs = Math.max(1200, Math.round(durationSec * 1000));

    // Initial rest frame
    visemes.push({ viseme: 'rest', timestampMs: 0, durationMs: 150 });
    let currentMs = 150;

    // Split text into words/tokens
    const tokens = text.replace(/[^a-záéíóúñ\s]/gi, '').split(/\s+/).filter(Boolean);
    const tokenDuration = Math.max(120, Math.floor((totalMs - 300) / Math.max(1, tokens.length * 2)));

    for (const token of tokens) {
      const lowerToken = token.toLowerCase();
      for (let i = 0; i < lowerToken.length; i += 2) {
        if (currentMs >= totalMs - 150) break;
        const char = lowerToken[i];
        let viseme: VisemeType = 'aa';

        if (/[aeiouáéíóú]/.test(char)) {
          if (/[aoáó]/.test(char)) viseme = 'aa';
          else if (/[eiéí]/.test(char)) viseme = 'ee';
          else if (/[uú]/.test(char)) viseme = 'oo';
        } else if (/[fv]/.test(char)) {
          viseme = 'ff';
        } else if (/[scztd]/.test(char)) {
          viseme = 'ch';
        } else {
          viseme = 'aa';
        }

        visemes.push({
          viseme,
          timestampMs: currentMs,
          durationMs: tokenDuration,
        });
        currentMs += tokenDuration;
      }
      // Micro-pause between words
      if (currentMs < totalMs - 150) {
        visemes.push({
          viseme: 'rest',
          timestampMs: currentMs,
          durationMs: 80,
        });
        currentMs += 80;
      }
    }

    // Trailing rest frame
    visemes.push({
      viseme: 'rest',
      timestampMs: currentMs,
      durationMs: Math.max(150, totalMs - currentMs),
    });

    return {
      emotion,
      gesture,
      visemes,
    };
  }

  getSceneVisualAid(
    characterName: string,
    sceneSetting?: string,
    isHintRequest: boolean = false
  ): VisualAidCueDTO | null {
    if (isHintRequest) {
      return {
        id: 'cue-hint-vocab',
        title: 'Guía de Ayuda (Help Guide)',
        category: 'flashcard',
        headline: 'Frases Clave Útiles',
        body: 'Usa estas frases para responder: "Me gustaría pedir...", "¿Cuánto cuesta?", "Muchas gracias".',
        targetVocab: ['Me gustaría', 'Por favor', 'Cuánto cuesta', 'La cuenta'],
      };
    }

    const name = characterName.toLowerCase();
    if (name.includes('mateo')) {
      return {
        id: 'cue-cafe-madrid',
        title: 'Menú del Café Central',
        category: 'menu',
        headline: 'Cafetería Tradicional en Madrid',
        body: 'Pide bebidas y comida: Café con leche (1.80€), Croissant caliente (1.50€), Tostada con tomate (2.20€).',
        targetVocab: ['Café con leche', 'Croissant', 'Tostada con tomate', 'Azúcar'],
        imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80',
      };
    }

    if (name.includes('sofia')) {
      return {
        id: 'cue-metro-madrid',
        title: 'Mapa de la Ciudad y Transporte',
        category: 'map',
        headline: 'Explorando la Gran Vía y Sol',
        body: 'Pregunta cómo llegar: "¿Dónde está la estación de metro?", "Billete sencillo", "Línea 1 directa".',
        targetVocab: ['Estación', 'Metro', 'Billete', 'A la derecha', 'Recto'],
        imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=400&q=80',
      };
    }

    if (name.includes('elena')) {
      return {
        id: 'cue-linguistics-card',
        title: 'Estructuras Lingüísticas y Cortesía',
        category: 'cultural_tip',
        headline: 'Fórmulas de Cortesía en Español',
        body: 'En contextos formales se utiliza "Usted", mientras que entre amigos usamos "Tú".',
        targetVocab: ['Usted', 'Disculpe', 'Con permiso', 'Encantado/a'],
      };
    }

    if (name.includes('alex')) {
      return {
        id: 'cue-tech-sprint',
        title: 'Pizarra de Trabajo y Sprint',
        category: 'photo',
        headline: 'Reunión Diaria de Ingeniería',
        body: 'Términos de trabajo: "Revisión de código", "Despliegue en producción", "Base de datos".',
        targetVocab: ['Despliegue', 'Base de datos', 'Arquitectura', 'Equipo'],
      };
    }

    return null;
  }
}

// ------------------------------------------------------------------------------
// 2. GEMINI ADAPTER (Live Google Gemini integration with Mock fallback)
// ------------------------------------------------------------------------------
export class GeminiAIProviderAdapter implements IAIProviderAdapter {
  private mockFallback = new MockAIProviderAdapter();
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.AI_API_KEY || '';
    this.model = model || process.env.AI_CHAT_MODEL || 'gemini-1.5-flash';
  }

  async generateReply(context: AIMessageContext): Promise<AIResponsePayload> {
    // If no API key configured, use the mock fallback engine
    if (!this.apiKey || this.apiKey === 'your_ai_provider_api_key_here') {
      return this.mockFallback.generateReply(context);
    }

    try {
      const memoryString = context.memories?.map((m) => `${m.key}: ${m.value}`).join(', ') || 'None';
      const systemInstruction = `You are ${context.characterName}, an AI language tutor.
Personality and Scenario: ${context.personalityPrompt}
Target Language: ${context.targetLanguage}. Native Language of student: ${context.nativeLanguage}.
Student CEFR Level: ${context.cefrLevel}.
Known Memory about student: ${memoryString}.

Instructions:
1. Always respond naturally in ${context.targetLanguage}, matching the student's CEFR level (${context.cefrLevel}).
2. Do not interrupt conversational flow with heavy corrections. Keep the dialogue warm and authentic.
3. If the student made an obvious grammatical, lexical, or agreement mistake in their latest message, formulate a concise, helpful correction note for the "correctionNote" field. If no mistake, leave it null.
4. If the student revealed a personal preference, hobby, or background fact, include it in "newMemories" as an array of { "key": string, "value": string }.
5. Respond ONLY with valid JSON:
{
  "reply": "your conversational response in target language",
  "correctionNote": "pedagogical correction or null",
  "newMemories": [{"key": "...", "value": "..."}]
}`;

      const historyFormatted = context.history.map((h) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      }));

      historyFormatted.push({
        role: 'user',
        parts: [{ text: context.latestUserMessage }],
      });

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: historyFormatted,
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.7,
            maxOutputTokens: 600,
          },
        }),
      });

      if (!response.ok) {
        console.warn(`Gemini API returned status ${response.status}. Falling back to mock engine.`);
        return this.mockFallback.generateReply(context);
      }

      const data = (await response.json()) as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return this.mockFallback.generateReply(context);
      }

      const parsed = JSON.parse(text);
      return {
        reply: parsed.reply || '¡Muy bien! Continuemos conversando.',
        correctionNote: parsed.correctionNote || null,
        newMemories: Array.isArray(parsed.newMemories) ? parsed.newMemories : undefined,
        audioUrl: null,
      };
    } catch (err) {
      console.warn('Gemini inference failed, utilizing mock pedagogical fallback:', err);
      return this.mockFallback.generateReply(context);
    }
  }

  async generateSpeech(text: string, voiceName?: string | null, languageCode?: string): Promise<SpeechSynthesisResult> {
    return this.mockFallback.generateSpeech(text, voiceName, languageCode);
  }

  async evaluateSpeech(
    input: { audioBase64?: string; spokenText?: string; audioDurationMs?: number },
    languageCode: string
  ): Promise<SpeechEvaluationResult> {
    return this.mockFallback.evaluateSpeech(input, languageCode);
  }

  generateAvatarAnimation(
    text: string,
    emotion?: AvatarEmotion,
    durationSec?: number
  ): AvatarAnimationResult {
    return this.mockFallback.generateAvatarAnimation(text, emotion, durationSec);
  }

  getSceneVisualAid(
    characterName: string,
    sceneSetting?: string,
    isHintRequest?: boolean
  ): VisualAidCueDTO | null {
    return this.mockFallback.getSceneVisualAid(characterName, sceneSetting, isHintRequest);
  }
}

// ------------------------------------------------------------------------------
// 3. FACTORY
// ------------------------------------------------------------------------------
export class AIProviderFactory {
  static getProvider(): IAIProviderAdapter {
    const provider = (process.env.AI_PROVIDER || 'mock').toLowerCase();
    if (provider === 'gemini') {
      return new GeminiAIProviderAdapter();
    }
    return new MockAIProviderAdapter();
  }
}
