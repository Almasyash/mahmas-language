import { PrismaClient, ExerciseType, CEFRLevel } from '@prisma/client';
import prismaInstance from './prisma';

export const initialLanguages = [
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

export const initialAchievements = [
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

export const initialCharacters = [
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

export async function seedInitialData(prisma: PrismaClient = prismaInstance): Promise<void> {
  console.log('[Seed] Seeding initial languages...');
  for (const lang of initialLanguages) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: lang,
      create: lang,
    });
  }
  console.log(`[Seed] Seeded ${initialLanguages.length} languages successfully.`);

  console.log('[Seed] Seeding initial achievements...');
  for (const ach of initialAchievements) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: ach,
      create: ach,
    });
  }

  console.log('[Seed] Seeding initial quests...');
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

  console.log('[Seed] Seeding AI characters...');
  for (const char of initialCharacters) {
    await prisma.aICharacter.upsert({
      where: { id: char.id },
      update: char,
      create: char,
    });
  }

  // Course Definitions
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
          ],
        },
      ],
      vocab: [
        { id: 'vocab-en-1', word: 'Hello', phonetic: 'hə-LOH', translation: 'नमस्ते / Hello', partOfSpeech: 'Interjection', exampleSentence: 'Hello, how are you?', exampleTranslation: 'नमस्ते, आप कैसे हैं?' },
        { id: 'vocab-en-2', word: 'Good morning', phonetic: 'gud MAWR-ning', translation: 'शुभ प्रभात', partOfSpeech: 'Phrase', exampleSentence: 'Good morning, everyone.', exampleTranslation: 'सभी को शुभ प्रभात।' },
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
          ],
        },
      ],
      vocab: [
        { id: 'vocab-es-1', word: 'Hola', phonetic: 'OH-lah', translation: 'Hello / Hi', partOfSpeech: 'Interjection', exampleSentence: '¡Hola! ¿Cómo estás?', exampleTranslation: 'Hello! How are you?' },
        { id: 'vocab-es-2', word: 'Buenos días', phonetic: 'BWEH-nohs DEE-ahs', translation: 'Good morning', partOfSpeech: 'Phrase', exampleSentence: 'Buenos días, señor.', exampleTranslation: 'Good morning, sir.' },
      ],
    },
  ];

  for (const cData of coursesToSeed) {
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

    for (const v of cData.vocab) {
      await prisma.vocabularyWord.upsert({
        where: { id: v.id },
        update: { ...v, languageId: targetLang.id },
        create: { ...v, languageId: targetLang.id },
      });
    }
  }

  console.log('[Seed] Seeding completed successfully!');
}
