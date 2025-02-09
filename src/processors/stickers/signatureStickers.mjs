// utils/signatureStickers.mjs
import path from 'path';
import fs from 'fs-extra';
import { config } from '../../../config.mjs';
import { generateImageFromHtml } from '../../utils/generateImage.mjs';


const imageBase64 = (filename) => {
    try {
        const imagePath = path.join(config.paths.public, 'images', filename);
        return fs.readFileSync(imagePath, { encoding: 'base64' });
    } catch (error) {
        console.log(error);
    }
}

const SIGNATURE_TEMPLATES = {
    1: {
        font: 'Cairo',
        textColor: '#2c3e50',
        image: `data:image/png;base64,${imageBase64('signatureStickers-1.png')}`,
    },
    2: {
        font: 'Lemonada',
        textColor: '#ecf0f1',
        image: `data:image/png;base64,${imageBase64('signatureStickers-2.png')}`,
    },
    3: {
        font: 'Changa',
        textColor: '#f1c40f',
        image: `data:image/png;base64,${imageBase64('signatureStickers-3.png')}`,
    },
    4: {
        font: 'Tajawal',
        textColor: '#2ecc71',
        image: `data:image/png;base64,${imageBase64('signatureStickers-4.png')}`,
    },
    5: {
        font: 'Amiri',
        textColor: '#f39c12',
        image: `data:image/png;base64,${imageBase64('signatureStickers-5.png')}`,
    }
};

export async function generateSignatureSticker(patternNumber, name) {
    const template = SIGNATURE_TEMPLATES[patternNumber];
    if (!template) throw new Error('النمط غير موجود');

    const htmlTemplate = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=${template.font.replace(' ', '+')}:wght@400;700&display=swap');
                    
            html {
                background-color: #00000000;
                background: transparent !important;
            }
            body {
                margin: 0;
                height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background-color: #00000000;
                background: transparent !important;
                font-family: '${template.font}', sans-serif;
            }
            .container {
                text-align: center;
                padding: 2rem;
                border-radius: 15px;
            }
            .signature-image {
                width: 320px;
                height: 320px;
                margin-bottom: 1.5rem;
                filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.2));
            }
            .name {
                font-size: 3.0rem;
                color: ${template.textColor};
                text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
                margin: 0;
                letter-spacing: 1px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <img src="${template.image}" class="signature-image" alt="Signature">
            <h1 class="name">${name}</h1>
        </div>
    </body>
    </html>
    `;

    return generateImageFromHtml({
        htmlTemplate,
        viewport: { width: 512, height: 512, deviceScaleFactor: 2 },
        retryCount: 3
    });
}

export default async function SignatureStickers(message, MessageMedia) {
    try {
        const commandMatch = message.body.match(/^!توقيع(\d{1,2})?\s*(.*)/);
        if (!commandMatch) return;

        let [, styleInput, text] = commandMatch;
        const styleNumber = styleInput
            ? Math.min(Math.max(parseInt(styleInput), 1), 5)
            : 1;

        if (!text?.trim()) {
            const exampleText = 'مثال: !توقيع فلان الفلاني';
            return await message.reply(`📝 يرجى إدخال نص صحيح بعد الأمر\n${exampleText}`);
        }

        const base64Image = await generateSignatureSticker(styleNumber, text.toLowerCase().trim());
        if (base64Image) {
            const media = new MessageMedia('image/png', base64Image, 'signature.png');

            await message.reply(media, null, {
                sendMediaAsSticker: true,
                stickerAuthor: text,
                stickerName: config.stickerName,
            });
        }
    } catch (error) {
        console.log(error);
        logger.error('فشل في إنشاء التوقيع:', error);
    }
}