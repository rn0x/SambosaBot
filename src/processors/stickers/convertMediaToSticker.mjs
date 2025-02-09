import fs from 'fs-extra';
import path from 'path';
import { config } from '../../../config.mjs'
import convertVideoToWebp from '../../utils/convertVideoToWebp.mjs';
import hasMatchingKeywords from '../../utils/hasMatchingKeywords.mjs';
import logger from '../../utils/logger.mjs'

export async function convertMediaToSticker(message, MessageMedia, messageMeta) {
    try {


        const hasQuotedMsg = message.hasQuotedMsg;
        const keywords = ["!ملصق", "!استكر", "!متحرك", "!sticker", '!stk', 'ملصق'];
        const messageBody = message?.body || '';
        const messageCaption = message?._data?.caption || '';
        if (!hasMatchingKeywords(messageBody, keywords) && !hasMatchingKeywords(messageCaption, keywords)) return;
        const targetMessage = hasQuotedMsg ? await message.getQuotedMessage() : message;
        const uniqueId = Date.now(); // لتجنب تداخل الملفات

        if (!targetMessage.hasMedia) return
        const media = await targetMessage.downloadMedia();
        if (targetMessage?.type === 'image' || targetMessage?.type === 'document' && media.mimetype === 'image/png') {
            const processedMedia = new MessageMedia('image/png', media.data, `${uniqueId}.png`);
            // إرسال الصورة المعدلة
            // await client.sendMessage(message.from, processedMedia, { sendMediaAsSticker: true, stickerAuthor: author, stickerName: title });
            await message.reply(processedMedia, undefined, { sendMediaAsSticker: true, stickerAuthor: messageMeta.pushname || messageMeta.number, stickerName: config.stickerName });
            // await message.reply("*تم تحويل الصورة إلى ملصق بنجاح!* 🎁");
        } else if (targetMessage?.type === 'video' || targetMessage?.type === 'document' && media.mimetype === 'image/gif') {
            const tempDir = config.paths.temp; // مسار مجلد الصور
            const inputPath = path.resolve(tempDir, `input-${uniqueId}.mp4`);
            const outputPath = path.resolve(tempDir, `output-${uniqueId}.webp`);

            const dataBase64 = Buffer.from(media.data, 'base64');
            await fs.ensureDir(tempDir);
            await fs.writeFile(inputPath, dataBase64);

            const video = await convertVideoToWebp(inputPath, outputPath);
            if (video.success) {
                const videoBuffer = await fs.readFile(video.outputPath);
                const base64Video = videoBuffer.toString('base64');
                const processedMedia = new MessageMedia('image/webp', base64Video, `${uniqueId}.webp`);
                await message.reply(processedMedia, undefined, { sendMediaAsSticker: true, stickerAuthor: messageMeta.pushname || messageMeta.number, stickerName: config.stickerName });
                // await message.reply("*تم تحويل الفيديو إلى ملصق متحرك بنجاح!* 🎁");
                await fs.remove(video.outputPath);
            }

            await fs.remove(inputPath);
        }
    } catch (error) {
        logger.error('Error converting Media to sticker:', error);
        throw error;
    }
}
