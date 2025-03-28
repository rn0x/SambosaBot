// /processors/stickers/stealSticker.mjs

import path from 'path';
import fs from 'fs-extra';
import { config } from '../../../config.mjs'
import hasMatchingKeywords from '../../utils/hasMatchingKeywords.mjs';
import logger from '../../utils/logger.mjs'

export async function stealSticker(message, MessageMedia, messageMeta) {
    try {
        const hasQuotedMsg = message.hasQuotedMsg;
        if (!hasQuotedMsg) return;

        const keywords = ["!اسرق", "!أسرق", "!آسرق", "!سرقه", "!سرقة", "!steal", "!stealsticker"];
        if (!hasMatchingKeywords(message.body, keywords)) return;

        // استخراج النص بعد الأمر (إن وُجد)
        const extractedText = message.body.replace(/^[^\s]+\s*/, '').trim();
        const stickerAuthor = extractedText || messageMeta.pushname || messageMeta.number;

        const quotedMessage = await message.getQuotedMessage();
        if (!quotedMessage.hasMedia) return;
        if (quotedMessage.type !== 'sticker') return; // التحقق من أن الرسالة المقتبسة تحتوي على ملصق

        const media = await quotedMessage.downloadMedia();

        const uniqueId = Date.now(); // لتجنب تداخل الملفات
        // إنشاء نسخة جديدة من الملصق بحقوق جديدة
        const processedMedia = new MessageMedia('image/webp', media.data, `sticker-${uniqueId}.webp`);
        const stickerOptions = {
            sendMediaAsSticker: true,
            stickerAuthor: stickerAuthor,
            stickerName: config.stickerName
        };

        // إرسال الملصق الجديد
        await message.reply(processedMedia, undefined, stickerOptions);
        await message.reply("🎉 تم سرقة الملصق بنجاح! 🎉\n📜 بواسطة: " + stickerOptions.stickerAuthor);
    } catch (error) {
        logger.error('Error stealing sticker:', error);
        // await message.reply(`Error stealing sticker: ${error.message}`);
        throw error;
    }
}
