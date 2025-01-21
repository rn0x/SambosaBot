// /processors/stickers/convertImageToStickerBg.mjs

import fs from 'fs-extra';
import path from 'path';
import { config } from '../../../config.mjs'
import hasMatchingKeywords from '../../utils/hasMatchingKeywords.mjs';
import removeBackground from '../../utils/removeBackground.mjs'

export async function convertImageToStickerBg(message, MessageMedia, messageMeta) {
    try {

        const hasQuotedMsg = message.hasQuotedMsg;
        if (!hasQuotedMsg) return
        const keywords = ["!خلفية", "!خلفيه", "!remove", '!rmbg'];
        if (!hasMatchingKeywords(message.body, keywords)) return
        const getQuotedMessage = await message.getQuotedMessage();

        if (!getQuotedMessage.hasMedia) return
        if (getQuotedMessage?.type !== 'image') return

        const media = await getQuotedMessage.downloadMedia();
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
            await message.reply(processedMedia, undefined, { sendMediaAsSticker: true, stickerAuthor: config.defaultAuthor, stickerName: messageMeta.pushname || messageMeta.number });
            await message.reply("✨ *تم تحويل الصورة إلى ملصق بنجاح بعد إزالة الخلفية!* ✨\n🎉 الملصق جاهز الآن!");
            // حذف الملفات المؤقتة
            await fs.remove(result.outputPath);
        } else {
            await message.reply('Failed to remove background.');
        }
    } catch (error) {
        console.error('Error converting image to sticker:', error);
        await message.reply(`Error converting image to sticker: ${error}`);
        throw error;
    }
}
