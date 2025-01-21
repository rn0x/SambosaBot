// /processors/stickers/convertImageToStickerCircle.mjs

import fs from 'fs-extra';
import path from 'path';
import { config } from '../../../config.mjs';
import hasMatchingKeywords from '../../utils/hasMatchingKeywords.mjs';
import convertImageToCircle from '../../utils/convertImageToCircle.mjs';

export async function convertImageToStickerCircle(message, MessageMedia, messageMeta) {
    try {
        const hasQuotedMsg = message.hasQuotedMsg;
        if (!hasQuotedMsg) return;

        const keywords = ["!دائرة", "!دائره", "!circle"];
        if (!hasMatchingKeywords(message.body, keywords)) return;

        const getQuotedMessage = await message.getQuotedMessage();

        if (!getQuotedMessage.hasMedia) return;
        if (getQuotedMessage?.type !== 'image') return;

        const media = await getQuotedMessage.downloadMedia();
        if (media.mimetype !== 'image/jpeg') return;

        const uniqueId = Date.now(); // لتجنب تداخل الملفات
        const tempDir = config.paths.temp; // مسار مجلد الصور
        const inputPath = path.resolve(tempDir, `input-${uniqueId}.png`); // مسار الصورة المدخلة
        const outputPath = path.resolve(tempDir, `output-circle-${uniqueId}.png`); // مسار الصورة الناتجة

        await fs.ensureDir(tempDir);
        // حفظ الصورة في ملف مؤقت
        await fs.outputFile(inputPath, media.data, 'base64');

        // تحويل الصورة إلى دائرة باستخدام الوظيفة
        await convertImageToCircle(inputPath, outputPath);

        // قراءة الصورة الناتجة
        const imageBuffer = await fs.readFile(outputPath);
        const base64Image = imageBuffer.toString('base64');
        const processedMedia = new MessageMedia('image/png', base64Image, 'processed-circle-sticker.png');

        // إرسال الصورة المعدلة كملصق
        await message.reply(processedMedia, undefined, { sendMediaAsSticker: true, stickerAuthor: config.defaultAuthor, stickerName: messageMeta.pushname || messageMeta.number });

        // إرجاع رد للمستخدم
        await message.reply("🎉 *تم تحويل الصورة إلى ملصق دائري بنجاح!* ✨\n📽️ استمتع بالملصق!");

        // حذف الملفات المؤقتة
        await fs.remove(inputPath);
        await fs.remove(outputPath);
    } catch (error) {
        console.error('Error converting image to circular sticker:', error);
        await message.reply(`فشل في تحويل الصورة إلى ملصق دائري: ${error.message}`);
        throw error;
    }
}
