import searchGoogleGifs from '../../utils/searchGoogleGifs.mjs';
import logger from '../../utils/logger.mjs';
import { config } from '../../../config.mjs';
import hasMatchingKeywords from '../../utils/hasMatchingKeywords.mjs';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs-extra';
import convertVideoToWebp from '../../utils/convertVideoToWebp.mjs';

/**
 * البحث عن الصور المتحركة (GIFs) وتحويلها إلى ملصقات WebP.
 * @param {object} message - الرسالة المستلمة.
 * @param {object} MessageMedia - كائن الوسائط من WhatsApp.
 * @param {object} messageMeta - بيانات الميتا للرسالة.
 */
export async function searchAndConvertToStickerGif(message, MessageMedia, messageMeta) {
    try {
        const keywords = ["!بحث_متحرك", "!sgif"]; // الكلمات التي يبحث بها عن GIFs
        const messageText = message?.body || message?._data?.caption || '';

        // التأكد من وجود أمر بحث خاص بـ GIF
        if (!hasMatchingKeywords(messageText, keywords)) return;

        // استخراج النص بعد الأمر (الاستعلام الذي سيتم البحث عنه)
        const extractedText = messageText.replace(/^[^\s]+\s*/, '').trim();
        if (!extractedText) return message.reply("يرجى إدخال كلمة البحث بعد الأمر.");

        const stickerAuthor = messageMeta.pushname || messageMeta.number;

        // البحث عن GIFs باستخدام searchGoogleGifs
        const gifs = await searchGoogleGifs(extractedText);

        // إذا لم يتم العثور على GIFs، إرسال رسالة خطأ
        if (!gifs || gifs.length === 0) {
            return message.reply("لم يتم العثور على GIFs تتوافق مع البحث.");
        }

        const limit = 5; // عدد الـ GIFs التي سيتم إرسالها
        let sentCount = 0; // عدد الـ GIFs المرسلة

        for (let i = 0; i < gifs.length && sentCount < limit; i++) {
            const gifUrl = gifs[i];

            // التحقق من صلاحية الرابط باستخدام node-fetch
            try {
                const response = await fetch(gifUrl, { method: 'GET', redirect: 'follow' });
                if (response.ok) {
                    // تحميل الـ GIF وتحويله إلى WebP
                    const gifResponse = await fetch(gifUrl);
                    const gifBuffer = await gifResponse.buffer();

                    // حفظ الملف المؤقت
                    const tempDir = config.paths.temp;
                    const uniqueId = Date.now().toString();
                    const inputPath = path.resolve(tempDir, `input-${uniqueId}.gif`);
                    const outputPath = path.resolve(tempDir, `output-${uniqueId}.webp`);

                    await fs.ensureDir(tempDir);
                    await fs.writeFile(inputPath, gifBuffer);

                    // تحويل GIF إلى WebP باستخدام دالة convertVideoToWebp
                    await convertVideoToWebp(inputPath, outputPath);

                    // قراءة WebP المحول وتحويله إلى ملصق
                    const webpBuffer = await fs.readFile(outputPath);
                    const base64Video = webpBuffer.toString('base64');
                    const webpMedia = new MessageMedia('image/webp', base64Video, `${uniqueId}.webp`);

                    // إرسال الـ WebP كملصق
                    await message.reply(webpMedia, undefined, {
                        sendMediaAsSticker: true,
                        stickerAuthor: stickerAuthor,
                        stickerName: config.stickerName
                    });

                    // حذف الملف المعالج بعد إرساله كملصق
                    await fs.remove(outputPath);

                    sentCount++; // زيادة العداد عند إرسال الـ WebP
                    if (sentCount >= limit) break; // التوقف إذا تم إرسال 5 ملصقات
                } else {
                    logger.info(`رابط غير صالح: ${gifUrl}`);
                }
            } catch (error) {
                logger.error('Error converting gif to sticker:', error);
                logger.error(`فشل تحميل الـ GIF من الرابط: ${gifUrl}`);
            }
        }

    } catch (error) {
        logger.error('Error converting gif to sticker:', error);
        throw error;
    }
}