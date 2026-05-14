
import { ScanResult } from "../types";
import { godImages } from "./godImages";
import logoPng from "../assets/LAV Logo.png";
import paperBgSrc from "../assets/background-card.jpg";

export async function generatePortrait(result: ScanResult, matchedGod: {name: string, row: number, col: number, faceScale?: number, faceY?: number}): Promise<string> {
  const width = 1080;
  const height = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Could not get canvas context");

  // Load bg
  const paperBg = new Image();
  paperBg.src = paperBgSrc;
  const paperBgLoaded = new Promise((resolve) => {
    paperBg.onload = () => resolve(true);
    paperBg.onerror = () => resolve(false);
  });
  const hasPaperBg = await paperBgLoaded;

  // Load photo
  const photo = new Image();
  photo.src = result.photoUrl;
  await new Promise((resolve) => (photo.onload = resolve));

  // Load logo
  const logo = new Image();
  logo.src = logoPng;
  const logoLoaded = new Promise((resolve) => {
    logo.onload = () => resolve(true);
    logo.onerror = () => resolve(false);
  });
  const hasLogo = await logoLoaded;

  // Load matched god image
  const godImage = new Image();
  godImage.src = godImages[matchedGod.name] || godImages["Zeus"];
  const godImageLoaded = new Promise((resolve) => {
    godImage.onload = () => resolve(true);
    godImage.onerror = () => resolve(false);
  });
  await godImageLoaded;

  // 1. Background
  if (hasPaperBg && paperBg.width > 0) {
    // cover mode
    const scale = Math.max(width / paperBg.width, height / paperBg.height);
    const sw = width / scale;
    const sh = height / scale;
    const sx = (paperBg.width - sw) / 2;
    const sy = (paperBg.height - sh) / 2;
    ctx.drawImage(paperBg, sx, sy, sw, sh, 0, 0, width, height);
  } else {
    ctx.fillStyle = "#2d160e"; 
    ctx.fillRect(0, 0, width, height);
  }

  // Outer Border
  ctx.strokeStyle = "rgba(212, 175, 55, 0.15)";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // Helper for drawing separators (matching requested style)
  const drawSeparator = (y: number) => {
    const margin = 120;
    const gradient = ctx.createLinearGradient(margin, y, width - margin, y);
    gradient.addColorStop(0, "transparent");
    gradient.addColorStop(0.5, "#d4af37");
    gradient.addColorStop(1, "transparent");
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, y);
    ctx.lineTo(width - margin, y);
    ctx.stroke();

    // Diamond symbol in center
    ctx.fillStyle = "#d4af37";
    ctx.textAlign = "center";
    ctx.font = "24px 'Inter', sans-serif";
    ctx.fillText("◆", width / 2, y + 8);
  };

  // 2. Header
  ctx.textAlign = "center";
  ctx.fillStyle = "#d4af37";
  
  let logoOffset = 0;
  if (hasLogo) {
    const logoH = 75;
    const logoW = logo.width * (logoH / logo.height);
    ctx.drawImage(logo, (width - logoW) / 2, 80, logoW, logoH);
    logoOffset = logoH + 20;
  } else {
    ctx.font = "bold 86px 'Cinzel', serif";
    ctx.fillText("LAV", width / 2, 180);
    logoOffset = 100;
  }
  
  try {
    await document.fonts.load("40px 'Great Vibes'");
  } catch(e) {}
  ctx.font = "40px 'Great Vibes', cursive";
  ctx.letterSpacing = "0px";
  ctx.fillText("Lav You Every Moment", width / 2, 100 + logoOffset + 40);

  drawSeparator(300);

  // 3. Profile Photo
  const photoW = 450;
  const photoH = 550;
  const photoX = (width - photoW) / 2;
  const photoY = 380;
  
  // Golden Frame
  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 6;
  ctx.strokeRect(photoX - 10, photoY - 10, photoW + 20, photoH + 20);
  
  // Photo with mythic treatment and center-cropping to prevent distortion
  ctx.filter = "none";
  
  const targetRatio = photoW / photoH;
  const sourceRatio = photo.width / photo.height;
  let sx, sy, sWidth, sHeight;

  if (sourceRatio > targetRatio) {
    sHeight = photo.height;
    sWidth = photo.height * targetRatio;
    sx = (photo.width - sWidth) / 2;
    sy = 0;
  } else {
    sWidth = photo.width;
    sHeight = photo.width / targetRatio;
    sx = 0;
    sy = (photo.height - sHeight) / 2;
  }

  ctx.drawImage(photo, sx, sy, sWidth, sHeight, photoX, photoY, photoW, photoH);
  ctx.filter = "none";

  // 4. Name & Identity
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 90px 'Cinzel', serif";
  ctx.fillText(result.user.nama.toUpperCase(), width / 2, 1060);

  ctx.fillStyle = "#d4af37";
  ctx.font = "bold italic 34px 'Libre Baskerville', serif";
  ctx.fillText(`${result.user.umur} Tahun  •  ${result.user.gender}`, width / 2, 1120);

  drawSeparator(1180);

  // 5. Content Section (Archetype)
  const contentY = 1260;
  
  // Archetype Avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(220, contentY + 80, 100, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.filter = "none";
  
  if (godImage.width > 0) {
    const targetRatio = 1; // square for the circle
    const sourceRatio = godImage.width / godImage.height;
    let sWidth, sHeight, sx, sy;

    if (sourceRatio > targetRatio) {
      sHeight = godImage.height;
      sWidth = godImage.height * targetRatio;
      sx = (godImage.width - sWidth) / 2;
      sy = 0;
    } else {
      sWidth = godImage.width;
      sHeight = godImage.width / targetRatio;
      sx = 0;
      sy = (godImage.height - sHeight) / 2;
    }

    ctx.drawImage(
      godImage,
      sx,
      sy,
      sWidth,
      sHeight,
      120, 
      contentY - 20, 
      200,
      200
    );
  }
  ctx.restore();

  // Avatar Border
  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(220, contentY + 80, 100, 0, Math.PI * 2);
  ctx.stroke();

  // Archetype Details (Right aligned columns)
  const textX = 380;
  ctx.textAlign = "left";
  
  // God Name
  ctx.fillStyle = "#d4af37";
  ctx.font = "900 70px 'Cinzel', serif";
  ctx.fillText(result.god.godName.toUpperCase(), textX, contentY + 10);

  // Subtitle/Domain
  ctx.font = "bold 26px 'Inter', sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText(result.god.title.toUpperCase(), textX, contentY + 50);
  ctx.letterSpacing = "0px";

  // Tags/Traits
  ctx.font = "bold 18px 'Space Mono', monospace";
  ctx.textBaseline = "middle";

  let traitXOffset = textX;
  const traitY = contentY + 95;
  const metricsPaddingX = 20;
  const metricsHeight = 36;

  result.god.traits.forEach(trait => {
    const text = trait.toUpperCase();
    const textWidth = ctx.measureText(text).width;
    const boxWidth = textWidth + metricsPaddingX * 2;
    
    // Draw rounded rect
    const radius = metricsHeight / 2;
    const boxX = traitXOffset;
    const boxY = traitY - metricsHeight / 2;
    
    ctx.beginPath();
    ctx.moveTo(boxX + radius, boxY);
    ctx.lineTo(boxX + boxWidth - radius, boxY);
    ctx.arcTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius, radius);
    ctx.lineTo(boxX + boxWidth, boxY + metricsHeight - radius);
    ctx.arcTo(boxX + boxWidth, boxY + metricsHeight, boxX + boxWidth - radius, boxY + metricsHeight, radius);
    ctx.lineTo(boxX + radius, boxY + metricsHeight);
    ctx.arcTo(boxX, boxY + metricsHeight, boxX, boxY + metricsHeight - radius, radius);
    ctx.lineTo(boxX, boxY + radius);
    ctx.arcTo(boxX, boxY, boxX + radius, boxY, radius);
    ctx.closePath();
    
    ctx.fillStyle = "rgba(212, 175, 55, 0.1)";
    ctx.fill();
    
    ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#d4af37";
    ctx.textAlign = "center";
    ctx.fillText(text, boxX + boxWidth / 2, traitY + 2);
    
    traitXOffset += boxWidth + 15;
  });
  
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // Description
  ctx.fillStyle = "#e0d8cc";
  ctx.font = "24px 'Inter', sans-serif"; // Using Inter for better readability at small scale
  const descLines = wrapText(ctx, result.god.description, width - textX - 80);
  descLines.slice(0, 5).forEach((line, i) => {
    ctx.fillText(line, textX, contentY + 165 + i * 34);
  });

  // 6. Career Section
  const careerY = 1648;
  ctx.textAlign = "center";
  ctx.fillStyle = "#d4af37";
  ctx.font = "bold 26px 'Inter', sans-serif";
  ctx.letterSpacing = "3px";
  ctx.fillText("✦ REKOMENDASI KARIR UTAMA ✦", width / 2, careerY);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = "#ffffff";
  ctx.font = "italic 32px 'Libre Baskerville', serif";
  result.god.careers.slice(0, 4).forEach((career, i) => {
    ctx.fillText(career, width / 2, careerY + 60 + i * 50);
  });

  // 7. Footer
  drawSeparator(1840);
  ctx.font = "bold 20px 'Inter', sans-serif";
  ctx.fillStyle = "rgba(212, 175, 55, 0.4)";
  ctx.letterSpacing = "2px";
  ctx.fillText(`LAV GREEK GOD FACE SCANNER  •  VERIFIED ARCHETYPE  •  ${new Date().getFullYear()}`, width / 2, 1890);

  return canvas.toDataURL("image/jpeg", 0.95);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}
