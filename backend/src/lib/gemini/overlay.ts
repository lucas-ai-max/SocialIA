import sharp from "sharp";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length <= maxCharsPerLine) {
      current = (current + " " + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function overlayText(params: {
  base64: string;
  mimeType: string;
  headline?: string;
  subheadline?: string;
  imageFormat: "square" | "portrait";
}): Promise<{ base64: string; mimeType: string }> {
  if (!params.headline && !params.subheadline) {
    return { base64: params.base64, mimeType: params.mimeType };
  }

  const imageBuffer = Buffer.from(params.base64, "base64");
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 1080;
  const height = metadata.height || (params.imageFormat === "portrait" ? 1350 : 1080);

  // Safe horizontal area (respect margens laterais)
  const sidePadding = Math.round(width * 0.08);
  const safeWidth = width - sidePadding * 2;

  // Wrap text por caracteres, depois ajusta fonte se ainda estourar
  const headlineLines = params.headline
    ? wrapText(params.headline.toUpperCase(), 18)
    : [];
  const subheadlineLines = params.subheadline
    ? wrapText(params.subheadline, 38)
    : [];

  // Base font sizes
  let headlineFontSize = Math.round(width * 0.078);
  let subheadlineFontSize = Math.round(width * 0.033);

  // Estimate e ajusta dinamicamente para caber em safeWidth
  // bold uppercase ~0.68x fontSize por char, regular ~0.55x
  const headlineCharFactor = 0.68;
  const subheadlineCharFactor = 0.55;

  const longestHeadline = headlineLines.reduce((m, l) => Math.max(m, l.length), 0);
  const longestSub = subheadlineLines.reduce((m, l) => Math.max(m, l.length), 0);

  const maxHeadlineW = longestHeadline * headlineFontSize * headlineCharFactor;
  if (maxHeadlineW > safeWidth) {
    headlineFontSize = Math.floor((safeWidth / (longestHeadline * headlineCharFactor)) * 0.98);
  }

  const maxSubW = longestSub * subheadlineFontSize * subheadlineCharFactor;
  if (maxSubW > safeWidth) {
    subheadlineFontSize = Math.floor((safeWidth / (longestSub * subheadlineCharFactor)) * 0.98);
  }

  const headlineLineHeight = Math.round(headlineFontSize * 1.1);
  const subheadlineLineHeight = Math.round(subheadlineFontSize * 1.3);
  const gapBetween = Math.round(subheadlineFontSize * 0.8);

  const headlineBlockHeight = headlineLines.length * headlineLineHeight;
  const subheadlineBlockHeight = subheadlineLines.length * subheadlineLineHeight;
  const totalTextHeight =
    headlineBlockHeight + (subheadlineLines.length ? gapBetween + subheadlineBlockHeight : 0);

  const startY = Math.round(height * 0.12);
  const gradientHeight = Math.max(startY + totalTextHeight + Math.round(height * 0.06), Math.round(height * 0.45));

  let y = startY + headlineFontSize * 0.85;

  const headlineSvg = headlineLines
    .map((line) => {
      const t = `<text x="${width / 2}" y="${y}" text-anchor="middle" font-family="Inter, Montserrat, 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="${headlineFontSize}" fill="#ffffff" letter-spacing="1">${escapeXml(line)}</text>`;
      y += headlineLineHeight;
      return t;
    })
    .join("\n");

  if (subheadlineLines.length) y += gapBetween - headlineLineHeight + subheadlineFontSize;

  const subheadlineSvg = subheadlineLines
    .map((line) => {
      const t = `<text x="${width / 2}" y="${y}" text-anchor="middle" font-family="Inter, Montserrat, 'Helvetica Neue', Arial, sans-serif" font-weight="500" font-size="${subheadlineFontSize}" fill="#ffffff" opacity="0.95">${escapeXml(line)}</text>`;
      y += subheadlineLineHeight;
      return t;
    })
    .join("\n");

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="textShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.95"/>
          <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#000" flood-opacity="0.9"/>
        </filter>
      </defs>
      <g filter="url(#textShadow)">
        ${headlineSvg}
        ${subheadlineSvg}
      </g>
    </svg>
  `;

  try {
    const output = await sharp(imageBuffer)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .png()
      .toBuffer();

    console.log(`[overlay] aplicado com sucesso — headline="${params.headline}" sub="${params.subheadline}"`);
    return { base64: output.toString("base64"), mimeType: "image/png" };
  } catch (err) {
    console.error("[overlay] FALHOU, retornando imagem original:", err);
    return { base64: params.base64, mimeType: params.mimeType };
  }
}
