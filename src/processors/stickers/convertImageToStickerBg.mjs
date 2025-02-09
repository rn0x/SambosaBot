// /processors/stickers/convertImageToStickerBg.mjs

import fs from 'fs-extra';
import path from 'path';
import { config } from '../../../config.mjs'
import hasMatchingKeywords from '../../utils/hasMatchingKeywords.mjs';
import removeBackground from '../../utils/removeBackground.mjs'
import logger from '../../utils/logger.mjs'

export async function convertImageToStickerBg(message, MessageMedia, messageMeta) {
    try {

        const hasQuotedMsg = message.hasQuotedMsg;
        const keywords = ["!خلفية", "!خلفيه", "!remove", '!rmbg'];
        const messageBody = message?.body || '';
        const messageCaption = message?._data?.caption || '';
        if (!hasMatchingKeywords(messageBody, keywords) && !hasMatchingKeywords(messageCaption, keywords)) return;

        // تحديد الرسالة المستهدفة (إذا كانت هناك رسالة مقتبسة أو الرسالة نفسها)
        const targetMessage = hasQuotedMsg ? await message.getQuotedMessage() : message;
        if (!targetMessage.hasMedia) return;
        if (targetMessage?.type !== 'image') return await message.reply('يمكن إزالة خلفية الصور فقط! ⚠️');

        const media = await targetMessage.downloadMedia();
        if (media.mimetype !== 'image/jpeg') return

        const uniqueId = Date.now(); // لتجنب تداخل الملفات
        const tempDir = config.paths.temp; // مسار مجلد الصور
        const inputPath = path.resolve(tempDir, `input-${uniqueId}.png`); // مسار الصورة المدخلة

        await fs.ensureDir(tempDir);
        // حفظ الصورة في ملف مؤقت
        await fs.outputFile(inputPath, media.data, 'base64');

        const result = await removeBackground(inputPath);
        if (result.success) {
            // قراءة الصورة الناتجة
            const imageBuffer = await fs.readFile(result.outputPath);
            const base64Image = imageBuffer.toString('base64');
            const processedMedia = new MessageMedia('image/png', base64Image, 'processed-image.png');
            // إرسال الصورة المعدلة
            // await client.sendMessage(message.from, processedMedia, { sendMediaAsSticker: true, stickerAuthor: config.defaultAuthor, stickerName: messageMeta.pushname || messageMeta.number });
            await message.reply(processedMedia, undefined, { sendMediaAsSticker: true, stickerAuthor: messageMeta.pushname || messageMeta.number, stickerName: config.stickerName });
            // await message.reply("*تم تحويل الصورة إلى ملصق بنجاح بعد إزالة الخلفية!* 🎁");
            // حذف الملفات المؤقتة
            return await fs.remove(result.outputPath);
        } else {
            return await message.reply('Failed to remove background.');
        }
    } catch (error) {
        logger.error('Error converting image to sticker:', error);
        // await message.reply(`Error converting image to sticker: ${error}`);
        throw error;
    }
}
