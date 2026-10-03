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
  {
    code: 'FIRST_LESSON',
    title: 'First Steps',
    description: 'Complete your first lesson.',
    badgeIcon: '🎯',
    maxTier: 1,
  },
  {
    code: 'FIRST_PRACTICE',
    title: 'Practice Champion',
    description: 'Complete your first practice session.',
    badgeIcon: '🏋️',
    maxTier: 1,
  },
  {
    code: 'FIRST_100_XP',
    title: 'Century Club',
    description: 'Earn your first 100 XP.',
    badgeIcon: '💯',
    maxTier: 1,
  },
  {
    code: 'THREE_DAY_STREAK',
    title: 'Momentum',
    description: 'Maintain a 3-day learning streak.',
    badgeIcon: '🔥',
    maxTier: 1,
  },
  {
    code: 'SEVEN_DAY_STREAK',
    title: 'Unstoppable',
    description: 'Reach a 7-day learning streak.',
    badgeIcon: '⚡',
    maxTier: 1,
  },
  {
    code: 'TEN_LESSONS',
    title: 'Dedicated Scholar',
    description: 'Complete 10 lessons.',
    badgeIcon: '📚',
    maxTier: 1,
  },
  {
    code: 'FIFTY_EXERCISES',
    title: 'Sharpshooter',
    description: 'Answer 50 exercises correctly.',
    badgeIcon: '🏹',
    maxTier: 1,
  },
  {
    code: 'FIRST_COURSE_PROGRESS',
    title: 'Pathfinder',
    description: 'Start learning your first language course.',
    badgeIcon: '🧭',
    maxTier: 1,
  },
  {
    code: 'FIRST_AI_CONVERSATION',
    title: 'AI Conversationalist',
    description: 'Complete your first conversation session with an AI tutor.',
    badgeIcon: '🤖',
    maxTier: 1,
  },
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
    {
      id: 'quest-complete-lesson',
      title: 'Complete a Lesson',
      description: 'Finish any lesson on your learning path.',
      questType: 'COMPLETE_LESSONS',
      targetCount: 1,
      xpReward: 20,
      gemReward: 5,
      startDate,
      endDate,
    },
    {
      id: 'quest-earn-xp',
      title: 'XP Climber',
      description: 'Earn 30 XP through lessons or practice.',
      questType: 'EARN_XP',
      targetCount: 30,
      xpReward: 15,
      gemReward: 3,
      startDate,
      endDate,
    },
    {
      id: 'quest-complete-exercises',
      title: 'Exercise Marathon',
      description: 'Solve 5 exercises accurately.',
      questType: 'COMPLETE_EXERCISES',
      targetCount: 5,
      xpReward: 15,
      gemReward: 3,
      startDate,
      endDate,
    },
    {
      id: 'quest-complete-practice',
      title: 'Sharpen Your Mind',
      description: 'Complete 1 practice session.',
      questType: 'COMPLETE_PRACTICE',
      targetCount: 1,
      xpReward: 20,
      gemReward: 5,
      startDate,
      endDate,
    },
    {
      id: 'quest-maintain-streak',
      title: 'Daily Dedication',
      description: 'Extend your streak by practicing today.',
      questType: 'MAINTAIN_STREAK',
      targetCount: 1,
      xpReward: 25,
      gemReward: 5,
      startDate,
      endDate,
    },
    {
      id: 'quest-ai-chat',
      title: 'Chat with an AI Tutor',
      description: 'Practice conversational skills with your AI tutor.',
      questType: 'AI_CHAT',
      targetCount: 1,
      xpReward: 25,
      gemReward: 5,
      startDate,
      endDate,
    },
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
    {
      id: 'char-mateo',
      name: 'Mateo',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      personalityPrompt: 'You are Mateo, a friendly, warm, and patient barista in Madrid. You speak Spanish at a beginner-friendly A1-A2 level. You enjoy talking about coffee, daily routines, food, and introducing newcomers to Spanish with encouraging phrases.',
      defaultVoice: 'es-ES-Neural2-A',
      targetLanguageCode: 'es',
      difficultyCEFR: CEFRLevel.A1,
      isActive: true,
    },
    {
      id: 'char-elena',
      name: 'Prof. Elena',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      personalityPrompt: 'You are Professor Elena, an articulate and encouraging Spanish linguistics professor. You converse in clear, structured Spanish (B1-B2 level), offering thoughtful explanations and rich conversation about culture, history, and literature.',
      defaultVoice: 'es-ES-Neural2-F',
      targetLanguageCode: 'es',
      difficultyCEFR: CEFRLevel.B1,
      isActive: true,
    },
    {
      id: 'char-sofia',
      name: 'Sofia',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      personalityPrompt: 'You are Sofia, an energetic backpacker and photographer exploring Latin America. You talk about travel, adventures, asking for directions, ordering street food, and making friends in lively conversational Spanish (A2 level).',
      defaultVoice: 'es-MX-Neural2-A',
      targetLanguageCode: 'es',
      difficultyCEFR: CEFRLevel.A2,
      isActive: true,
    },
    {
      id: 'char-alex',
      name: 'Alex',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      personalityPrompt: 'You are Alex, a bilingual software architect in Valencia. You speak modern Spanish (B2 level) about technology, startups, career, and daily work life, helping learners master fluent professional dialogue.',
      defaultVoice: 'es-ES-Neural2-B',
      targetLanguageCode: 'es',
      difficultyCEFR: CEFRLevel.B2,
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

  // Seed Spanish Course, Units, Lessons & Exercises
  console.log('Seeding Spanish Foundations Course...');
  const esLang = await prisma.language.findUnique({ where: { code: 'es' } });
  if (esLang) {
    const levelA1 = await prisma.languageLevel.upsert({
      where: { languageId_level: { languageId: esLang.id, level: CEFRLevel.A1 } },
      update: { name: 'Beginner A1', description: 'Elementary communication' },
      create: {
        languageId: esLang.id,
        level: CEFRLevel.A1,
        name: 'Beginner A1',
        description: 'Elementary communication',
        orderIndex: 1,
      },
    });

    const course = await prisma.course.upsert({
      where: { id: 'course-es-a1' },
      update: {
        title: 'Spanish Foundations',
        description: 'Learn everyday Spanish from scratch',
        isPublished: true,
      },
      create: {
        id: 'course-es-a1',
        languageId: esLang.id,
        languageLevelId: levelA1.id,
        title: 'Spanish Foundations',
        description: 'Learn everyday Spanish from scratch',
        isPublished: true,
      },
    });

    const section = await prisma.courseSection.upsert({
      where: { id: 'section-es-1' },
      update: {
        title: 'Section 1: Greetings & Essentials',
        orderIndex: 1,
      },
      create: {
        id: 'section-es-1',
        courseId: course.id,
        title: 'Section 1: Greetings & Essentials',
        orderIndex: 1,
      },
    });

    const unit = await prisma.courseUnit.upsert({
      where: { id: 'unit-es-1' },
      update: {
        title: 'Unit 1: Hello & Introductions',
        guideBook: 'Key greetings in Spanish: Hola (Hello), Buenos días (Good morning), Gracias (Thank you).',
        orderIndex: 1,
      },
      create: {
        id: 'unit-es-1',
        sectionId: section.id,
        title: 'Unit 1: Hello & Introductions',
        guideBook: 'Key greetings in Spanish: Hola (Hello), Buenos días (Good morning), Gracias (Thank you).',
        orderIndex: 1,
      },
    });

    // Lesson 1
    const lesson1 = await prisma.lesson.upsert({
      where: { id: 'lesson-es-1' },
      update: {
        title: 'Lesson 1: Saying Hello',
        orderIndex: 1,
        xpReward: 20,
        gemReward: 2,
      },
      create: {
        id: 'lesson-es-1',
        unitId: unit.id,
        title: 'Lesson 1: Saying Hello',
        orderIndex: 1,
        xpReward: 20,
        gemReward: 2,
      },
    });

    // Exercise 1: Multiple choice
    const ex1 = await prisma.exercise.upsert({
      where: { id: 'ex-es-1-1' },
      update: {
        type: ExerciseType.MULTIPLE_CHOICE,
        question: "How do you say 'Hello' in Spanish?",
        expectedAnswer: 'Hola',
        acceptableAlternatives: ['hola'],
        explanation: "'Hola' is the universal greeting for 'Hello' or 'Hi' in Spanish.",
        xp: 5,
        difficulty: 1,
        orderIndex: 1,
      },
      create: {
        id: 'ex-es-1-1',
        lessonId: lesson1.id,
        type: ExerciseType.MULTIPLE_CHOICE,
        question: "How do you say 'Hello' in Spanish?",
        expectedAnswer: 'Hola',
        acceptableAlternatives: ['hola'],
        explanation: "'Hola' is the universal greeting for 'Hello' or 'Hi' in Spanish.",
        xp: 5,
        difficulty: 1,
        orderIndex: 1,
      },
    });

    await prisma.exerciseOption.deleteMany({ where: { exerciseId: ex1.id } });
    await prisma.exerciseOption.createMany({
      data: [
        { exerciseId: ex1.id, text: 'Hola', isCorrect: true, orderIndex: 1 },
        { exerciseId: ex1.id, text: 'Adiós', isCorrect: false, orderIndex: 2 },
        { exerciseId: ex1.id, text: 'Por favor', isCorrect: false, orderIndex: 3 },
        { exerciseId: ex1.id, text: 'Gracias', isCorrect: false, orderIndex: 4 },
      ],
    });

    // Exercise 2: Translation
    await prisma.exercise.upsert({
      where: { id: 'ex-es-1-2' },
      update: {
        type: ExerciseType.TRANSLATION,
        question: "Translate 'Good morning' to Spanish:",
        expectedAnswer: 'Buenos días',
        acceptableAlternatives: ['buenos dias', 'buenos días', 'buen dia', 'buen día'],
        explanation: "'Buenos días' is used until noon to wish someone a good morning.",
        xp: 5,
        difficulty: 1,
        orderIndex: 2,
      },
      create: {
        id: 'ex-es-1-2',
        lessonId: lesson1.id,
        type: ExerciseType.TRANSLATION,
        question: "Translate 'Good morning' to Spanish:",
        expectedAnswer: 'Buenos días',
        acceptableAlternatives: ['buenos dias', 'buenos días', 'buen dia', 'buen día'],
        explanation: "'Buenos días' is used until noon to wish someone a good morning.",
        xp: 5,
        difficulty: 1,
        orderIndex: 2,
      },
    });

    // Exercise 3: Fill in the blank
    await prisma.exercise.upsert({
      where: { id: 'ex-es-1-3' },
      update: {
        type: ExerciseType.FILL_IN_BLANK,
        question: "Complete the greeting: '___, ¿cómo estás?' (Hello, how are you?)",
        expectedAnswer: 'Hola',
        acceptableAlternatives: ['hola'],
        explanation: "'Hola' completes the sentence: 'Hola, ¿cómo estás?'",
        xp: 5,
        difficulty: 1,
        orderIndex: 3,
      },
      create: {
        id: 'ex-es-1-3',
        lessonId: lesson1.id,
        type: ExerciseType.FILL_IN_BLANK,
        question: "Complete the greeting: '___, ¿cómo estás?' (Hello, how are you?)",
        expectedAnswer: 'Hola',
        acceptableAlternatives: ['hola'],
        explanation: "'Hola' completes the sentence: 'Hola, ¿cómo estás?'",
        xp: 5,
        difficulty: 1,
        orderIndex: 3,
      },
    });

    // Lesson 2
    const lesson2 = await prisma.lesson.upsert({
      where: { id: 'lesson-es-2' },
      update: {
        title: 'Lesson 2: Courtesies & Names',
        orderIndex: 2,
        xpReward: 20,
        gemReward: 2,
      },
      create: {
        id: 'lesson-es-2',
        unitId: unit.id,
        title: 'Lesson 2: Courtesies & Names',
        orderIndex: 2,
        xpReward: 20,
        gemReward: 2,
      },
    });

    // Exercise 2-1: Multiple choice
    const ex21 = await prisma.exercise.upsert({
      where: { id: 'ex-es-2-1' },
      update: {
        type: ExerciseType.MULTIPLE_CHOICE,
        question: "Which word means 'Please' in Spanish?",
        expectedAnswer: 'Por favor',
        acceptableAlternatives: ['por favor'],
        explanation: "'Por favor' is the polite Spanish phrase for 'Please'.",
        xp: 5,
        difficulty: 1,
        orderIndex: 1,
      },
      create: {
        id: 'ex-es-2-1',
        lessonId: lesson2.id,
        type: ExerciseType.MULTIPLE_CHOICE,
        question: "Which word means 'Please' in Spanish?",
        expectedAnswer: 'Por favor',
        acceptableAlternatives: ['por favor'],
        explanation: "'Por favor' is the polite Spanish phrase for 'Please'.",
        xp: 5,
        difficulty: 1,
        orderIndex: 1,
      },
    });

    await prisma.exerciseOption.deleteMany({ where: { exerciseId: ex21.id } });
    await prisma.exerciseOption.createMany({
      data: [
        { exerciseId: ex21.id, text: 'Por favor', isCorrect: true, orderIndex: 1 },
        { exerciseId: ex21.id, text: 'De nada', isCorrect: false, orderIndex: 2 },
        { exerciseId: ex21.id, text: 'Buenas noches', isCorrect: false, orderIndex: 3 },
        { exerciseId: ex21.id, text: 'Hasta luego', isCorrect: false, orderIndex: 4 },
      ],
    });

    // Exercise 2-2: Translation
    await prisma.exercise.upsert({
      where: { id: 'ex-es-2-2' },
      update: {
        type: ExerciseType.TRANSLATION,
        question: "Translate 'Thank you' to Spanish:",
        expectedAnswer: 'Gracias',
        acceptableAlternatives: ['gracias', 'muchas gracias'],
        explanation: "'Gracias' means 'Thank you'.",
        xp: 5,
        difficulty: 1,
        orderIndex: 2,
      },
      create: {
        id: 'ex-es-2-2',
        lessonId: lesson2.id,
        type: ExerciseType.TRANSLATION,
        question: "Translate 'Thank you' to Spanish:",
        expectedAnswer: 'Gracias',
        acceptableAlternatives: ['gracias', 'muchas gracias'],
        explanation: "'Gracias' means 'Thank you'.",
        xp: 5,
        difficulty: 1,
        orderIndex: 2,
      },
    });

    // Exercise 2-3: Fill in blank
    await prisma.exercise.upsert({
      where: { id: 'ex-es-2-3' },
      update: {
        type: ExerciseType.FILL_IN_BLANK,
        question: "Complete the introduction: '___ llamo Carlos.' (My name is Carlos)",
        expectedAnswer: 'Me',
        acceptableAlternatives: ['me'],
        explanation: "'Me llamo' translates literally to 'I call myself', meaning 'My name is'.",
        xp: 5,
        difficulty: 1,
        orderIndex: 3,
      },
      create: {
        id: 'ex-es-2-3',
        lessonId: lesson2.id,
        type: ExerciseType.FILL_IN_BLANK,
        question: "Complete the introduction: '___ llamo Carlos.' (My name is Carlos)",
        expectedAnswer: 'Me',
        acceptableAlternatives: ['me'],
        explanation: "'Me llamo' translates literally to 'I call myself', meaning 'My name is'.",
        xp: 5,
        difficulty: 1,
        orderIndex: 3,
      },
    });

    // Seed Spanish Vocabulary Words
    const vocabList = [
      {
        id: 'vocab-es-1',
        word: 'Hola',
        phonetic: 'OH-lah',
        translation: 'Hello / Hi',
        partOfSpeech: 'Interjection',
        exampleSentence: '¡Hola! ¿Cómo estás?',
        exampleTranslation: 'Hello! How are you?',
        level: CEFRLevel.A1,
      },
      {
        id: 'vocab-es-2',
        word: 'Buenos días',
        phonetic: 'BWEH-nohs DEE-ahs',
        translation: 'Good morning',
        partOfSpeech: 'Phrase',
        exampleSentence: 'Buenos días, señor.',
        exampleTranslation: 'Good morning, sir.',
        level: CEFRLevel.A1,
      },
      {
        id: 'vocab-es-3',
        word: 'Gracias',
        phonetic: 'GRAH-syahs',
        translation: 'Thank you',
        partOfSpeech: 'Interjection',
        exampleSentence: 'Muchas gracias por tu ayuda.',
        exampleTranslation: 'Thank you very much for your help.',
        level: CEFRLevel.A1,
      },
      {
        id: 'vocab-es-4',
        word: 'Por favor',
        phonetic: 'pohr fah-BVOHR',
        translation: 'Please',
        partOfSpeech: 'Phrase',
        exampleSentence: 'Un café, por favor.',
        exampleTranslation: 'A coffee, please.',
        level: CEFRLevel.A1,
      },
      {
        id: 'vocab-es-5',
        word: 'Adiós',
        phonetic: 'ah-DYOHS',
        translation: 'Goodbye',
        partOfSpeech: 'Interjection',
        exampleSentence: 'Adiós, ¡hasta mañana!',
        exampleTranslation: 'Goodbye, see you tomorrow!',
        level: CEFRLevel.A1,
      },
    ];

    for (const v of vocabList) {
      await prisma.vocabularyWord.upsert({
        where: { id: v.id },
        update: { ...v, languageId: esLang.id },
        create: { ...v, languageId: esLang.id },
      });
    }
    console.log(`Seeded ${vocabList.length} Spanish vocabulary words.`);
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
