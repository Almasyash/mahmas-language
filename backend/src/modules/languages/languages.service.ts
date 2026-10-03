import prisma from '../../database/prisma';

export class LanguagesService {
  async getActiveLanguages() {
    return prisma.language.findMany({
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
  }

  async getLanguageByIdOrCode(idOrCode: string) {
    return prisma.language.findFirst({
      where: {
        OR: [{ id: idOrCode }, { code: idOrCode }],
        isActive: true,
      },
    });
  }
}

export const languagesService = new LanguagesService();
