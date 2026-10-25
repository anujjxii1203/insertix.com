import sharp from "sharp";
import fs from "fs";
import path from "path";

async function processLogo() {
  console.log("Processing logo from public/logo.jpeg...");
  
  // 1. Trim whitespace and get raw pixels
  const trimmed = await sharp("public/logo.jpeg")
    .trim({ threshold: 10 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = trimmed.info;
  const rawData = trimmed.data;

  // Buffers for light logo (black text + red) and dark logo (white text + red)
  const lightBuffer = Buffer.alloc(width * height * 4);
  const darkBuffer = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const idx = i * channels;
    const r = rawData[idx];
    const g = rawData[idx + 1];
    const b = rawData[idx + 2];

    // Check if pixel is background (near white: r, g, b all > 230)
    // Calculate distance from pure white (255, 255, 255)
    const brightness = (r + g + b) / 3;

    if (brightness > 245) {
      // Fully transparent
      lightBuffer[idx] = 0;
      lightBuffer[idx + 1] = 0;
      lightBuffer[idx + 2] = 0;
      lightBuffer[idx + 3] = 0;

      darkBuffer[idx] = 0;
      darkBuffer[idx + 1] = 0;
      darkBuffer[idx + 2] = 0;
      darkBuffer[idx + 3] = 0;
    } else {
      // Determine if pixel is RED or DARK/NEUTRAL
      // Red color in logo typically has R significantly greater than G and B
      const isRed = r > 120 && (r - g > 40) && (r - b > 40);

      // Smooth anti-aliasing alpha based on brightness
      let alpha = 255;
      if (brightness > 210) {
        alpha = Math.round(255 * (245 - brightness) / 35);
      }

      if (isRed) {
        // Red part: keep red on both light and dark logos
        lightBuffer[idx] = r;
        lightBuffer[idx + 1] = g;
        lightBuffer[idx + 2] = b;
        lightBuffer[idx + 3] = alpha;

        darkBuffer[idx] = r;
        darkBuffer[idx + 1] = g;
        darkBuffer[idx + 2] = b;
        darkBuffer[idx + 3] = alpha;
      } else {
        // Black/neutral text ("iN", "MEDIA")
        // On light background: keep black (#0A0A0A)
        lightBuffer[idx] = Math.min(10, r);
        lightBuffer[idx + 1] = Math.min(10, g);
        lightBuffer[idx + 2] = Math.min(10, b);
        lightBuffer[idx + 3] = alpha;

        // On dark background: turn white (#FFFFFF)
        darkBuffer[idx] = 255;
        darkBuffer[idx + 1] = 255;
        darkBuffer[idx + 2] = 255;
        darkBuffer[idx + 3] = alpha;
      }
    }
  }

  // Target standard logo width (e.g. 500px width with proportional height)
  const targetWidth = 500;
  const targetHeight = Math.round((height / width) * targetWidth);

  // Save light logo (public/logo.webp)
  await sharp(lightBuffer, { raw: { width, height, channels: 4 } })
    .resize(targetWidth, targetHeight)
    .webp({ quality: 80, alphaQuality: 90, effort: 6 })
    .toFile("public/logo.webp");

  const lightStats = fs.statSync("public/logo.webp");
  console.log(`Saved public/logo.webp (${targetWidth}x${targetHeight}, ${Math.round(lightStats.size / 1024)}KB)`);

  // Save dark logo (public/logo-dark.webp)
  await sharp(darkBuffer, { raw: { width, height, channels: 4 } })
    .resize(targetWidth, targetHeight)
    .webp({ quality: 80, alphaQuality: 90, effort: 6 })
    .toFile("public/logo-dark.webp");

  const darkStats = fs.statSync("public/logo-dark.webp");
  console.log(`Saved public/logo-dark.webp (${targetWidth}x${targetHeight}, ${Math.round(darkStats.size / 1024)}KB)`);

  // Generate Favicons: 32x32 and 180x180 (apple-touch-icon)
  // For favicon, crop/pad the mark to square with nice margin
  await sharp("public/logo.webp")
    .resize(180, 180, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile("public/apple-touch-icon.png");

  await sharp("public/logo.webp")
    .resize(32, 32, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile("public/favicon-32x32.png");

  // Also save favicon.ico replacement
  await sharp("public/logo.webp")
    .resize(48, 48, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile("public/favicon.ico");

  // Open Graph Image (1200x630, sleek branding)
  const ogBackground = await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 1 }, // #0A0A0A
    },
  }).png().toBuffer();

  const ogLogo = await sharp("public/logo-dark.webp")
    .resize(600, null)
    .toBuffer();

  await sharp(ogBackground)
    .composite([
      { input: ogLogo, gravity: "center" },
    ])
    .webp({ quality: 85 })
    .toFile("public/og-image.webp");

  console.log("All logo assets and favicons generated successfully!");
}

processLogo().catch(console.error);
