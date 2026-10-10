import { prisma } from '../src/database/prisma';

async function inspectDb() {
  console.log('=== DATABASE VERIFICATION (PHASE 3) ===');

  const langs = await prisma.language.findMany({ orderBy: { code: 'asc' } });
  console.log(`\nLanguages Found (${langs.length}):`);
  langs.forEach(l => console.log(`  - [${l.code}] ${l.name} (${l.nativeName}) | ID: ${l.id}`));

  const courses = await prisma.course.findMany({
    include: {
      sourceLanguage: true,
      language: true,
      languageLevel: true,
      sections: {
        include: {
          units: {
            include: {
              lessons: {
                include: {
                  exercises: true,
                },
              },
            },
          },
        },
      },
    },
  });

  console.log(`\nCourses Found (${courses.length}):`);
  for (const c of courses) {
    let lessonCount = 0;
    let exerciseCount = 0;
    for (const s of c.sections) {
      for (const u of s.units) {
        lessonCount += u.lessons.length;
        for (const les of u.lessons) {
          exerciseCount += les.exercises.length;
        }
      }
    }
    const src = c.sourceLanguage?.code || 'ANY';
    const tgt = c.language.code;
    console.log(`  - [${c.id}] "${c.title}"`);
    console.log(`      Source: ${src} -> Target: ${tgt} (Level: ${c.languageLevel.level})`);
    console.log(`      Sections: ${c.sections.length}, Lessons: ${lessonCount}, Exercises: ${exerciseCount}`);
  }

  // Check exercise types present
  const exerciseTypes = await prisma.exercise.groupBy({
    by: ['type'],
    _count: { id: true },
  });
  console.log('\nExercise Types in Database:');
  exerciseTypes.forEach(et => console.log(`  - ${et.type}: ${et._count.id} exercises`));
}

inspectDb()
  .catch(err => {
    console.error('Database Inspection Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
