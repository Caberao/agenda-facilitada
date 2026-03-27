import dayjs from 'dayjs';
import type { BirthdayBackground, BirthdayBackgroundLayout } from '../types/shared';
import { dataRepository } from '../repositories';
import { createId } from '../utils/id';

type BirthdayBackgroundInput = Omit<BirthdayBackground, 'id' | 'createdAt' | 'updatedAt'>;

const defaultBackgroundLayout: BirthdayBackgroundLayout = {
  photoXPercent: 50,
  photoYPercent: 29.2,
  photoSizePercent: 42.6,
  showPhoto: true,
  nameXPercent: 51.7,
  nameYPercent: 68.7,
  nameSizePercent: 24,
  showName: true,
};
const defaultNameFontKey = 'magic_wall';

function normalizeOptional(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeLayout(layout: BirthdayBackgroundLayout | undefined): BirthdayBackgroundLayout {
  if (!layout) {
    return { ...defaultBackgroundLayout };
  }

  return {
    photoXPercent: layout.photoXPercent,
    photoYPercent: layout.photoYPercent,
    photoSizePercent: layout.photoSizePercent,
    showPhoto: layout.showPhoto ?? true,
    nameXPercent: layout.nameXPercent,
    nameYPercent: layout.nameYPercent,
    nameSizePercent: layout.nameSizePercent,
    showName: layout.showName ?? true,
  };
}

class BirthdayBackgroundsService {
  async list() {
    const backgrounds = await dataRepository.getBirthdayBackgrounds();
    return backgrounds
      .map((background) => ({
        ...background,
        photoMaskShape: background.photoMaskShape ?? 'circle',
        nameFontKey: background.nameFontKey ?? defaultNameFontKey,
        layout: normalizeLayout(background.layout),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async create(input: BirthdayBackgroundInput) {
    const now = dayjs().toISOString();
    const groupId = normalizeOptional(input.groupId);
    const background: BirthdayBackground = {
      id: createId('bgbg'),
      name: input.name.trim(),
      imageUrl: input.imageUrl.trim(),
      scope: input.scope,
      ...(input.scope === 'group' && groupId ? { groupId } : {}),
      photoMaskShape: input.photoMaskShape ?? 'circle',
      nameFontKey: input.nameFontKey?.trim() || defaultNameFontKey,
      layout: normalizeLayout(input.layout),
      active: input.active,
      createdAt: now,
      updatedAt: now,
    };

    const backgrounds = await dataRepository.getBirthdayBackgrounds();
    await dataRepository.setBirthdayBackgrounds([background, ...backgrounds]);
    return background;
  }

  async update(id: string, input: BirthdayBackgroundInput) {
    const backgrounds = await dataRepository.getBirthdayBackgrounds();
    const current = backgrounds.find((item) => item.id === id);
    if (!current) {
      return null;
    }

    const groupId = normalizeOptional(input.groupId);
    const updated: BirthdayBackground = {
      id: current.id,
      name: input.name.trim(),
      imageUrl: input.imageUrl.trim(),
      scope: input.scope,
      ...(input.scope === 'group' && groupId ? { groupId } : {}),
      photoMaskShape: input.photoMaskShape ?? current.photoMaskShape ?? 'circle',
      nameFontKey: input.nameFontKey?.trim() || current.nameFontKey || defaultNameFontKey,
      layout: normalizeLayout(input.layout ?? current.layout),
      active: input.active,
      createdAt: current.createdAt,
      updatedAt: dayjs().toISOString(),
    };

    await dataRepository.setBirthdayBackgrounds(backgrounds.map((item) => (item.id === id ? updated : item)));
    return updated;
  }
}

export const birthdayBackgroundsService = new BirthdayBackgroundsService();
