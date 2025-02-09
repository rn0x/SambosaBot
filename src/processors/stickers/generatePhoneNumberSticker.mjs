import fs from 'fs-extra';
import path from 'path';
import { config } from '../../../config.mjs';
import { generateImageFromHtml } from '../../utils/generateImage.mjs';
import logger from '../../utils/logger.mjs';

/**
 * إنشاء ملصق برقم الجوال.
 * @param {object} message - كائن الرسالة من whatsapp-web.js.
 * @param {MessageMedia} MessageMedia - فئة MessageMedia من whatsapp-web.js.
 * @param {object} messageMeta - معلومات إضافية عن الرسالة.
 * @returns {Promise<void>}
 */
export async function generatePhoneNumberSticker(message, MessageMedia, messageMeta) {
    try {
        const keywords = ["!رقمي", "!رقم", "!myphone"];
        const messageBody = message?.body || '';
        if (!keywords.includes(messageBody.trim())) return;

        const phoneNumber = messageMeta.number; // رقم الجوال من معلومات الرسالة
        const iconPath = path.join(config.paths.public, 'icons', 'whatsapp.webp'); // مسار الأيقونة

        // التأكد من وجود الأيقونة
        if (!fs.existsSync(iconPath)) {
            throw new Error('لم يتم العثور على أيقونة واتساب في المسار المحدد.');
        }

        // قراءة الأيقونة كـ base64
        const iconBase64 = fs.readFileSync(iconPath, { encoding: 'base64' });

        // قالب HTML لعرض رقم الجوال والأيقونة
        const htmlTemplate = `
            <!DOCTYPE html>
            <html lang="ar">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    @font-face {
                        font-family: 'Cairo';
                        src: url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
                    }
                    body {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background-color: #25D366;
                        font-family: 'Cairo', 'Noto Naskh Arabic', 'Arial', sans-serif;
                        color: white;
                    }
                    .container {
                        text-align: center;
                    }
                    .icon {
                        width: 100px;
                        height: 100px;
                        margin-bottom: 20px;
                    }
                    .phone-number {
                        font-size: 52px;
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <img src="data:image/png;base64,{{iconBase64}}" alt="WhatsApp Icon" class="icon">
                    <div class="phone-number">{{phoneNumber}}</div>
                </div>
            </body>
            </html>
        `;

        // إنشاء الصورة من القالب HTML
        const base64Image = await generateImageFromHtml({
            htmlTemplate: htmlTemplate,
            data: { phoneNumber: phoneNumber, iconBase64: iconBase64 },
            viewport: {
                width: 512,
                height: 512,
                deviceScaleFactor: 2
            },
            retryCount: 3
        });

        // إنشاء كائن MessageMedia
        const stickerMedia = new MessageMedia('image/png', base64Image, 'phone-sticker.png');

        // إرسال الملصق كرد
        await message.reply(stickerMedia, null, {
            sendMediaAsSticker: true,
            stickerAuthor: messageMeta.pushname || messageMeta.number,
            stickerName: config.stickerName
        });

    } catch (error) {
        logger.error('فشل في إنشاء ملصق رقم الجوال:', error);
    }
}