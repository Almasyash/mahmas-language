import { PrismaClient, ExerciseType, CEFRLevel } from '@prisma/client';

const prisma = new PrismaClient();

const initialLanguages = [
  { code: 'en', name: 'English', nativeName: 'English', flagEmoji: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flagEmoji: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flagEmoji: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flagEmoji: '🇩🇪' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flagEmoji: '🇮🇳' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flagEmoji: '🇸🇦' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flagEmoji: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flagEmoji: '🇰🇷' },
  { code: 'zh', name: 'Mandarin Chinese', nativeName: '中文', flagEmoji: '🇨🇳' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flagEmoji: '🇷🇺' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flagEmoji: '🇧🇷' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flagEmoji: '🇮🇹' },
];

const initialAchievements = [
  { code: 'FIRST_LESSON', title: 'First Steps', description: 'Complete your first lesson.', badgeIcon: '🎯', maxTier: 1 },
  { code: 'FIRST_PRACTICE', title: 'Practice Champion', description: 'Complete your first practice session.', badgeIcon: '🏋️', maxTier: 1 },
  { code: 'FIRST_100_XP', title: 'Century Club', description: 'Earn your first 100 XP.', badgeIcon: '💯', maxTier: 1 },
  { code: 'THREE_DAY_STREAK', title: 'Momentum', description: 'Maintain a 3-day learning streak.', badgeIcon: '🔥', maxTier: 1 },
  { code: 'SEVEN_DAY_STREAK', title: 'Unstoppable', description: 'Reach a 7-day learning streak.', badgeIcon: '⚡', maxTier: 1 },
  { code: 'TEN_LESSONS', title: 'Dedicated Scholar', description: 'Complete 10 lessons.', badgeIcon: '📚', maxTier: 1 },
  { code: 'FIFTY_EXERCISES', title: 'Sharpshooter', description: 'Answer 50 exercises correctly.', badgeIcon: '🏹', maxTier: 1 },
  { code: 'FIRST_COURSE_PROGRESS', title: 'Pathfinder', description: 'Start learning your first language course.', badgeIcon: '🧭', maxTier: 1 },
  { code: 'FIRST_AI_CONVERSATION', title: 'AI Conversationalist', description: 'Complete your first conversation session with an AI tutor.', badgeIcon: '🤖', maxTier: 1 },
  { code: 'FIRST_AI_VOICE_CALL', title: 'Silver Tongue', description: 'Complete your first live voice call with an AI tutor.', badgeIcon: '🎙️', maxTier: 1 },
  { code: 'FIRST_AI_VIDEO_CALL', title: 'Visual Virtuoso', description: 'Complete your first live video call session with an AI tutor.', badgeIcon: '📹', maxTier: 1 },
];

