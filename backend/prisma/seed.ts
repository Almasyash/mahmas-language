import { PrismaClient } from '@prisma/client';

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
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
