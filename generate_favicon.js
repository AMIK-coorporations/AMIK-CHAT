const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'public', 'logo.png');
const outputPath = path.join(__dirname, 'public', 'favicon-v3.png');

async function processImage() {
    try {
        console.log('Processing image with improved background removal...');

        const { data, info } = await sharp(inputPath)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        // Target Green: #05c765
        const targetR = 5;
        const targetG = 199;
        const targetB = 101;

        // Increased threshold for cleaner edges (Euclidean distance)
        // Since the logo is likely Blue/White/Metallic, which are far from Green, 
        // we can be aggressive to remove the green fringe.
        const threshold = 120;

        let removedCount = 0;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Calculate Euclidean distance
            const distance = Math.sqrt(
                Math.pow(r - targetR, 2) +
                Math.pow(g - targetG, 2) +
                Math.pow(b - targetB, 2)
            );

            if (distance < threshold) {
                data[i + 3] = 0; // Transparent
                removedCount++;
            } else if (distance < threshold + 20) {
                // Soften edges (simple anti-aliasing for the fringe)
                // Linearly ramp up alpha from 0 to 255 as distance goes from threshold to threshold+20
                const alpha = Math.floor(255 * ((distance - threshold) / 20));
                data[i + 3] = Math.min(data[i + 3], alpha);
            }
        }

        await sharp(data, {
            raw: {
                width: info.width,
                height: info.height,
                channels: 4
            }
        })
            .png()
            .toFile(outputPath);

        console.log(`Successfully created favicon-v2.png. Removed background from ${removedCount} pixels.`);

    } catch (error) {
        console.error('Error processing image:', error);
    }
}

processImage();
