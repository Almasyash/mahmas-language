// ==============================================================================
// MAHMAS LANGUAGE — AI PROVIDER ADAPTER LAYER
// Vendor-agnostic abstraction for conversational tutors (Gemini / OpenAI / Mock)
// ==============================================================================

import { config } from '../../config/environment';

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

export interface IAIProviderAdapter {
  generateReply(context: AIMessageContext): Promise<AIResponsePayload>;
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
