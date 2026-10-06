import prisma from '../../database/prisma';
import { initialLanguages } from '../../database/seed';

export class LanguagesService {
  async getActiveLanguages() {
    try {
      const languages = await prisma.language.findMany({
        where: { isActive: true },
        select: {
          id: true,
          code: true,
          name: true,
          nativeName: true,
          flagEmoji: true,
        },
        orderBy: { name: 'asc' },
      });

      if (languages && languages.length > 0) {
        return languages;
      }
    } catch (error: any) {
      console.warn('[LanguagesService] Database query notice:', error?.message || error);
    }

    // High-availability fallback to prevent any 500 server error
    return initialLanguages.map((l) => ({
      id: l.code,
      code: l.code,
      name: l.name,
      nativeName: l.nativeName,
      flagEmoji: l.flagEmoji,
    }));
  }

  async getLanguageByIdOrCode(idOrCode: string) {
    try {
      const found = await prisma.language.findFirst({
        where: {
          OR: [{ id: idOrCode }, { code: idOrCode }],
          isActive: true,
        },
      });
      if (found) return found;
    } catch (error: any) {
      console.warn('[LanguagesService] DB findFirst notice:', error?.message || error);
    }

    const fallback = initialLanguages.find((l) => l.code === idOrCode);
    if (fallback) {
      return {
        id: fallback.code,
        code: fallback.code,
        name: fallback.name,
        nativeName: fallback.nativeName,
        flagEmoji: fallback.flagEmoji,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }

    return null;
  }
}

export const languagesService = new LanguagesService();
