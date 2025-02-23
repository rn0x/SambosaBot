import searchGoogleImages from '../../utils/searchGoogleImages.mjs';
import logger from '../../utils/logger.mjs';
import { config } from '../../../config.mjs';
import hasMatchingKeywords from '../../utils/hasMatchingKeywords.mjs';
import fetch from 'node-fetch';

export async function searchAndConvertToSticker(message, MessageMedia, messageMeta) {
    try {
        const keywords = ["!بحث_صورة", "!simg"];
        const messageText = message?.body || message?._data?.caption || '';

        // التأكد إذا كان هناك أمر بحث
        if (!hasMatchingKeywords(messageText, keywords)) return;

        // استخراج النص بعد الأمر (الاستعلام الذي سيتم البحث عنه)
        const extractedText = messageText.replace(/^[^\s]+\s*/, '').trim();
        if (!extractedText) return message.reply("يرجى إدخال كلمة البحث بعد الأمر.");

        const stickerAuthor = messageMeta.pushname || messageMeta.number;

        // البحث عن الصور باستخدام وظيفة searchGoogleImages
        const images = await searchGoogleImages(extractedText);

        // إذا لم يتم العثور على صور، إرسال رسالة خطأ
        if (!images || images.length === 0) {
            return message.reply("لم يتم العثور على صور تتوافق مع البحث.");
        }

        const limit = 5; // عدد الصور التي سيتم إرسالها
        let sentCount = 0; // عدد الصور المرسلة
        for (let i = 0; i < images.length && sentCount < limit; i++) {
            const imageUrl = images[i];

            // التحقق من صلاحية الرابط باستخدام node-fetch
            try {
                const response = await fetch(imageUrl, { method: 'GET', redirect: 'follow' });
                if (response.ok) {
                    const imageMedia = await MessageMedia.fromUrl(imageUrl);

                    // تحويل الصورة إلى ملصق وإرسالها
                    await message.reply(imageMedia, undefined, {
                        sendMediaAsSticker: true,
                        stickerAuthor: stickerAuthor,
                        stickerName: config.stickerName
                    });

                    sentCount++; // زيادة العداد عند إرسال صورة
                } else {
                    console.log(`رابط غير صالح: ${imageUrl}`);
                }
            } catch (error) {
                console.log(`فشل تحميل الصورة من الرابط: ${imageUrl}`);
            }
        }

    } catch (error) {
        logger.error('Error converting image to sticker:', error);
        throw error;
    }
}