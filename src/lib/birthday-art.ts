import { getBirthdayNameFontOption, getBirthdayNameFontStack } from './birthday-name-fonts';
import type { BirthdayBackgroundLayout } from '../types/shared';

interface GenerateBirthdayArtInput {
  backgroundUrl: string;
  personPhotoUrl?: string;
  displayName: string;
  photoMaskShape?: 'circle' | 'square';
  nameFontKey?: string;
  layout?: BirthdayBackgroundLayout;
}

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;
const defaultLayout: BirthdayBackgroundLayout = {
  photoXPercent: 50,
  photoYPercent: 29.2,
  photoSizePercent: 42.6,
  showPhoto: true,
  nameXPercent: 51.7,
  nameYPercent: 68.7,
  nameSizePercent: 24,
  showName: true,
};

export async function generateBirthdayArt(input: GenerateBirthdayArtInput) {
  await ensureBirthdayNameFontReady(input.nameFontKey);

  const normalizedLayout = normalizeLayout(input.layout);
  const backgroundImage = await loadImage(input.backgroundUrl);
  const personImage = normalizedLayout.showPhoto && input.personPhotoUrl ? await loadImage(input.personPhotoUrl) : null;

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Não foi possível gerar a arte.');
  }

  const photoDiameter = (CANVAS_WIDTH * normalizedLayout.photoSizePercent) / 100;
  const photoRadius = photoDiameter / 2;
  const photoCenterX = (CANVAS_WIDTH * normalizedLayout.photoXPercent) / 100;
  const photoCenterY = (CANVAS_HEIGHT * normalizedLayout.photoYPercent) / 100;

  drawCover(context, backgroundImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0.5);
  if (personImage && normalizedLayout.showPhoto) {
    if (input.photoMaskShape === 'square') {
      drawSquarePhoto(context, personImage, photoCenterX, photoCenterY, photoRadius);
    } else {
      drawCircularPhoto(context, personImage, photoCenterX, photoCenterY, photoRadius);
    }
  }
  if (normalizedLayout.showName) {
    drawOverlayTexts(context, input.displayName, normalizedLayout, input.nameFontKey);
  }

  return canvas.toDataURL('image/png');
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível carregar uma das imagens.'));
    image.src = url;
  });
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  focusY: number,
) {
  const sourceRatio = image.width / image.height;
  const targetRatio = width / height;

  let sourceWidth = image.width;
  let sourceHeight = image.height;
  let sourceX = 0;
  let sourceY = 0;

  if (sourceRatio > targetRatio) {
    sourceWidth = image.height * targetRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / targetRatio;
    sourceY = (image.height - sourceHeight) * Math.min(Math.max(focusY, 0), 1);
  }

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawCircularPhoto(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  centerX: number,
  centerY: number,
  radius: number,
) {
  context.save();
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.closePath();
  context.clip();

  const diameter = radius * 2;
  drawCover(context, image, centerX - radius, centerY - radius, diameter, diameter, 0.32);
  context.restore();

  context.save();
  context.beginPath();
  context.arc(centerX, centerY, radius + 3, 0, Math.PI * 2);
  context.strokeStyle = 'rgba(212, 173, 96, 0.85)';
  context.lineWidth = 6;
  context.stroke();
  context.restore();
}

function drawSquarePhoto(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  centerX: number,
  centerY: number,
  radius: number,
) {
  const side = radius * 2;
  const x = centerX - radius;
  const y = centerY - radius;

  context.save();
  context.beginPath();
  context.rect(x, y, side, side);
  context.closePath();
  context.clip();
  drawCover(context, image, x, y, side, side, 0.32);
  context.restore();

  context.save();
  context.strokeStyle = 'rgba(212, 173, 96, 0.85)';
  context.lineWidth = 6;
  context.strokeRect(x - 3, y - 3, side + 6, side + 6);
  context.restore();
}

function drawOverlayTexts(
  context: CanvasRenderingContext2D,
  displayName: string,
  layout: BirthdayBackgroundLayout,
  nameFontKey: string | undefined,
) {
  const nameY = (CANVAS_HEIGHT * layout.nameYPercent) / 100;
  const nameX = (CANVAS_WIDTH * layout.nameXPercent) / 100;
  const cleanName = displayName.trim() || 'Você';
  const maxNameWidth = CANVAS_WIDTH * 0.82;
  const maxFontSize = Math.max(96, (CANVAS_WIDTH * layout.nameSizePercent) / 100);
  const minFontSize = 96;
  let fontSize = maxFontSize;
  const nameFontStack = getBirthdayNameFontStack(nameFontKey);

  // Mantém o nome em destaque, reduzindo apenas para evitar colisões visuais.
  while (fontSize > minFontSize) {
    context.font = `400 ${fontSize}px ${nameFontStack}`;
    if (context.measureText(cleanName).width <= maxNameWidth) {
      break;
    }
    fontSize -= 8;
  }

  context.save();
  context.textAlign = 'center';
  context.fillStyle = '#5f430f';
  context.font = `400 ${fontSize}px ${nameFontStack}`;
  context.fillText(cleanName, nameX, nameY);
  context.restore();
}

function normalizeLayout(layout: BirthdayBackgroundLayout | undefined): BirthdayBackgroundLayout {
  if (!layout) {
    return { ...defaultLayout };
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

async function ensureBirthdayNameFontReady(nameFontKey: string | undefined) {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return;
  }

  const fontOption = getBirthdayNameFontOption(nameFontKey);
  const fontSet = document.fonts;
  await Promise.allSettled([fontSet.load(`400 132px '${fontOption.familyName}'`)]);
}
