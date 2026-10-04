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

    const lang = (context.targetLanguage || 'es').toLowerCase();
    const name = context.characterName;

    // 1. Check for common learner mistakes & pedagogical corrections
    let correctionNote: string | null = null;

    if (lang === 'en' || lang === 'english') {
      if (lowerInput.includes('i want learn') || lowerInput.includes('i want study')) {
        correctionNote = 'Pedagogical tip: Say "I want to learn" (remember to include "to" before the infinitive verb).';
      } else if (lowerInput.includes('i have 20 years') || lowerInput.includes('i have 25 years')) {
        correctionNote = 'Pedagogical tip: In English, age is expressed with "to be" — say "I am 20 years old", not "I have".';
      } else if (lowerInput.includes('he don\'t') || lowerInput.includes('she don\'t')) {
        correctionNote = 'Pedagogical tip: Use "doesn\'t" with third-person singular (he/she/it).';
      } else if (lowerInput.includes('i am agree')) {
        correctionNote = 'Pedagogical tip: Say "I agree", rather than "I am agree".';
      }
    } else if (lang === 'fr' || lang === 'french') {
      if (lowerInput.includes('je suis bien') && (lowerInput.includes('comment') || lowerInput.includes('ça va'))) {
        correctionNote = 'Astuce pédagogique : Pour répondre à comment ça va, dites plutôt « Je vais bien » que « Je suis bien ».';
      } else if (lowerInput.includes('je vouloir')) {
        correctionNote = 'Astuce pédagogique : Dites « Je veux » au présent de l\'indicatif.';
      }
    } else if (lang === 'de' || lang === 'german') {
      if (lowerInput.includes('ich will zu')) {
        correctionNote = 'Pädagogischer Tipp: Nach Modalverben wie « wollen » steht der Infinitiv ohne « zu ».';
      } else if (lowerInput.includes('ich bin ein student')) {
        correctionNote = 'Pädagogischer Tipp: Berufsbezeichnungen verwendet man im Deutschen meist ohne Artikel (« Ich bin Student »).';
      }
    } else {
      // Spanish default
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
      }
    }

    // 2. Extract episodic memory facts from conversational statements
    const newMemories: { key: string; value: string }[] = [];

    // English memories
    const enLikesMatch = lowerInput.match(/i like ([a-z\s]+)/i);
    if (enLikesMatch && enLikesMatch[1]) newMemories.push({ key: 'LIKES', value: enLikesMatch[1].trim() });
    const enIdentityMatch = lowerInput.match(/i am (a |an )?([a-z\s]+)/i);
    if (enIdentityMatch && enIdentityMatch[2]) newMemories.push({ key: 'IDENTITY', value: enIdentityMatch[2].trim() });
    const enLocationMatch = lowerInput.match(/i live in ([a-z\s]+)/i);
    if (enLocationMatch && enLocationMatch[1]) newMemories.push({ key: 'LOCATION', value: enLocationMatch[1].trim() });

    // Spanish memories
    const meGustaMatch = lowerInput.match(/me gusta ([a-záéíóúñ\s]+)/i);
    if (meGustaMatch && meGustaMatch[1]) newMemories.push({ key: 'LIKES', value: meGustaMatch[1].trim() });
    const soyMatch = lowerInput.match(/soy ([a-záéíóúñ\s]+)/i);
    if (soyMatch && soyMatch[1]) newMemories.push({ key: 'IDENTITY', value: soyMatch[1].trim() });
    const vivoEnMatch = lowerInput.match(/vivo en ([a-záéíóúñ\s]+)/i);
    if (vivoEnMatch && vivoEnMatch[1]) newMemories.push({ key: 'LOCATION', value: vivoEnMatch[1].trim() });

    // French memories
    const frJaimeMatch = lowerInput.match(/j'aime ([a-zàâéèêëîïôùûüç\s]+)/i);
    if (frJaimeMatch && frJaimeMatch[1]) newMemories.push({ key: 'LIKES', value: frJaimeMatch[1].trim() });

    // 3. Generate persona-aligned conversational response
    let reply = '';

    if (lang === 'en' || lang === 'english') {
      if (name.includes('Sarah')) {
        if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
          reply = 'Hello! Welcome to the café. Would you like a warm flat white or some Earl Grey tea while we chat? How are you doing today?';
        } else if (lowerInput.includes('coffee') || lowerInput.includes('tea') || lowerInput.includes('latte')) {
          reply = 'Splendid choice! Freshly brewed and piping hot. Do you take milk or sugar?';
        } else if (lowerInput.includes('thank')) {
          reply = 'You are most welcome! It is a real pleasure chatting with you. Have a wonderful day in London!';
        } else if (lowerInput.includes('how are you')) {
          reply = 'I am doing splendidly, thank you! The café is bustling today. What are your plans for the rest of the day?';
        } else {
          reply = 'That sounds wonderful! I really enjoy chatting with you while making drinks. Tell me more about that in English!';
        }
      } else if (name.includes('David')) {
        if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('good')) {
          reply = 'Good day! Welcome to our English study session. What topic or grammar area would you like to explore today?';
        } else if (lowerInput.includes('learn') || lowerInput.includes('grammar') || lowerInput.includes('english')) {
          reply = 'Consistency and clear expression are the cornerstones of language mastery. You are making commendable progress.';
        } else {
          reply = 'A very insightful thought. Could you elaborate a bit more on that perspective? You express yourself with great clarity.';
        }
      } else {
        if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
          reply = 'Hello! Great to connect with you. I am here to help you practice and improve your English. What shall we talk about today?';
        } else {
          reply = 'I understand you clearly! Your English practice is coming along very nicely. Tell me more about your daily routine!';
        }
      }
    } else if (lang === 'fr' || lang === 'french') {
      if (name.includes('Amélie')) {
        if (lowerInput.includes('bonjour') || lowerInput.includes('salut')) {
          reply = 'Bonjour ! Bienvenue au café parisien. Que puis-je vous servir aujourd\'hui ? Un bon café au lait avec un croissant chaud ?';
        } else {
          reply = 'C\'est une excellente idée ! Racontez-moi davantage en français, vous progressez de façon formidable !';
        }
      } else if (name.includes('Pierre')) {
        if (lowerInput.includes('bonjour') || lowerInput.includes('salut')) {
          reply = 'Bonjour ! C\'est un réel plaisir de vous retrouver pour cette séance de français. De quel sujet souhaiteriez-vous débattre aujourd\'hui ?';
        } else {
          reply = 'Je comprends parfaitement votre perspective. Continuez à vous exprimer ainsi, avec nuance et clarté.';
        }
      } else {
        reply = 'Bonjour ! C\'est un plaisir d\'échanger avec vous. Continuez à pratiquer votre français avec confiance !';
      }
    } else if (lang === 'de' || lang === 'german') {
      if (name.includes('Lukas')) {
        if (lowerInput.includes('hallo') || lowerInput.includes('guten')) {
          reply = 'Hallo! Willkommen in München. Ich freue mich sehr darauf, mich mit dir zu unterhalten. Wie geht es dir heute?';
        } else {
          reply = 'Das ist ja spannend! Erzähl mir gerne mehr darüber auf Deutsch, du machst das wirklich super!';
        }
      } else if (name.includes('Hannah')) {
        if (lowerInput.includes('hallo') || lowerInput.includes('guten')) {
          reply = 'Guten Tag! Schön, dich kennenzulernen. Bereit für eine interessante Unterhaltung auf Deutsch?';
        } else {
          reply = 'Genau so! Deine Aussprache und Grammatik verbessern sich stetig. Worüber möchtest du als Nächstes sprechen?';
        }
      } else {
        reply = 'Hallo! Schön, dass du da bist. Lass uns gemeinsam auf Deutsch weiterüben!';
      }
    } else if (lang === 'ja' || lang === 'japanese') {
      if (name.includes('Kenji')) {
        reply = 'こんにちは！いらっしゃいませ。温かいコーヒーはいかがですか？今日はいかがお過ごしですか？';
      } else if (name.includes('Yuki')) {
        reply = 'こんにちは！ユキと申します。日本語の学習をご一緒できて嬉しいです。今日はどんなことについて話しましょうか？';
      } else {
        reply = 'こんにちは！日本語の練習を一緒に頑張りましょう。今日はいかがですか？';
      }
    } else {
      // Spanish
      if (name.includes('Mateo')) {
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
        if (lowerInput.includes('hola') || lowerInput.includes('buenos')) {
          reply = '¡Buenos días! Es un placer compartir esta sesión de conversación contigo. ¿De qué tema te gustaría dialogar hoy?';
        } else if (lowerInput.includes('gramática') || lowerInput.includes('aprender') || lowerInput.includes('español')) {
          reply = 'La lengua española tiene una riqueza maravillosa. La clave de la fluidez es la práctica constante y no temer a los errores.';
        } else {
          reply = `Comprendo perfectamente tu perspectiva. Expresas tus ideas con claridad. ¿Podrías elaborar un poco más sobre las razones de tu opinión?`;
        }
      } else if (name.includes('Sofia')) {
        if (lowerInput.includes('hola') || lowerInput.includes('buenos')) {
          reply = '¡Hola viajero! Acabo de llegar de una excursión increíble en las montañas. ¿Te gusta viajar y conocer nuevos lugares?';
        } else if (lowerInput.includes('viaj') || lowerInput.includes('país') || lowerInput.includes('ciudad')) {
          reply = '¡Me encanta! Viajar es la mejor manera de aprender idiomas y conocer culturas. ¿Cuál ha sido tu destino favorito hasta ahora?';
        } else {
          reply = `¡Qué aventura! Siempre hay algo nuevo por descubrir en cada rincón del mundo. ¿Qué te gustaría explorar en tu próximo viaje?`;
        }
      } else {
        if (lowerInput.includes('hola')) {
          reply = `¡Hola! Qué gusto saludarte. Estoy aquí para ayudarte a practicar y mejorar día a día. ¿Sobre qué te gustaría conversar?`;
        } else {
          reply = `Te he entendido muy bien. Tu práctica está dando frutos. Sigue hablándome en español: ¿puedes contarme algo más sobre tu día a día?`;
        }
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

    // English characters
    if (name.includes('sarah')) {
      return {
        id: 'cue-london-cafe',
        title: 'London Café Menu & Board',
        category: 'menu',
        headline: 'Artisan Coffee & Tea in Covent Garden',
        body: 'Order drinks and pastries: Flat White (£3.20), Earl Grey Tea (£2.80), Warm Scone with clotted cream (£2.50).',
        targetVocab: ['Flat White', 'Earl Grey', 'Scone', 'Milk', 'Sugar', 'Bill please'],
        imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80',
      };
    }

    if (name.includes('david')) {
      return {
        id: 'cue-academic-seminar',
        title: 'Academic Seminar & Discussion Board',
        category: 'cultural_tip',
        headline: 'Clear Articulation & Formal Discourse',
        body: 'Useful discussion discourse markers: "In my perspective", "Could you elaborate?", "Furthermore".',
        targetVocab: ['Furthermore', 'Perspective', 'Elaborate', 'Commendable'],
      };
    }

    // French characters
    if (name.includes('amélie') || name.includes('amelie')) {
      return {
        id: 'cue-paris-cafe',
        title: 'Menu du Café Parisien',
        category: 'menu',
        headline: 'Bistrot & Terrasse à Montmartre',
        body: 'Commander des boissons : Café au lait (2,50€), Croissant frais (1,80€), Chocolat chaud (3,00€).',
        targetVocab: ['Café au lait', 'Croissant', 'S\'il vous plaît', 'L\'addition'],
        imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80',
      };
    }

    if (name.includes('pierre')) {
      return {
        id: 'cue-sorbonne-lecture',
        title: 'Fiche Pédagogique et Nuances',
        category: 'cultural_tip',
        headline: 'Registres de Langue & Politesse',
        body: 'Différencier le vouvoiement formel (« Vous ») et le tutoiement amical (« Tu »).',
        targetVocab: ['Vouvoiement', 'Formel', 'Je vous en prie', 'Enchanté'],
      };
    }

    // German characters
    if (name.includes('lukas')) {
      return {
        id: 'cue-munich-guide',
        title: 'Münchner Stadtplan & Marienplatz',
        category: 'map',
        headline: 'Orientierung in der Altstadt',
        body: 'Nach dem Weg fragen: "Wo ist das Rathaus?", "Biegen Sie links ab", "Geradeaus".',
        targetVocab: ['Rathaus', 'Geradeaus', 'U-Bahn', 'Bahnhof', 'Entschuldigung'],
        imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=400&q=80',
      };
    }

    if (name.includes('hannah')) {
      return {
        id: 'cue-berlin-media',
        title: 'Medien- und Kommunikationsleitfaden',
        category: 'cultural_tip',
        headline: 'Modernes Deutsch im Alltag',
        body: 'Hilfreiche Ausdrücke: "Meiner Meinung nach", "Könnten Sie das wiederholen?", "Alles klar".',
        targetVocab: ['Meinung', 'Wiederholen', 'Verständnis', 'Genau'],
      };
    }

    // Japanese characters
    if (name.includes('kenji')) {
      return {
        id: 'cue-tokyo-cafe',
        title: '東京カフェのメニュー (Tokyo Café)',
        category: 'menu',
        headline: '喫茶店の定番メニュー',
        body: '注文フレーズ：「ホットコーヒーをひとつお願いします」、「おすすめは何ですか？」',
        targetVocab: ['コーヒー (Coffee)', 'おすすめ (Recommendation)', 'お願いします (Please)', '水 (Water)'],
      };
    }

    if (name.includes('yuki')) {
      return {
        id: 'cue-kyoto-culture',
        title: '京都の文化と丁寧な表現 (Polite Japanese)',
        category: 'cultural_tip',
        headline: '日常会話と敬語のマナー',
        body: '丁寧な挨拶：「はじめまして」、「よろしくお願いいたします」、「ありがとうございます」。',
        targetVocab: ['はじめまして', 'よろしくお願いします', 'ありがとうございます', 'すみません'],
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
