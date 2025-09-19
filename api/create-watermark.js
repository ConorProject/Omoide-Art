import sharp from 'sharp';
import fs from 'fs/promises';

// Create a simple text-based watermark for Omoide Art
async function createWatermark() {
  try {
    console.log('Creating watermark image...');

    // Create SVG text watermark
    const svgWatermark = `
      <svg width="300" height="80" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .watermark-text {
              font-family: 'Arial', sans-serif;
              font-weight: 600;
              fill: rgba(255, 255, 255, 0.7);
              text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
            }
            .watermark-url {
              font-family: 'Arial', sans-serif;
              font-weight: 400;
              fill: rgba(255, 255, 255, 0.6);
              text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
            }
          </style>
        </defs>

        <!-- Main text -->
        <text x="150" y="35" text-anchor="middle" class="watermark-text" font-size="24">
          Omoide Art
        </text>

        <!-- Japanese text -->
        <text x="150" y="55" text-anchor="middle" class="watermark-url" font-size="14">
          思い出アート
        </text>

        <!-- Website URL -->
        <text x="150" y="72" text-anchor="middle" class="watermark-url" font-size="12">
          omoide-art.shop
        </text>
      </svg>
    `;

    // Convert SVG to PNG with transparency
    const watermarkBuffer = await sharp(Buffer.from(svgWatermark))
      .png()
      .toBuffer();

    // Save the watermark
    await fs.writeFile('./watermark.png', watermarkBuffer);

    console.log('✅ Watermark created successfully: ./watermark.png');
    console.log('📐 Size: 300x80px with transparency');
    console.log('🎨 Style: Semi-transparent white text with shadow');

  } catch (error) {
    console.error('❌ Error creating watermark:', error);
  }
}

// Run the watermark creation
createWatermark();