async function main() {
  console.log('Seeding initial languages...');
  for (const lang of initialLanguages) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: lang,
      create: lang,
    });
  }
  console.log(`Seeded ${initialLanguages.length} languages successfully.`);

  console.log('Seeding initial achievements...');
  for (const ach of initialAchievements) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: ach,
      create: ach,
    });
  }
  console.log(`Seeded ${initialAchievements.length} achievements successfully.`);

  console.log('Seeding daily quests...');
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endDate = new Date(now.getFullYear() + 1, 11, 31, 23, 59, 59);

  const initialQuests = [
    { id: 'quest-complete-lesson', title: 'Complete a Lesson', description: 'Finish any lesson on your learning path.', questType: 'COMPLETE_LESSONS', targetCount: 1, xpReward: 20, gemReward: 5, startDate, endDate },
    { id: 'quest-earn-xp', title: 'XP Climber', description: 'Earn 30 XP through lessons or practice.', questType: 'EARN_XP', targetCount: 30, xpReward: 15, gemReward: 3, startDate, endDate },
    { id: 'quest-complete-exercises', title: 'Exercise Marathon', description: 'Solve 5 exercises accurately.', questType: 'COMPLETE_EXERCISES', targetCount: 5, xpReward: 15, gemReward: 3, startDate, endDate },
    { id: 'quest-complete-practice', title: 'Sharpen Your Mind', description: 'Complete 1 practice session.', questType: 'COMPLETE_PRACTICE', targetCount: 1, xpReward: 20, gemReward: 5, startDate, endDate },
    { id: 'quest-maintain-streak', title: 'Daily Dedication', description: 'Extend your streak by practicing today.', questType: 'MAINTAIN_STREAK', targetCount: 1, xpReward: 25, gemReward: 5, startDate, endDate },
    { id: 'quest-ai-chat', title: 'Chat with an AI Tutor', description: 'Practice conversational skills with your AI tutor.', questType: 'AI_CHAT', targetCount: 1, xpReward: 25, gemReward: 5, startDate, endDate },
    { id: 'quest-ai-voice', title: 'Voice Explorer', description: 'Practice speaking in a live voice call with an AI tutor.', questType: 'AI_VOICE_CALL', targetCount: 1, xpReward: 30, gemReward: 6, startDate, endDate },
    { id: 'quest-ai-video', title: 'Face-to-Face Mastery', description: 'Practice interactive speaking in an AI video call.', questType: 'AI_VIDEO_CALL', targetCount: 1, xpReward: 35, gemReward: 8, startDate, endDate },
  ];

  for (const quest of initialQuests) {
    await prisma.quest.upsert({
      where: { id: quest.id },
      update: quest,
      create: quest,
    });
  }
  console.log(`Seeded ${initialQuests.length} quests successfully.`);

  // Seed AI Tutor Characters
  console.log('Seeding AI Tutor Characters...');
  const initialCharacters = [
    // English Tutors
    {
      id: 'char-sarah',
      name: 'Sarah',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      personalityPrompt: 'You are Sarah, a cheerful, warm, and patient barista from London. You speak English at a beginner-friendly A1-A2 level.',
      defaultVoice: 'en-US-Journey-F',
      targetLanguageCode: 'en',
      difficultyCEFR: CEFRLevel.A1,
      isActive: true,
    },
    {
      id: 'char-david',
      name: 'Prof. David',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      personalityPrompt: 'You are Professor David, an encouraging English literature instructor. You converse in clear, structured English with helpful grammar tips.',
      defaultVoice: 'en-US-Journey-M',
      targetLanguageCode: 'en',
      difficultyCEFR: CEFRLevel.B1,
      isActive: true,
    },
    // Spanish Tutors
    {
      id: 'char-mateo',
      name: 'Mateo',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      personalityPrompt: 'You are Mateo, a friendly, warm, and patient barista in Madrid. You speak Spanish at a beginner-friendly A1-A2 level.',
      defaultVoice: 'es-ES-Neural2-A',
      targetLanguageCode: 'es',
      difficultyCEFR: CEFRLevel.A1,
      isActive: true,
    },
    {
      id: 'char-elena',
      name: 'Prof. Elena',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      personalityPrompt: 'You are Professor Elena, an articulate and encouraging Spanish linguistics professor. You converse in clear, structured Spanish.',
      defaultVoice: 'es-ES-Neural2-F',
      targetLanguageCode: 'es',
      difficultyCEFR: CEFRLevel.B1,
      isActive: true,
    },
    // French Tutors
    {
      id: 'char-amelie',
      name: 'Amélie',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      personalityPrompt: 'You are Amélie, a warm and welcoming Parisian café host. You speak clear, beginner-friendly French at A1-A2 level.',
      defaultVoice: 'fr-FR-Neural2-A',
      targetLanguageCode: 'fr',
      difficultyCEFR: CEFRLevel.A1,
      isActive: true,
    },
    {
      id: 'char-pierre',
      name: 'Prof. Pierre',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      personalityPrompt: 'You are Professor Pierre, an articulate French language instructor. You guide learners with gentle corrections and clear vocabulary.',
      defaultVoice: 'fr-FR-Neural2-B',
      targetLanguageCode: 'fr',
      difficultyCEFR: CEFRLevel.B1,
      isActive: true,
    },
    // German Tutors
    {
      id: 'char-lukas',
      name: 'Lukas',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
      personalityPrompt: 'You are Lukas, an enthusiastic city guide from Munich. You speak clear, accessible German at A1-A2 level.',
      defaultVoice: 'de-DE-Neural2-B',
      targetLanguageCode: 'de',
      difficultyCEFR: CEFRLevel.A1,
      isActive: true,
    },
    {
      id: 'char-hannah',
      name: 'Hannah',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      personalityPrompt: 'You are Hannah, a Berlin-based media producer and language coach. You converse in natural, modern German.',
      defaultVoice: 'de-DE-Neural2-C',
      targetLanguageCode: 'de',
      difficultyCEFR: CEFRLevel.B1,
      isActive: true,
    },
    // Japanese Tutors
    {
      id: 'char-kenji',
      name: 'Kenji',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      personalityPrompt: 'You are Kenji, a patient and friendly coffee roaster from Tokyo. You speak gentle, everyday Japanese with romaji explanations.',
      defaultVoice: 'ja-JP-Neural2-B',
      targetLanguageCode: 'ja',
      difficultyCEFR: CEFRLevel.A1,
      isActive: true,
    },
    {
      id: 'char-yuki',
      name: 'Yuki',
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
      personalityPrompt: 'You are Yuki, a Kyoto cultural ambassador and language teacher. You speak polite, natural Japanese (keigo and standard speech).',
      defaultVoice: 'ja-JP-Neural2-C',
      targetLanguageCode: 'ja',
      difficultyCEFR: CEFRLevel.B1,
      isActive: true,
    },
  ];

  for (const char of initialCharacters) {
    await prisma.aICharacter.upsert({
      where: { id: char.id },
      update: char,
      create: char,
    });
  }
  console.log(`Seeded ${initialCharacters.length} AI characters successfully.`);

  // ============================================================================
  // MULTI-LANGUAGE COURSE CATALOG DEFINITION
  // ============================================================================
  const hiLang = await prisma.language.findUnique({ where: { code: 'hi' } });

  const coursesToSeed = [
    {
      id: 'course-en-a1',
      targetCode: 'en',
      sourceCode: 'hi',
      title: 'English Foundations',
      description: 'Master everyday spoken and written English',
      sectionTitle: 'Section 1: Greetings & Essentials',
      unitTitle: 'Unit 1: Hello & Introductions',
      unitGuide: 'Essential greetings in English: Hello, Good morning, Thank you, Please, Goodbye.',
      lessons: [
        {
          id: 'lesson-en-1',
          title: 'Lesson 1: Common Greetings',
          orderIndex: 1,
          exercises: [
            {
              id: 'ex-en-1-1',
              type: ExerciseType.MULTIPLE_CHOICE,
              question: "How do you say 'Hello' in English?",
              expectedAnswer: 'Hello',
              alternatives: ['hello', 'hi'],
              explanation: "'Hello' is the standard polite greeting in English.",
              options: [
                { text: 'Hello', isCorrect: true },
                { text: 'Bonjour', isCorrect: false },
                { text: 'Hola', isCorrect: false },
                { text: 'Ciao', isCorrect: false },
              ],
            },
            {
              id: 'ex-en-1-2',
              type: ExerciseType.TRANSLATION,
              question: "Translate 'शुभ प्रभात' to English:",
              expectedAnswer: 'Good morning',
              alternatives: ['good morning'],
              explanation: "'Good morning' is used to greet people before noon.",
              options: [],
            },
            {
              id: 'ex-en-1-3',
              type: ExerciseType.FILL_IN_BLANK,
              question: "Complete the greeting: '___, nice to meet you!'",
              expectedAnswer: 'Hello',
              alternatives: ['hello', 'hi'],
              explanation: "'Hello, nice to meet you!' is the complete greeting.",
              options: [],
            },
          ],
        },
        {
          id: 'lesson-en-2',
          title: 'Lesson 2: Courtesies & Gratitude',
          orderIndex: 2,
          exercises: [
            {
              id: 'ex-en-2-1',
              type: ExerciseType.MULTIPLE_CHOICE,
              question: "Which word expresses gratitude ('धन्यवाद') in English?",
              expectedAnswer: 'Thank you',
              alternatives: ['thank you', 'thanks'],
              explanation: "'Thank you' expresses appreciation and politeness.",
              options: [
                { text: 'Thank you', isCorrect: true },
                { text: 'Sorry', isCorrect: false },
                { text: 'Excuse me', isCorrect: false },
                { text: 'Please', isCorrect: false },
              ],
            },
            {
              id: 'ex-en-2-2',
              type: ExerciseType.TRANSLATION,
              question: "Translate 'कृपया' to English:",
              expectedAnswer: 'Please',
              alternatives: ['please'],
              explanation: "'Please' is used for polite requests.",
              options: [],
            },
          ],
        },
      ],
      vocab: [
        { id: 'vocab-en-1', word: 'Hello', phonetic: 'hə-LOH', translation: 'नमस्ते / Hello', partOfSpeech: 'Interjection', exampleSentence: 'Hello, how are you?', exampleTranslation: 'नमस्ते, आप कैसे हैं?' },
        { id: 'vocab-en-2', word: 'Good morning', phonetic: 'gud MAWR-ning', translation: 'शुभ प्रभात', partOfSpeech: 'Phrase', exampleSentence: 'Good morning, everyone.', exampleTranslation: 'सभी को शुभ प्रभात।' },
        { id: 'vocab-en-3', word: 'Thank you', phonetic: 'THANGK yoo', translation: 'धन्यवाद', partOfSpeech: 'Phrase', exampleSentence: 'Thank you very much.', exampleTranslation: 'आपका बहुत धन्यवाद।' },
        { id: 'vocab-en-4', word: 'Please', phonetic: 'pleez', translation: 'कृपया', partOfSpeech: 'Adverb', exampleSentence: 'Please help me.', exampleTranslation: 'कृपया मेरी मदद करें।' },
        { id: 'vocab-en-5', word: 'Goodbye', phonetic: 'good-BYE', translation: 'अलविदा', partOfSpeech: 'Interjection', exampleSentence: 'Goodbye, see you soon!', exampleTranslation: 'अलविदा, जल्द मिलेंगे!' },
      ],
    },
    {
      id: 'course-es-a1',
      targetCode: 'es',
      sourceCode: 'hi',
      title: 'Spanish Foundations',
      description: 'Learn everyday Spanish from scratch',
      sectionTitle: 'Section 1: Greetings & Essentials',
      unitTitle: 'Unit 1: Hello & Introductions',
      unitGuide: 'Key greetings in Spanish: Hola (Hello), Buenos días (Good morning), Gracias (Thank you).',
      lessons: [
        {
          id: 'lesson-es-1',
          title: 'Lesson 1: Saying Hello',
          orderIndex: 1,
          exercises: [
            {
              id: 'ex-es-1-1',
              type: ExerciseType.MULTIPLE_CHOICE,
              question: "How do you say 'Hello' in Spanish?",
              expectedAnswer: 'Hola',
              alternatives: ['hola'],
              explanation: "'Hola' is the universal greeting for 'Hello' in Spanish.",
              options: [
                { text: 'Hola', isCorrect: true },
                { text: 'Adiós', isCorrect: false },
                { text: 'Por favor', isCorrect: false },
                { text: 'Gracias', isCorrect: false },
              ],
            },
            {
              id: 'ex-es-1-2',
              type: ExerciseType.TRANSLATION,
              question: "Translate 'Good morning' to Spanish:",
              expectedAnswer: 'Buenos días',
              alternatives: ['buenos dias', 'buenos días', 'buen dia'],
              explanation: "'Buenos días' is used until noon to wish someone a good morning.",
              options: [],
            },
            {
              id: 'ex-es-1-3',
              type: ExerciseType.FILL_IN_BLANK,
              question: "Complete the greeting: '___, ¿cómo estás?' (Hello, how are you?)",
              expectedAnswer: 'Hola',
              alternatives: ['hola'],
              explanation: "'Hola' completes the sentence: 'Hola, ¿cómo estás?'",
              options: [],
            },
          ],
        },
        {
          id: 'lesson-es-2',
          title: 'Lesson 2: Courtesies & Names',
          orderIndex: 2,
          exercises: [
            {
              id: 'ex-es-2-1',
              type: ExerciseType.MULTIPLE_CHOICE,
              question: "Which word means 'Please' in Spanish?",
              expectedAnswer: 'Por favor',
              alternatives: ['por favor'],
              explanation: "'Por favor' is the polite Spanish phrase for 'Please'.",
              options: [
                { text: 'Por favor', isCorrect: true },
                { text: 'De nada', isCorrect: false },
                { text: 'Buenas noches', isCorrect: false },
                { text: 'Hasta luego', isCorrect: false },
              ],
            },
            {
              id: 'ex-es-2-2',
              type: ExerciseType.TRANSLATION,
              question: "Translate 'Thank you' to Spanish:",
              expectedAnswer: 'Gracias',
              alternatives: ['gracias', 'muchas gracias'],
              explanation: "'Gracias' means 'Thank you'.",
              options: [],
            },
          ],
        },
      ],
      vocab: [
        { id: 'vocab-es-1', word: 'Hola', phonetic: 'OH-lah', translation: 'Hello / Hi', partOfSpeech: 'Interjection', exampleSentence: '¡Hola! ¿Cómo estás?', exampleTranslation: 'Hello! How are you?' },
        { id: 'vocab-es-2', word: 'Buenos días', phonetic: 'BWEH-nohs DEE-ahs', translation: 'Good morning', partOfSpeech: 'Phrase', exampleSentence: 'Buenos días, señor.', exampleTranslation: 'Good morning, sir.' },
        { id: 'vocab-es-3', word: 'Gracias', phonetic: 'GRAH-syahs', translation: 'Thank you', partOfSpeech: 'Interjection', exampleSentence: 'Muchas gracias por tu ayuda.', exampleTranslation: 'Thank you very much for your help.' },
        { id: 'vocab-es-4', word: 'Por favor', phonetic: 'pohr fah-BVOHR', translation: 'Please', partOfSpeech: 'Phrase', exampleSentence: 'Un café, por favor.', exampleTranslation: 'A coffee, please.' },
        { id: 'vocab-es-5', word: 'Adiós', phonetic: 'ah-DYOHS', translation: 'Goodbye', partOfSpeech: 'Interjection', exampleSentence: 'Adiós, ¡hasta mañana!', exampleTranslation: 'Goodbye, see you tomorrow!' },
      ],
    },
    {
      id: 'course-fr-a1',
      targetCode: 'fr',
      sourceCode: 'hi',
      title: 'French Foundations',
      description: 'Learn everyday French from scratch',
      sectionTitle: 'Section 1: Greetings & Essentials',
      unitTitle: 'Unit 1: Hello & Introductions',
      unitGuide: 'Key greetings in French: Bonjour (Hello), Merci (Thank you), Au revoir (Goodbye).',
      lessons: [
        {
          id: 'lesson-fr-1',
          title: 'Lesson 1: Saying Hello in French',
          orderIndex: 1,
          exercises: [
            {
              id: 'ex-fr-1-1',
              type: ExerciseType.MULTIPLE_CHOICE,
              question: "How do you say 'Hello' in French?",
              expectedAnswer: 'Bonjour',
              alternatives: ['bonjour'],
              explanation: "'Bonjour' is the standard greeting in French.",
              options: [
                { text: 'Bonjour', isCorrect: true },
                { text: 'Hola', isCorrect: false },
                { text: 'Hello', isCorrect: false },
                { text: 'Ciao', isCorrect: false },
              ],
            },
            {
              id: 'ex-fr-1-2',
              type: ExerciseType.TRANSLATION,
              question: "Translate 'Thank you' to French:",
              expectedAnswer: 'Merci',
              alternatives: ['merci', 'merci beaucoup'],
              explanation: "'Merci' is 'Thank you' in French.",
              options: [],
            },
            {
              id: 'ex-fr-1-3',
              type: ExerciseType.FILL_IN_BLANK,
              question: "Complete the phrase: 'Comment allez-___?' (How are you?)",
              expectedAnswer: 'vous',
              alternatives: ['vous'],
              explanation: "'Comment allez-vous?' is the polite formal greeting.",
              options: [],
            },
          ],
        },
      ],
      vocab: [
        { id: 'vocab-fr-1', word: 'Bonjour', phonetic: 'bohn-ZHOOR', translation: 'Hello / Good morning', partOfSpeech: 'Interjection', exampleSentence: 'Bonjour, comment allez-vous?', exampleTranslation: 'Hello, how are you?' },
        { id: 'vocab-fr-2', word: 'Merci', phonetic: 'mehr-SEE', translation: 'Thank you', partOfSpeech: 'Interjection', exampleSentence: 'Merci beaucoup.', exampleTranslation: 'Thank you very much.' },
        { id: 'vocab-fr-3', word: "S'il vous plaît", phonetic: 'seel voo PLEH', translation: 'Please', partOfSpeech: 'Phrase', exampleSentence: 'Un café, s\'il vous plaît.', exampleTranslation: 'A coffee, please.' },
        { id: 'vocab-fr-4', word: 'Au revoir', phonetic: 'oh ruh-VWAHR', translation: 'Goodbye', partOfSpeech: 'Phrase', exampleSentence: 'Au revoir et bonne journée!', exampleTranslation: 'Goodbye and have a good day!' },
      ],
    },
    {
      id: 'course-de-a1',
      targetCode: 'de',
      sourceCode: 'hi',
      title: 'German Foundations',
      description: 'Learn everyday German from scratch',
      sectionTitle: 'Section 1: Begrüßungen & Basics',
      unitTitle: 'Unit 1: Hello & Introductions',
      unitGuide: 'Key greetings in German: Hallo (Hello), Danke (Thank you), Guten Tag (Good day).',
      lessons: [
        {
          id: 'lesson-de-1',
          title: 'Lesson 1: German Greetings',
          orderIndex: 1,
          exercises: [
            {
              id: 'ex-de-1-1',
              type: ExerciseType.MULTIPLE_CHOICE,
              question: "How do you say 'Hello' in German?",
              expectedAnswer: 'Hallo',
              alternatives: ['hallo'],
              explanation: "'Hallo' is the friendly, everyday greeting in German.",
              options: [
                { text: 'Hallo', isCorrect: true },
                { text: 'Hola', isCorrect: false },
                { text: 'Bonjour', isCorrect: false },
                { text: 'Ciao', isCorrect: false },
              ],
            },
            {
              id: 'ex-de-1-2',
              type: ExerciseType.TRANSLATION,
              question: "Translate 'Thank you' to German:",
              expectedAnswer: 'Danke',
              alternatives: ['danke', 'danke schön'],
              explanation: "'Danke' means 'Thank you'.",
              options: [],
            },
            {
              id: 'ex-de-1-3',
              type: ExerciseType.FILL_IN_BLANK,
              question: "Complete the greeting: 'Guten ___!' (Good morning)",
              expectedAnswer: 'Morgen',
              alternatives: ['morgen'],
              explanation: "'Guten Morgen' is Good morning in German.",
              options: [],
            },
          ],
        },
      ],
      vocab: [
        { id: 'vocab-de-1', word: 'Hallo', phonetic: 'HAH-loh', translation: 'Hello', partOfSpeech: 'Interjection', exampleSentence: 'Hallo! Wie geht es dir?', exampleTranslation: 'Hello! How are you?' },
        { id: 'vocab-de-2', word: 'Danke', phonetic: 'DAHN-kuh', translation: 'Thank you', partOfSpeech: 'Interjection', exampleSentence: 'Danke für deine Hilfe.', exampleTranslation: 'Thank you for your help.' },
        { id: 'vocab-de-3', word: 'Bitte', phonetic: 'BIT-tuh', translation: 'Please / You are welcome', partOfSpeech: 'Interjection', exampleSentence: 'Ein Wasser, bitte.', exampleTranslation: 'A water, please.' },
        { id: 'vocab-de-4', word: 'Auf Wiedersehen', phonetic: 'owf VEE-der-zayn', translation: 'Goodbye', partOfSpeech: 'Phrase', exampleSentence: 'Auf Wiedersehen, bis bald!', exampleTranslation: 'Goodbye, see you soon!' },
      ],
    },
    {
      id: 'course-ja-a1',
      targetCode: 'ja',
      sourceCode: 'hi',
      title: 'Japanese Foundations',
      description: 'Master everyday Japanese greetings and essential phrases',
      sectionTitle: 'Section 1: Aisatsu (Greetings)',
      unitTitle: 'Unit 1: Essential Greetings',
      unitGuide: 'Basic greetings in Japanese: Konnichiwa (Hello), Arigatou (Thank you).',
      lessons: [
        {
          id: 'lesson-ja-1',
          title: 'Lesson 1: Everyday Greetings',
          orderIndex: 1,
          exercises: [
            {
              id: 'ex-ja-1-1',
              type: ExerciseType.MULTIPLE_CHOICE,
              question: "How do you say 'Hello' in Japanese during the day?",
              expectedAnswer: 'Konnichiwa',
              alternatives: ['konnichiwa', 'こんにちは'],
              explanation: "'Konnichiwa' is the standard daytime greeting in Japanese.",
              options: [
                { text: 'Konnichiwa', isCorrect: true },
                { text: 'Sayounara', isCorrect: false },
                { text: 'Arigatou', isCorrect: false },
                { text: 'Oyasumi', isCorrect: false },
              ],
            },
            {
              id: 'ex-ja-1-2',
              type: ExerciseType.TRANSLATION,
              question: "Translate 'Thank you' to Japanese (romaji):",
              expectedAnswer: 'Arigatou',
              alternatives: ['arigatou', 'arigato', 'arigatou gozaimasu', 'ありがとう'],
              explanation: "'Arigatou' is 'Thank you' in Japanese.",
              options: [],
            },
            {
              id: 'ex-ja-1-3',
              type: ExerciseType.FILL_IN_BLANK,
              question: "Complete the greeting: 'Ohayou ___' (Good morning polite)",
              expectedAnswer: 'gozaimasu',
              alternatives: ['gozaimasu', 'ございます'],
              explanation: "'Ohayou gozaimasu' is polite Good morning.",
              options: [],
            },
          ],
        },
      ],
      vocab: [
        { id: 'vocab-ja-1', word: 'Konnichiwa', phonetic: 'kohn-nee-chee-wah', translation: 'Hello / Good afternoon (こんにちは)', partOfSpeech: 'Interjection', exampleSentence: 'Konnichiwa, genki desu ka?', exampleTranslation: 'Hello, how are you?' },
        { id: 'vocab-ja-2', word: 'Arigatou', phonetic: 'ah-ree-gah-toh', translation: 'Thank you (ありがとう)', partOfSpeech: 'Interjection', exampleSentence: 'Doumo arigatou gozaimasu.', exampleTranslation: 'Thank you very much.' },
        { id: 'vocab-ja-3', word: 'Sayounara', phonetic: 'sah-yoh-nah-rah', translation: 'Goodbye (さようなら)', partOfSpeech: 'Interjection', exampleSentence: 'Sayounara, mata ashita!', exampleTranslation: 'Goodbye, see you tomorrow!' },
        { id: 'vocab-ja-4', word: 'Hai', phonetic: 'high', translation: 'Yes (はい)', partOfSpeech: 'Interjection', exampleSentence: 'Hai, wakarimashita.', exampleTranslation: 'Yes, I understood.' },
      ],
    },
  ];

  for (const cData of coursesToSeed) {
    console.log(`Seeding course: ${cData.title} (${cData.targetCode})...`);
    const targetLang = await prisma.language.findUnique({ where: { code: cData.targetCode } });
    if (!targetLang) continue;

    const levelA1 = await prisma.languageLevel.upsert({
      where: { languageId_level: { languageId: targetLang.id, level: CEFRLevel.A1 } },
      update: { name: 'Beginner A1', description: 'Elementary communication' },
      create: {
        languageId: targetLang.id,
        level: CEFRLevel.A1,
        name: 'Beginner A1',
        description: 'Elementary communication',
        orderIndex: 1,
      },
    });

    const course = await prisma.course.upsert({
      where: { id: cData.id },
      update: {
        title: cData.title,
        description: cData.description,
        languageId: targetLang.id,
        sourceLanguageId: hiLang?.id || null,
        languageLevelId: levelA1.id,
        isPublished: true,
      },
      create: {
        id: cData.id,
        languageId: targetLang.id,
        sourceLanguageId: hiLang?.id || null,
        languageLevelId: levelA1.id,
        title: cData.title,
        description: cData.description,
        isPublished: true,
      },
    });

    const section = await prisma.courseSection.upsert({
      where: { id: `section-${cData.targetCode}-1` },
      update: { title: cData.sectionTitle, orderIndex: 1 },
      create: {
        id: `section-${cData.targetCode}-1`,
        courseId: course.id,
        title: cData.sectionTitle,
        orderIndex: 1,
      },
    });

    const unit = await prisma.courseUnit.upsert({
      where: { id: `unit-${cData.targetCode}-1` },
      update: { title: cData.unitTitle, guideBook: cData.unitGuide, orderIndex: 1 },
      create: {
        id: `unit-${cData.targetCode}-1`,
        sectionId: section.id,
        title: cData.unitTitle,
        guideBook: cData.unitGuide,
        orderIndex: 1,
      },
    });

    for (const lData of cData.lessons) {
      const lesson = await prisma.lesson.upsert({
        where: { id: lData.id },
        update: { title: lData.title, orderIndex: lData.orderIndex, xpReward: 20, gemReward: 2 },
        create: {
          id: lData.id,
          unitId: unit.id,
          title: lData.title,
          orderIndex: lData.orderIndex,
          xpReward: 20,
          gemReward: 2,
        },
      });

      for (let i = 0; i < lData.exercises.length; i++) {
        const exData = lData.exercises[i];
        const exercise = await prisma.exercise.upsert({
          where: { id: exData.id },
          update: {
            type: exData.type,
            question: exData.question,
            expectedAnswer: exData.expectedAnswer,
            acceptableAlternatives: exData.alternatives,
            explanation: exData.explanation,
            xp: 5,
            difficulty: 1,
            orderIndex: i + 1,
          },
          create: {
            id: exData.id,
            lessonId: lesson.id,
            type: exData.type,
            question: exData.question,
            expectedAnswer: exData.expectedAnswer,
            acceptableAlternatives: exData.alternatives,
            explanation: exData.explanation,
            xp: 5,
            difficulty: 1,
            orderIndex: i + 1,
          },
        });

        if (exData.options.length > 0) {
          await prisma.exerciseOption.deleteMany({ where: { exerciseId: exercise.id } });
          await prisma.exerciseOption.createMany({
            data: exData.options.map((opt, optIdx) => ({
              exerciseId: exercise.id,
              text: opt.text,
              isCorrect: opt.isCorrect,
              orderIndex: optIdx + 1,
            })),
          });
        }
      }
    }

    // Seed vocabulary for this language
    for (const v of cData.vocab) {
      await prisma.vocabularyWord.upsert({
        where: { id: v.id },
        update: { ...v, languageId: targetLang.id },
        create: { ...v, languageId: targetLang.id },
      });
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
